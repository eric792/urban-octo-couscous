# Zen Amour

Affordable-luxury e-commerce store for South Africa — inspired fragrances, skincare and wellness.
Next.js 15 (App Router) · TypeScript · Tailwind CSS · PostgreSQL (Prisma) · Yoco · Payfast · Pargo.

## What's included

**Storefront**

- Homepage, shop with category / price / stock filters, search and sorting
- Product pages with size variants, scent pyramid, reviews, related products and Product JSON-LD
- Slide-out bag + bag page with a free-delivery meter
- Checkout: contact → delivery (Pargo pickup point, Pargo door-to-door, standard courier) → payment (Yoco card, Payfast, manual EFT)
- Discount codes, server-side pricing (the browser never sends prices), stock checks
- Order confirmation page (polls until the payment webhook lands), cancelled/failed page
- Order tracking by order number + email, Journal (blog), shipping & returns, contact, POPIA privacy page
- Meta, TikTok, GA4 and GTM pixels: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase (ZAR)
- Floating WhatsApp button, sitemap.xml, robots.txt, Open Graph image

**Owner dashboard** (`/admin`)

- Overview: revenue (today / 30 days with trend), orders, average order, daily revenue chart, top products, low stock
- Orders: filter by status, search, one-click Process → Ship → Complete, order detail with timeline, notes, EFT confirmation, Pargo waybill generation and tracking numbers
- Inventory: inline stock editing, create/edit products with multiple sizes, hide/show, featured
- Customers: CRM built from paid orders (guest checkout included) with VIP / Loyal / Repeat / New / Lapsed segments and CSV export
- Marketing: discount codes, newsletter list + CSV export, abandoned checkouts with a WhatsApp follow-up link
- Journal editor, store / delivery fee / payment / Pargo settings, pixel & social settings

## Run it locally

Requires Node 20+ and PostgreSQL.

```bash
npm install
cp .env.example .env        # then fill in DATABASE_URL, AUTH_SECRET, SEED_ADMIN_PASSWORD
npm run db:migrate          # creates the tables
npm run db:seed             # catalogue, journal, discount codes, admin user (+ demo data)
npm run dev
```

Open http://localhost:3000 and http://localhost:3000/admin (sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

Generate `AUTH_SECRET` with `openssl rand -base64 48`.

## Deploy (e.g. Vercel + Neon / Supabase Postgres)

1. Create a Postgres database and set `DATABASE_URL`.
2. Set every variable from `.env.example` in your host. `APP_URL` must be your public `https://` domain.
3. Build command: `npm run build`. Run `npm run db:deploy` once per release to apply migrations, and `npm run db:seed` the first time (with `SEED_DEMO_DATA="false"` for a live store).

## Payments

### Yoco (card, Apple Pay, Google Pay)

1. Copy your secret key from the Yoco portal into `YOCO_SECRET_KEY` (`sk_test_…` to test, `sk_live_…` for live).
2. After deploying, run `npm run yoco:webhook` (with `APP_URL` set to your live domain). It prints a `whsec_…` secret — put it in `YOCO_WEBHOOK_SECRET` and redeploy.
3. Orders are marked paid only by the signed webhook, and only if the amount matches the order total.

### Payfast (card, Instant EFT, SnapScan, Mobicred…)

1. Set `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY` and the passphrase from Payfast → Settings → Developer Settings in `PAYFAST_PASSPHRASE`.
2. `PAYFAST_SANDBOX="true"` uses sandbox.payfast.co.za. Set it to `"false"` for live.
3. The ITN URL (`/api/webhooks/payfast`) is sent with every payment. Each notification is checked for signature, merchant id, Payfast's server confirmation and amount. Set `PAYFAST_VERIFY_SOURCE_IP="true"` in live to also check that it came from Payfast's servers.

Payfast and Yoco can't reach `localhost`. To test webhooks locally, use a tunnel (for example ngrok) and set `APP_URL` to the tunnel URL.

### Manual EFT

Add your bank details in **Admin → Settings → Payment gateways**. EFT appears at checkout once an account number is saved. When the money reflects, open the order and click **Confirm EFT received** (this deducts stock and emails the customer).

## Pargo

Ask Pargo for API credentials, a map token and the API base URL for your account (staging and live). Enter them in **Admin → Settings → Pargo**, or set `PARGO_USERNAME` / `PARGO_PASSWORD` / `PARGO_MAP_TOKEN` / `PARGO_API_BASE_URL` (env vars take precedence).

- Until Pargo is connected, checkout in sandbox mode shows clearly-labelled **demo pickup points** so you can test the flow. In live mode without credentials, pickup search returns an error instead.
- With a map token, shoppers can also choose a point on Pargo's official map.
- **Generate Pargo waybill** on a paid order creates the shipment and stores the tracking code.
- Give Pargo the status webhook `https://YOUR-DOMAIN/api/webhooks/pargo?secret=PARGO_WEBHOOK_SECRET`. "In transit" marks orders shipped; "collected" or "delivered" marks them delivered.
- The request body sent to Pargo lives in `src/lib/pargo.ts` (`createPargoShipment`). Check it against the API documentation Pargo gives you.

## Pixels & social

Add the Meta Pixel, TikTok Pixel, GA4 and GTM IDs in **Admin → Settings → Pixels & social**. IDs are validated before they're injected into the page. Leave a field blank to switch that pixel off. Instagram, Facebook and TikTok links appear in the footer; the WhatsApp number powers the floating chat button.

## Email (optional)

Set `RESEND_API_KEY`, `EMAIL_FROM` (on a domain verified in Resend) and optionally `ORDER_ALERT_EMAIL`. Customers then get an order confirmation and a shipping notice. Without a key, emails are only logged to the server console.

## Before you launch

- [ ] Replace the generated product art in `public/images` with real photos (or paste Cloudinary / S3 URLs per product in Admin → Inventory).
- [ ] Review product names, descriptions, prices and stock; edit the sample copy on the homepage.
- [ ] Remove demo customers, reviews and orders: `npm run db:clear-demo`.
- [ ] Use a strong admin password: `npm run admin:create -- you@yourdomain.co.za "a-long-password"`.
- [ ] Switch Yoco to `sk_live_…`, Payfast to live (`PAYFAST_SANDBOX="false"`) and Pargo to live.
- [ ] Register the Yoco webhook against the live domain and give Pargo the status webhook URL.
- [ ] Update the contact email, announcement bar and delivery fees in Admin → Settings.
- [ ] Have the returns, privacy and wellness wording checked for your business (CPA, POPIA, SAHPRA).

## SEO

- Category pages live at `/shop/<category>` (old `?category=` links redirect permanently). Each has an editable H1, SEO title, meta description, intro and a Markdown guide + FAQ under the products: **Admin → Inventory → Category pages**. FAQ sections are also sent to Google as structured data.
- Products have concentration, scent family/type, an optional "inspired by" field (get IP advice before using it) and optional SEO title/description overrides. Titles and descriptions are generated when left blank.
- Filtered, sorted and search views are `noindex, follow` with a clean canonical.
- The 11 [superseo skills](https://github.com/inhouseseo/superseo-skills) (Apache 2.0) are installed in `.claude/skills/` for Claude Code: `page-audit`, `eeat-audit`, `improve-content`, `write-content`, `content-brief`, `keyword-deep-dive`, `semantic-gap-analysis`, `topic-cluster-planning`, `featured-snippet-optimizer`, `linkbuilding`, `expert-interview`. The first audit is in [`docs/seo/page-audit.md`](docs/seo/page-audit.md).

## Error monitoring (Sentry)

Set up per the [Sentry Next.js guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/): `src/instrumentation-client.ts`, `src/sentry.server.config.ts`, `src/sentry.edge.config.ts`, `src/instrumentation.ts` (`onRequestError`), `src/app/global-error.tsx`, plus storefront and admin error pages. `next.config.ts` is wrapped with `withSentryConfig`, and browser events go through `/monitoring` so ad blockers don't drop them.

1. Create a Next.js project in Sentry and copy its DSN into `NEXT_PUBLIC_SENTRY_DSN`.
2. For readable stack traces, set `SENTRY_ORG`, `SENTRY_PROJECT` and `SENTRY_AUTH_TOKEN` where you build (CI or your host). Never commit the token.
3. Without a DSN, Sentry stays switched off. Nothing is sent.

Shop-specific reporting (`src/lib/monitoring.ts`):
- **Errors:** payment start failures, Pargo search and waybill failures, email failures.
- **Alerts:** payment amount mismatches, rejected Payfast notifications, webhooks for unknown orders.
- **Logs and metrics:** `checkout.started`, `order.paid`, `order.value`, `order.payment_failed`.

**Privacy (POPIA):** the SDK is told not to collect user identity or IP address, cookies, request bodies (checkout forms), database query values or local variables. Session replays are recorded only when an error happens, with all text and inputs masked. Never add customer emails, phones or addresses to Sentry tags or logs; use order numbers.

## Claude Code skills

`.claude/skills/` contains two skill packs that Claude Code picks up automatically in this repo:

- **SEO** — the 11 [superseo skills](https://github.com/inhouseseo/superseo-skills) (Apache 2.0) described above.
- **Development workflow** — the 15 [superpowers skills](https://github.com/obra/superpowers) (MIT): `brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review`, `receiving-code-review`, `using-git-worktrees`, `finishing-a-development-branch`, `subagent-driven-development`, `dispatching-parallel-agents`, `writing-skills`, `using-superpowers`, `diagnosing-superpowers`.

The superpowers session-start hook isn't included. For the full plugin (with the hook that reminds Claude to use the skills every session), run `/plugin install superpowers@claude-plugins-official` in Claude Code.

## Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build / server |
| `npm run db:migrate` | Create / apply migrations in development |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Seed catalogue, journal, codes, admin (+ demo data) |
| `npm run db:clear-demo` | Remove demo customers, reviews and orders |
| `npm run admin:create -- email "password"` | Create an admin or reset a password |
| `npm run yoco:webhook` | Register the Yoco webhook and print its secret |
| `npm run images` | Regenerate the placeholder product art |

## Project structure

```
prisma/              schema.prisma, migrations, seed.ts
public/images/       product art, journal covers, hero texture
scripts/             image generator, Yoco webhook, admin + demo-data tools
src/app/(storefront) home, shop, product/[slug], cart, checkout, blog, policies
src/app/admin        login + dashboard (orders, inventory, customers, marketing, journal, settings)
src/app/api          checkout, quote, Pargo pickup points, Yoco/Payfast/Pargo webhooks, CSV exports
src/actions          server actions (admin, newsletter, order tracking, auth)
src/components       storefront, checkout, admin, tracking, ui
src/lib              db, pricing, orders, payments/, pargo, settings, catalog, email, tracking/
```

## Notes

- The in-memory rate limiter protects a single server. On serverless or multi-instance hosting, swap it for Redis (e.g. Upstash).
- Refunds are processed in the Yoco or Payfast dashboard. Marking an order "Refunded" in admin only records it.
