# SitaraSouq — Global Jamstack Storefront (Pakistan)

A production-ready, **100% free-to-host** e-commerce platform: a statically
exported Next.js storefront on **GitHub Pages**, backed entirely by
**Supabase** (Postgres, Auth, Row Level Security, Edge Functions). There is no
traditional application server anywhere in this stack.

## Architecture

```
Browser (GitHub Pages, static HTML/JS)
   │
   ├── Supabase Postgres (via supabase-js, anon key, RLS-protected reads)
   │       - public product catalog reads
   │       - authenticated users' own orders
   │
   └── Supabase Edge Functions (Deno, service-role key, the ONLY place
       that computes prices and writes orders/order_items)
           - create-checkout        → Stripe Checkout Session (USD, international)
           - cod-order               → Cash on Delivery order (PKR, Pakistan)
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
├── .github/workflows/deploy.yml   # CI/CD: build+deploy frontend, deploy backend
├── frontend/                      # Next.js 14 App Router, output: 'export'
├── supabase/
│   ├── migrations/                # SQL schema + RLS policies
│   ├── functions/                 # Deno Edge Functions
│   └── config.toml
└── README.md
```

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
# edit .env.local with your Supabase project URL + anon key
npm run dev   # http://localhost:3000
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

This creates `products`, `product_variants`, `orders`, `order_items`,
`profiles`, `categories`, the RLS policies, the stock-decrement RPCs, and
seeds three example products.

## 4. Configure secrets (used by the Edge Functions)

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_xxx \
  STRIPE_WEBHOOK_SIGNING_SECRET=whsec_xxx \
  SITE_URL=https://YOUR_USERNAME.github.io/YOUR_REPO
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically into
every hosted Edge Function — you do not set them yourself.

For local testing, also add `SUPABASE_ANON_KEY` to `supabase/functions/.env`
(the CLI reads this file for `supabase functions serve`); in production it is
likewise auto-injected.

## 5. Deploy the Edge Functions manually (first time / local testing)

```bash
supabase functions deploy create-checkout
supabase functions deploy cod-order
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
| `SITE_URL` | `https://YOUR_USERNAME.github.io/YOUR_REPO` |

In Settings → Pages, set **Source** to **GitHub Actions**.

## 8. Push to GitHub

```bash
git add .
git commit -m "Initial commit: Jamstack storefront on GitHub Pages + Supabase"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Pushing to `main` triggers `.github/workflows/deploy.yml`, which:

1. Builds the Next.js static export with your Supabase secrets baked in as
   `NEXT_PUBLIC_*` env vars, and a `basePath` of `/YOUR_REPO`.
2. Publishes `frontend/out` to GitHub Pages.
3. Links the Supabase project, runs `supabase db push`, deploys all four Edge
   Functions, and syncs their secrets — in parallel, as a second job.

Your storefront will be live at `https://YOUR_USERNAME.github.io/YOUR_REPO/`.

## Rebuilding after a catalog change

Because product data is fetched **at build time** (`generateStaticParams` +
server-component fetches, since there's no server to hit at request time),
adding or editing a product requires a rebuild. Trigger one from the Actions
tab (`workflow_dispatch`) or push any commit — no code change is required.

## Local currency & COD notes

- Prices are stored as integer minor units (`price_usd_cents`,
  `price_pkr_paisa`) to avoid floating-point rounding bugs.
- Cash on Delivery (`cod-order`) is restricted to shipping addresses in
  Pakistan and always charges in PKR.
- `local-gateway-checkout` is a **mock template** for JazzCash/Safepay: it
  creates a real order row with the correct server-computed total, but
  returns a mock redirect instead of calling a live gateway. See the comment
  block at the top of `supabase/functions/local-gateway-checkout/index.ts`
  for exactly what to replace when integrating a real gateway.
