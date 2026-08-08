-- =====================================================================
-- Initial schema for the global e-commerce platform
-- Target: Supabase (PostgreSQL 15+)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE public.order_status AS ENUM (
          'pending_payment',
          'cod_pending',
          'paid',
          'processing',
          'shipped',
          'delivered',
          'cancelled',
          'refunded'
        );
    END IF;
END $$;

create type public.payment_method as enum (
  'stripe',
  'cod',
  'jazzcash',
  'safepay'
);

create type public.payment_status as enum (
  'unpaid',
  'paid',
  'failed',
  'refunded'
);

-- ---------------------------------------------------------------------
-- profiles
-- One row per authenticated user, mirrors auth.users.
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  default_currency text not null default 'USD' check (default_currency in ('USD', 'PKR')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Public can read categories"
  on public.categories for select
  using (true);

-- ---------------------------------------------------------------------
-- products
-- Prices are stored as integer minor units (cents / paisa) to avoid
-- floating point rounding errors. price_usd_cents and price_pkr_paisa
-- are both authoritative "source of truth" prices set by the store
-- owner; the client NEVER sends a price back to the server.
-- ---------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  slug text not null unique,
  name text not null,
  description text not null default '',
  image_url text,
  price_usd_cents integer not null check (price_usd_cents >= 0),
  price_pkr_paisa integer not null check (price_pkr_paisa >= 0),
  is_active boolean not null default true,
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_is_active_idx on public.products (is_active);

alter table public.products enable row level security;

create policy "Public can read active products"
  on public.products for select
  using (is_active = true);

-- ---------------------------------------------------------------------
-- product_variants
-- e.g. size / color combinations. Variant prices are optional deltas
-- (added to the base product price); when null, the base price is used.
-- ---------------------------------------------------------------------
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  sku text not null unique,
  price_usd_cents integer check (price_usd_cents >= 0),
  price_pkr_paisa integer check (price_pkr_paisa >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index product_variants_product_id_idx on public.product_variants (product_id);

alter table public.product_variants enable row level security;

create policy "Public can read active variants"
  on public.product_variants for select
  using (is_active = true);

-- ---------------------------------------------------------------------
-- orders
-- CRITICAL SECURITY NOTE:
-- Authenticated users may INSERT an order row for themselves, but the
-- monetary total columns are NOT trusted from the client for payment
-- purposes. The Stripe Edge Function (service role, bypasses RLS)
-- recomputes the total server-side from the products table before
-- creating the Checkout Session, and again before marking the order
-- "paid" from the verified webhook payload. The client-submitted
-- total_* columns are therefore only a display convenience; a
-- CHECK-level guard additionally forbids negative/zero totals.
-- ---------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status public.order_status not null default 'pending_payment',
  currency text not null check (currency in ('USD', 'PKR')),
  subtotal_minor integer not null check (subtotal_minor > 0),
  shipping_minor integer not null default 0 check (shipping_minor >= 0),
  total_minor integer not null check (total_minor > 0),
  payment_method public.payment_method not null,
  payment_status public.payment_status not null default 'unpaid',
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  shipping_name text not null,
  shipping_phone text not null,
  shipping_address_line1 text not null,
  shipping_address_line2 text,
  shipping_city text not null,
  shipping_country text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);
create index orders_stripe_session_idx on public.orders (stripe_checkout_session_id);

alter table public.orders enable row level security;

-- Users can only ever see their own orders.
create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Users may create an order for themselves only, and only in an
-- initial, unpaid state. They cannot create an order that is already
-- marked paid/shipped/delivered/refunded — only the service-role
-- Edge Functions (which bypass RLS) may transition status forward.
create policy "Users can create their own pending orders"
  on public.orders for insert
  with check (
    auth.uid() = user_id
    and payment_status = 'unpaid'
    and status in ('pending_payment', 'cod_pending')
  );

-- Users may update only their own orders, and only narrow,
-- non-financial fields such as cancelling a still-pending order.
-- They can never move status into a paid/shipped/delivered state,
-- never touch payment_status, and never change amounts.
create policy "Users can cancel their own pending orders"
  on public.orders for update
  using (
    auth.uid() = user_id
    and status in ('pending_payment', 'cod_pending')
  )
  with check (
    auth.uid() = user_id
    and status = 'cancelled'
    and payment_status = 'unpaid'
  );

-- ---------------------------------------------------------------------
-- order_items
-- Line items are snapshotted at order time (name + unit price) so that
-- later catalog price changes never retroactively alter a past order.
-- unit_price_minor is set exclusively by server-side logic (Edge
-- Functions use the service role and bypass RLS entirely for writes);
-- the insert policy below still guards against a client forging a
-- price on a row it inserts directly for a COD order.
-- ---------------------------------------------------------------------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  variant_id uuid references public.product_variants (id),
  product_name text not null,
  variant_name text,
  quantity integer not null check (quantity > 0),
  unit_price_minor integer not null check (unit_price_minor > 0),
  line_total_minor integer not null check (line_total_minor > 0)
);

create index order_items_order_id_idx on public.order_items (order_id);

alter table public.order_items enable row level security;

create policy "Users can view items on their own orders"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

-- Item inserts are only permitted alongside an order the user just
-- created for themselves, and the unit price must match the current
-- catalog price at insert time — this closes the "spoofed total"
-- loophole for the COD path, where there is no server-side Stripe
-- Checkout step to recompute the total independently.
create policy "Users can insert items on their own pending orders"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
        and o.status in ('pending_payment', 'cod_pending')
    )
    and (
      unit_price_minor = (
        select case
          when order_items.variant_id is not null then
            coalesce(
              (select case o2.currency
                 when 'USD' then pv.price_usd_cents
                 else pv.price_pkr_paisa
               end
               from public.product_variants pv
               where pv.id = order_items.variant_id),
              (select case o2.currency
                 when 'USD' then p2.price_usd_cents
                 else p2.price_pkr_paisa
               end
               from public.products p2
               where p2.id = order_items.product_id)
            )
          else
            (select case o2.currency
               when 'USD' then p2.price_usd_cents
               else p2.price_pkr_paisa
             end
             from public.products p2
             where p2.id = order_items.product_id)
        end
        from public.orders o2
        where o2.id = order_items.order_id
      )
    )
  );

-- ---------------------------------------------------------------------
-- processed_stripe_events
-- Idempotency ledger for the stripe-webhook Edge Function. Stripe may
-- redeliver the same event on retry; a unique constraint on event_id
-- lets the function detect and skip duplicates. Only the service role
-- (Edge Functions) ever touches this table, so RLS stays fully
-- locked down with no policies at all — even authenticated users get
-- zero access.
-- ---------------------------------------------------------------------
create table public.processed_stripe_events (
  event_id text primary key,
  processed_at timestamptz not null default now()
);

alter table public.processed_stripe_events enable row level security;

-- ---------------------------------------------------------------------
-- Stock decrement RPCs
-- Called only by the stripe-webhook and cod-order Edge Functions
-- (service role), after payment/order confirmation, so stock is
-- never decremented by an unpaid or unverified request.
-- ---------------------------------------------------------------------
create or replace function public.decrement_product_stock(
  p_product_id uuid,
  p_quantity integer
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.products
  set stock_quantity = greatest(stock_quantity - p_quantity, 0)
  where id = p_product_id;
end;
$$;

create or replace function public.decrement_variant_stock(
  p_variant_id uuid,
  p_quantity integer
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.product_variants
  set stock_quantity = greatest(stock_quantity - p_quantity, 0)
  where id = p_variant_id;
end;
$$;

-- ---------------------------------------------------------------------
-- updated_at maintenance trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

create trigger set_orders_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- Seed data
-- ---------------------------------------------------------------------
insert into public.categories (name, slug) values
  ('Apparel', 'apparel'),
  ('Home & Living', 'home-living'),
  ('Electronics', 'electronics');

insert into public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
select
  (select id from public.categories where slug = 'apparel'),
  'embroidered-lawn-kurta',
  'Embroidered Lawn Kurta',
  'Hand-finished embroidered lawn kurta, breathable summer fabric, made in Pakistan.',
  'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800',
  2900,
  1250000,
  40;

insert into public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
select
  (select id from public.categories where slug = 'home-living'),
  'handwoven-multani-rug',
  'Handwoven Multani Rug',
  'Traditional handwoven rug from Multan, 4x6 ft, natural dyes.',
  'https://images.unsplash.com/photo-1600166898405-da9535204843?w=800',
  8900,
  3800000,
  15;

insert into public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
select
  (select id from public.categories where slug = 'electronics'),
  'wireless-earbuds-pro',
  'Wireless Earbuds Pro',
  'Bluetooth 5.3 earbuds with active noise cancellation and 30-hour battery life.',
  'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800',
  4900,
  2100000,
  60;

insert into public.product_variants (product_id, name, sku, stock_quantity)
select id, 'Small', 'ELK-S', 15 from public.products where slug = 'embroidered-lawn-kurta'
union all
select id, 'Medium', 'ELK-M', 15 from public.products where slug = 'embroidered-lawn-kurta'
union all
select id, 'Large', 'ELK-L', 10 from public.products where slug = 'embroidered-lawn-kurta';
