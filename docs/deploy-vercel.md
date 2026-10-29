# Deploy Zen Amour on Vercel

About 15 minutes, all in the browser. You'll connect:

- **Vercel** to host the store, built from the GitHub repository.
- **Neon Postgres** for the database, added from Vercel's Storage tab.
- **Upstash Redis** for rate limits, also added from the Storage tab.

The project is already configured for Vercel (`vercel.json`):
- Every production deploy applies database changes.
- The very first one loads the catalogue, store settings and your admin account.
- Server code runs in Frankfurt (`fra1`), next to the database.

> **Plan:** Vercel's free Hobby plan is for personal, non-commercial use. A live shop needs the Pro plan. Neon's and Upstash's free tiers are fine to start.

## 1. Import the repository

1. Go to <https://vercel.com/new> and choose **Import Git Repository**.
2. Pick `eric792/urban-octo-couscous`. If it isn't listed, choose **Adjust GitHub App Permissions** and give Vercel access to it.
3. Leave the framework (Next.js) and the build settings as they are.

## 2. Add the settings

Still on the import screen, open **Environment Variables** and paste the contents of `vercel.env` (the file Claude sent you). Vercel splits it into separate variables. If you don't have the file, see the [variable list](#environment-variables) below.

Then click **Deploy**. The first build will stop with *"DATABASE_URL isn't set"*. That's expected, because the database comes next.

## 3. Add the database

1. In the project, open **Storage** → **Create Database** → **Neon** (Serverless Postgres).
2. Choose the **Frankfurt (eu-central-1)** region.
3. Connect it to the project for all environments.

This adds `DATABASE_URL` and `DATABASE_URL_UNPOOLED` for you.

> Using a different database (Supabase, your own server)? Set `DATABASE_URL` to its pooled connection and `DATABASE_URL_UNPOOLED` to its direct connection yourself. If it isn't in Frankfurt, change `"regions"` in `vercel.json` to the closest [Vercel region](https://vercel.com/docs/regions).

## 4. Add Redis (rate limits)

1. Open **Storage** → **Create Database** → **Upstash** (Redis).
2. Choose **Frankfurt**.
3. Connect it to the project.

## 5. Deploy

Open **Deployments**, then on the latest one click **⋯** → **Redeploy**. The build log should show:

```
[vercel-build] Applying database migrations…
[vercel-build] New database — loading the catalogue, settings and admin account…
Admin created: admin@zenamour.co.za
```

Open the site, go to `/admin`, and sign in with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`.

Then delete `SEED_ADMIN_PASSWORD` under **Settings → Environment Variables**. It's only used once.

Later deploys still apply database changes, but they never touch your products, prices, orders or settings.

## 6. Your domain

Go to **Settings → Domains** and add `zenamour.co.za`. Payment links, emails, the sitemap and SEO tags switch to it automatically. Set `APP_URL` only if you want a different domain than the one Vercel shows as primary.

## 7. Payments and delivery

- **Payfast** works straight away in sandbox (test) mode. To go live:
  1. Set your own `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY` and `PAYFAST_PASSPHRASE`.
  2. Set `PAYFAST_SANDBOX` to `false` and `PAYFAST_VERIFY_SOURCE_IP` to `true`.
  3. Redeploy.
- **Yoco:**
  1. Add `YOCO_SECRET_KEY`.
  2. Register the webhook once against your live domain. Run `npm run yoco:webhook` from a computer that has the project, with `APP_URL` set to your domain, or ask Claude to do it.
  3. Put the secret it prints into `YOCO_WEBHOOK_SECRET` and redeploy.
- **Pargo:**
  1. Enter your credentials in **Admin → Settings**, or as `PARGO_*` variables.
  2. Give Pargo this status webhook: `https://YOUR-DOMAIN/api/webhooks/pargo?secret=PARGO_WEBHOOK_SECRET`.

After changing variables, always **Redeploy**. Vercel only applies them to new deployments.

## 8. Optional

- **Error monitoring:** add the [Sentry integration](https://vercel.com/integrations/sentry) from the Vercel Marketplace. It sets the Sentry variables for you.
- **Emails:** set `RESEND_API_KEY`, `EMAIL_FROM` and `ORDER_ALERT_EMAIL` (see the README).

## Preview deployments

Every branch you push to GitHub gets its own preview URL.

- Previews use the same database as the live store, so be careful with test orders there.
- Previews never change the database structure. If you turn on Neon's preview branches (a separate database per preview), set `MIGRATE_ON_PREVIEW` to `true` for the Preview environment.
- Previews are hidden from search engines.
- Vercel's login protection on previews blocks payment notifications. Test payments on the live domain in sandbox mode.

## Environment variables

| Variable | Needed | Where it comes from |
|---|---|---|
| `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | Yes | Neon integration (step 3) |
| `AUTH_SECRET` | Yes | Random, 32+ characters (`openssl rand -base64 48`) |
| `SEED_ADMIN_EMAIL` | First deploy | Your admin sign-in email |
| `SEED_ADMIN_PASSWORD` | First deploy | 12+ characters. Delete after the first deploy |
| `SEED_DEMO_DATA` | No | `true` adds demo customers and orders (default `false` on Vercel) |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) | Recommended | Upstash integration (step 4) |
| `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_SANDBOX`, `PAYFAST_VERIFY_SOURCE_IP` | For Payfast | Payfast dashboard |
| `YOCO_SECRET_KEY`, `YOCO_WEBHOOK_SECRET` | For Yoco | Yoco portal, then `npm run yoco:webhook` |
| `PARGO_USERNAME`, `PARGO_PASSWORD`, `PARGO_MAP_TOKEN`, `PARGO_WEBHOOK_SECRET` | For Pargo | Pargo (or Admin → Settings) |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ORDER_ALERT_EMAIL` | No | Resend |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | No | Sentry integration |
| `APP_URL` | No | Only to force a specific domain |
| `MIGRATE_ON_PREVIEW` | No | `true` only with separate preview databases |

## If a build fails

- **"DATABASE_URL isn't set"**: do step 3, then redeploy.
- **"First deploy: add SEED_ADMIN_PASSWORD…"**: add it (12+ characters), then redeploy.
- **Migration errors**: check that `DATABASE_URL_UNPOOLED` is set, which the Neon integration does. Then redeploy.
