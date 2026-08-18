# SDB WEAR — Premium Motorcycle Protection & Leather Gear (Pakistan)

SDB WEAR is a production-ready, **100% free-to-host** e-commerce platform: a
statically exported Next.js storefront on **GitHub Pages** (`https://www.sdbbuy.com`),
backed entirely by **Supabase** (Postgres, Auth, Row Level Security, Edge
Functions). There is no traditional application server anywhere in this stack.

The brand (roots in 2017, Pakistan) sells **premium motorcycle protection and
leather gear** — moto suits, moto gloves, moto shoes, leather jackets and
handcrafted stitched gloves — with secure
card checkout internationally.

## Architecture

```
Browser (GitHub Pages, static HTML/JS)
   │
   ├── Supabase Postgres (via supabase-js, anon key, RLS-protected reads)
   │       - public product/category catalog reads
   │       - authenticated users' own orders
   │
   └── Supabase Edge Functions (Deno, service-role key, the ONLY place
       that computes prices and writes orders/order_items)
           - create-checkout        → Stripe Checkout Session (USD, international)
           - local-gateway-checkout  → JazzCash / Safepay mock template (PKR)
           - stripe-webhook          → verifies Stripe signature, marks orders paid
```

**Why this is safe with no backend server:** every price the customer is
charged is recomputed from the `products` / `product_variants` tables inside
an Edge Function running with the Supabase **service role** key. The browser
never sends a price — only `product_id`, `variant_id`, and `quantity`. RLS
policies additionally stop a signed-in user from inserting an order that's
already marked `paid`, or an `order_items` row priced differently from the
live catalog.

## Repository layout

```
.
├── .github/workflows/
│   ├── ci.yml        # Quality gate: typecheck + lint + tests + build (push/PR)
│   └── deploy.yml    # CI/CD: build+deploy frontend, deploy Supabase backend
├── frontend/         # Next.js 14 App Router, output: 'export'
├── supabase/
│   ├── migrations/   # SQL schema, RLS policies, seed catalogs
│   ├── functions/    # Deno Edge Functions (create-checkout, local-gateway-checkout, …)
│   └── config.toml
└── README.md
```

## Catalog

Three product families (the storefront nav, homepage cards, and shop filters
are driven entirely by the `categories` table — `parent_id` enables
subcategories):

| Family | Subcategories | Products |
|---|---|---|
| **Motorbike Gear** | Moto Suits, Moto Gloves, Moto Shoes | 13 |
| **Leather Jackets & Biker Fashion** | Biker, Casual, Heritage, Racing-Inspired jackets, Biker Fashion (vests) | 12 |
| **Handcrafted Gloves** | Leather, Riding, Driving, Work, Fashion, Mechanic, Tactical, Custom | 12 |

Products support rich merchandising fields: `brand`, multi-image galleries
(`images` JSONB, shown with thumbnail navigation on the product page),
`rating` / `review_count` (not seeded — review numbers come from real
customers), optional `compare_at_price_*` sale pricing, SEO metadata
(`seo_title`, `seo_description`, `seo_keywords`), and size/option variants
with unique SKUs. All previous catalogs (legacy demo, the 2026 SDBBUY
leather/boxing/gym catalog, and the motorbike marketplace) are deactivated;
rows referenced by historical orders are preserved (inactive) so order
history is never lost, while every customer-facing page shows only the new
SDB WEAR catalog. Product imagery is elegant branded SVG placeholders — no
fake product photography.

## Storefront features

- **Homepage** (`/`): editorial black-and-white hero, motorbike protection
  cards (suits / gloves / shoes), leather craft and stitched-gloves features,
  featured pieces, shop-by-family, trust strip — all driven by the live
  catalog with scroll-reveal motion.
- **Shop page** (`/shop`): search (products + category names), category +
  subcategory filters, currency-aware price range, sort (newest, price ↑/↓,
  name), editorial category descriptions, desktop sidebar + mobile filter
  sheet, responsive grid.
- **Product page** (`/products/[slug]`): image gallery with thumbnails,
  wishlist (persisted client-side), brand, star rating + review count, sale
  badges (compare-at strikethrough on cards and detail page), variant/size
  selection, quantity, Add to cart / Buy now, stock states, mobile sticky buy
  bar, similar items, per-product SEO metadata + Product JSON-LD structured
  data, and a reviews section (renders real customer reviews as they arrive —
  nothing is fabricated).
- **Cart**: slide-out drawer + full cart page, quantity editing, mobile
  sticky checkout bar.
- **Checkout**: sign-in required, Stripe (international, USD) ·
  JazzCash/Safepay (PKR, mock template), server-verified totals.
- **Account** (`/account`): order history + order tracking/confirmation pages.
- **Seller Central** (`/seller`): role-based admin panel with orders, products
  (including a live Google-style SEO preview with title/meta/keywords fields),
  categories, inventory (adjust stock + log), promotions, customers, reports,
  analytics, notifications (realtime), and settings — protected by the
  `is_seller()` RLS gate. The designated seller account is promoted on signup.
- **Internationalization**: 13 UI languages (English + 12; header selector
  lives in the footer) and 9 display currencies (USD, PKR, EUR, GBP, AED,
  SAR, CAD, AUD, CHF).
- **Info/legal pages**: about, contact, FAQ, size guide (leather jackets,
  moto suits, gloves by hand circumference, moto shoes by EU/foot length),
  payment information, privacy policy, terms, return/refund/shipping/
  cancellation policies, cookie policy, order tracking, wholesale/B2B.

## Prerequisites

- Node.js 20+
- A free [Supabase](https://supabase.com) account and project
- A free [Stripe](https://stripe.com) account (for international card payments)
- The [Supabase CLI](https://supabase.com/docs/guides/cli): `npm install -g supabase`
- A GitHub repository with **GitHub Pages** enabled, source set to **GitHub Actions**

## 1. Local setup

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# --- Frontend ---
cd frontend
npm install
cp .env.local.example .env.local
# edit .env.local with:
#   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
#   NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL=https://YOUR_PROJECT_REF.supabase.co/functions/v1
npm run dev   # http://localhost:3000
```

Quality checks (mirrors the CI gate):

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm test            # vitest (lib unit tests)
```

## 2. Initialize and link Supabase

```bash
# from the repository root
supabase login
supabase init            # only if supabase/ wasn't already scaffolded (it is, in this repo)
supabase link --project-ref YOUR_PROJECT_REF
```

Find `YOUR_PROJECT_REF` in your Supabase project's dashboard URL:
`https://supabase.com/dashboard/project/<THIS_IS_YOUR_REF>`.

## 3. Push the database schema

```bash
supabase db push
```

Migrations (in `supabase/migrations/`, applied in order):

1. **Initial schema** — `profiles`, `categories`, `products`, `product_variants`,
   `orders`, `order_items`, RLS policies, stock-decrement RPCs, Stripe event
   dedupe table.
2. **Seller Central** — `profiles.role`, seller RLS policies, `seller_notifications`,
   `inventory_log`, `promotions`, `seller_settings`, `product-images` storage
   bucket, `is_seller()` authorization gate, `categories.parent_id` +
   `is_active`.
3. **Seller notification preferences** — preference-aware order/payment/stock
   triggers and low/out-of-stock alerts.
4. **SDBBUY catalog** — professional seed catalog (leather, boxing, gym,
   accessories) replacing demo products.
5. **Motorbike category** — removes the Apparel categories, adds Motorbikes
   with 10 subcategories and 30 gallery products, plus optional merchandising
   columns (`brand`, `images`, `rating`, `review_count`, `compare_at_*`).
6. **SDB WEAR redesign** — adds product SEO columns, retires every previous
   customer-facing catalog (legacy demo, SDBBUY leather/boxing/gym, motorbike
   marketplace), preserves order-referenced rows as inactive, and seeds the
   new three-family SDB WEAR catalog (Motorbike Gear, Leather Jackets & Biker
   Fashion, Handcrafted Gloves — 37 products, ~200 variants, branded SVG
   placeholders, no fabricated ratings).

## 4. Configure secrets (used by the Edge Functions)

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_xxx \
  STRIPE_WEBHOOK_SIGNING_SECRET=whsec_xxx \
  SITE_URL=https://www.sdbbuy.com
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically into
every hosted Edge Function — you do not set them yourself.

For local testing, also add `SUPABASE_ANON_KEY` to `supabase/functions/.env`
(the CLI reads this file for `supabase functions serve`); in production it is
likewise auto-injected.

## 5. Deploy the Edge Functions manually (first time / local testing)

```bash
supabase functions deploy create-checkout
supabase functions deploy local-gateway-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
```

`stripe-webhook` must be deployed with `--no-verify-jwt` because Stripe, not a
signed-in Supabase user, calls it — Stripe cannot supply a Supabase JWT.
Signature verification inside the function itself is what secures this
endpoint instead.

## 6. Point Stripe at your webhook

In the Stripe Dashboard → Developers → Webhooks, add an endpoint:

```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/stripe-webhook
```

Subscribe to: `checkout.session.completed`, `checkout.session.expired`,
`payment_intent.payment_failed`. Copy the signing secret into
`STRIPE_WEBHOOK_SIGNING_SECRET` above.

## 7. Configure GitHub Actions secrets

In your repo → Settings → Secrets and variables → Actions, add:

| Secret | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → `anon` `public` key |
| `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL` | `https://YOUR_PROJECT_REF.supabase.co/functions/v1` |
| `SUPABASE_ACCESS_TOKEN` | Supabase → Account → Access Tokens |
| `SUPABASE_PROJECT_REF` | Your project ref |
| `SUPABASE_DB_PASSWORD` | Your project's database password |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys |
| `STRIPE_WEBHOOK_SIGNING_SECRET` | From step 6 |
| `SITE_URL` | `https://www.sdbbuy.com` |

In Settings → Pages, set **Source** to **GitHub Actions**.

## 8. Push to GitHub

```bash
git add .
git commit -m "Initial commit: Jamstack storefront on GitHub Pages + Supabase"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Pushing to `main` triggers:

- **`ci.yml`** — typecheck, lint, unit tests, and a static build as a quality gate.
- **`deploy.yml`**, which:
  1. Builds the Next.js static export with your Supabase secrets baked in as
     `NEXT_PUBLIC_*` env vars. No `basePath` is set: the storefront is served
     from the **root** of the custom domain, so all assets are root-relative
     (`/_next/...`) and load correctly from `https://www.sdbbuy.com/`.
  2. Publishes `frontend/out` to GitHub Pages.
  3. Links the Supabase project, runs `supabase db push`, deploys all three Edge
     Functions, and syncs their secrets — in parallel, as a second job.

Your storefront is live at `https://www.sdbbuy.com/`.

## Rebuilding after a catalog change

Because product data is fetched **at build time** (`generateStaticParams` +
server-component fetches, since there's no server to hit at request time),
adding or editing a product (or applying a new Supabase migration) requires a
rebuild. Trigger one from the Actions tab (`workflow_dispatch`) or push any
commit — no code change is required.

## Local currency notes

- Prices are stored as integer minor units (`price_usd_cents`,
  `price_pkr_paisa`) to avoid floating-point rounding bugs.
- `local-gateway-checkout` is a **mock template** for JazzCash/Safepay: it
  creates a real order row with the correct server-computed total, but
  returns a mock redirect instead of calling a live gateway. See the comment
  block at the top of `supabase/functions/local-gateway-checkout/index.ts`
  for exactly what to replace when integrating a real gateway.
