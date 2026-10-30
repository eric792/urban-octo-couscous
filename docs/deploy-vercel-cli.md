# Deploy to Vercel from the command line

Runbook for deploying with the Vercel CLI instead of clicking through the dashboard.
It was written for a Claude Code cloud session, but works the same in any terminal.
For the dashboard route, see [deploy-vercel.md](deploy-vercel.md).

## Before you start
- The machine can reach `vercel.com`, `api.vercel.com` and `*.vercel.app`.
- A Vercel access token is available as `VERCEL_TOKEN`. Create it at https://vercel.com/account/tokens.
  Keep it out of chats and logs.
- The database is Neon and rate limiting uses Upstash Redis, both added through Vercel and both in Frankfurt.

## Steps
1. **Preflight**
   - Check `curl https://api.vercel.com` responds and `VERCEL_TOKEN` is set. Never print the token.
   - Run `npm i -g vercel`, then `vercel whoami --token "$VERCEL_TOKEN"`.
   - If `vercel teams ls` shows more than one team, ask the user which one.
2. **Create and link the project.** From the repo root, run `vercel link --yes --project zen-amour --token …`. Next.js is detected; `vercel.json` provides the build command and region.
3. **Secrets.** Generate `AUTH_SECRET` (48 random bytes, base64), `SEED_ADMIN_PASSWORD` (24 characters) and `PARGO_WEBHOOK_SECRET`. Save them to a scratchpad file.
4. **Environment variables.** Add each with `printf %s "$VALUE" | vercel env add NAME <env> --token …`.
   - Production + Preview:
     - `AUTH_SECRET`, `PARGO_WEBHOOK_SECRET`
     - `PAYFAST_MERCHANT_ID=10000100`, `PAYFAST_MERCHANT_KEY=46f0cd694581a` (Payfast's public sandbox account)
     - `PAYFAST_SANDBOX=true`, `PAYFAST_VERIFY_SOURCE_IP=false`
     - `EMAIL_FROM=Zen Amour <orders@zenamour.co.za>`
   - Production only:
     - `SEED_ADMIN_EMAIL=admin@zenamour.co.za`, `SEED_ADMIN_PASSWORD`, `SEED_DEMO_DATA=false`
5. **Neon and Upstash.**
   - Try `vercel integration add neon` (Frankfurt, free plan), then the same for Upstash Redis.
   - If the CLI needs a browser or terms acceptance, stop and ask the user: in Vercel → project → **Storage** → **Create Database**, add **Neon** (Frankfurt) and then **Upstash Redis** (Frankfurt), connecting each to all environments.
   - Confirm with `vercel env ls` that `DATABASE_URL`, `DATABASE_URL_UNPOOLED` and the Redis variables exist.
6. **Deploy.** Run `vercel deploy --prod --token …`, which uploads the source and builds on Vercel.
   - Read the logs with `vercel inspect <url> --logs`. Expect "Applying database migrations…", "New database — loading the catalogue…" and "Admin created".
   - If Vercel refuses the `fra1` region on the user's plan, ask before changing it. The function region must stay next to the Frankfurt database.
7. **Check the live site** at `https://<project>.vercel.app`:
   - The home page returns 200, and `/shop` lists 14 products.
   - `robots.txt` and the canonical tag use the live domain.
   - `POST /api/checkout/quote` returns a price.
   - Signing in at `/admin` with the seeded password works (Playwright).
8. **Clean up.** Run `vercel env rm SEED_ADMIN_PASSWORD production --yes`.
9. **Automatic deploys.** Run `vercel git connect https://github.com/eric792/urban-octo-couscous`.
   - If Vercel has no GitHub access to the repo, tell the user: Vercel → project → Settings → Git → Connect, and allow the Vercel GitHub app on that repo.
10. **Report** the live URL, and send the admin email and password as a file. List what's left:
    - Pro plan (Hobby is non-commercial).
    - Custom domain.
    - Live Payfast details.
    - Yoco key and webhook (`npm run yoco:webhook` once the domain is live).
    - Optionally, revoke the token.

## Verification
- `vercel inspect` shows the build succeeded, with the migration and first-run lines.
- Live checks from step 7 all pass, and checking the database through the app shows 0 demo orders.
- `vercel env ls` no longer lists `SEED_ADMIN_PASSWORD` for production.
- A second `vercel deploy --prod` logs "Store already set up" and leaves the data untouched.
