-- =====================================================================
-- Seller Central: roles, tables, RLS, storage, and helper functions
-- Adds admin/seller capability on top of the existing e-commerce schema.
-- All seller operations are protected at the database level via
-- public.is_seller() — never by the frontend alone.
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles: role + email
-- ---------------------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'customer'
  check (role in ('customer', 'seller', 'admin'));

alter table public.profiles
  add column if not exists email text;

create index if not exists profiles_role_idx on public.profiles (role);

-- The designated seller email is promoted automatically the first time
-- the account signs up (magic link or password), and again here for any
-- pre-existing account. The password itself is never stored anywhere in
-- the frontend or this repo — it lives only inside Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    case when new.email = 'mr.sheryt786@gmail.com' then 'seller' else 'customer' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

update public.profiles
set role = 'seller'
where role <> 'seller'
  and id in (select id from auth.users where email = 'mr.sheryt786@gmail.com');

-- ---------------------------------------------------------------------
-- is_seller(): the single authorization gate for every seller policy.
-- Security definer so it can read profiles without being blocked by RLS.
-- ---------------------------------------------------------------------
create or replace function public.is_seller()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('seller', 'admin')
  );
$$;

-- ---------------------------------------------------------------------
-- Seller policies on existing tables (additive — public behavior kept)
-- ---------------------------------------------------------------------

-- products: sellers read everything (incl. inactive), and manage rows
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Sellers can read all products') then
    create policy "Sellers can read all products" on public.products
      for select using (public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers can insert products') then
    create policy "Sellers can insert products" on public.products
      for insert with check (public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers can update products') then
    create policy "Sellers can update products" on public.products
      for update using (public.is_seller()) with check (public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers can delete products') then
    create policy "Sellers can delete products" on public.products
      for delete using (public.is_seller());
  end if;
end $$;

-- product_variants: sellers manage rows
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Sellers can read all variants') then
    create policy "Sellers can read all variants" on public.product_variants
      for select using (public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers can insert variants') then
    create policy "Sellers can insert variants" on public.product_variants
      for insert with check (public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers can update variants') then
    create policy "Sellers can update variants" on public.product_variants
      for update using (public.is_seller()) with check (public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers can delete variants') then
    create policy "Sellers can delete variants" on public.product_variants
      for delete using (public.is_seller());
  end if;
end $$;

-- categories: sellers manage rows; add is_active + parent_id (subcategories)
alter table public.categories
  add column if not exists is_active boolean not null default true;
alter table public.categories
  add column if not exists parent_id uuid references public.categories (id) on delete set null;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Sellers can read all categories') then
    create policy "Sellers can read all categories" on public.categories
      for select using (public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers can insert categories') then
    create policy "Sellers can insert categories" on public.categories
      for insert with check (public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers can update categories') then
    create policy "Sellers can update categories" on public.categories
      for update using (public.is_seller()) with check (public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers can delete categories') then
    create policy "Sellers can delete categories" on public.categories
      for delete using (public.is_seller());
  end if;
end $$;

-- orders: sellers read everything and update status/payment
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Sellers can read all orders') then
    create policy "Sellers can read all orders" on public.orders
      for select using (public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers can update orders') then
    create policy "Sellers can update orders" on public.orders
      for update using (public.is_seller()) with check (public.is_seller());
  end if;
end $$;

-- order_items: sellers read everything (details for order management)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Sellers can read all order items') then
    create policy "Sellers can read all order items" on public.order_items
      for select using (public.is_seller());
  end if;
end $$;

-- profiles: sellers can read all profiles (customer directory)
do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Sellers can view all profiles') then
    create policy "Sellers can view all profiles" on public.profiles
      for select using (public.is_seller());
  end if;
end $$;

-- ---------------------------------------------------------------------
-- seller_notifications
-- ---------------------------------------------------------------------
create table if not exists public.seller_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('new_order', 'payment', 'low_stock', 'out_of_stock', 'system')),
  title text not null,
  body text not null default '',
  order_id uuid references public.orders (id) on delete set null,
  product_id uuid references public.products (id) on delete set null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists seller_notifications_created_at_idx on public.seller_notifications (created_at desc);
create index if not exists seller_notifications_is_read_idx on public.seller_notifications (is_read);

-- Enable Realtime so the seller UI can live-update on new notifications.
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'seller_notifications'
  ) then
    alter publication supabase_realtime add table public.seller_notifications;
  end if;
exception when duplicate_object then null;
end $$;

alter table public.seller_notifications enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Sellers can read notifications') then
    create policy "Sellers can read notifications" on public.seller_notifications
      for select using (public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers can update notifications') then
    create policy "Sellers can update notifications" on public.seller_notifications
      for update using (public.is_seller()) with check (public.is_seller());
  end if;
end $$;

create or replace function public.notify_order_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.seller_notifications (type, title, body, order_id)
  values ('new_order', 'New order received', 'Order ' || left(new.id::text, 8) || ' — ' || new.shipping_name || ', ' || new.shipping_city, new.id);
  return new;
end;
$$;

drop trigger if exists notify_order_created_trigger on public.orders;
create trigger notify_order_created_trigger
  after insert on public.orders
  for each row execute procedure public.notify_order_created();

create or replace function public.notify_payment_received()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.payment_status = 'paid' and old.payment_status is distinct from 'paid' then
    insert into public.seller_notifications (type, title, body, order_id)
    values ('payment', 'Payment received', 'Payment confirmed for order ' || left(new.id::text, 8), new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists notify_payment_received_trigger on public.orders;
create trigger notify_payment_received_trigger
  after update of payment_status on public.orders
  for each row execute procedure public.notify_payment_received();

-- ---------------------------------------------------------------------
-- inventory_log + adjust_stock RPC
-- ---------------------------------------------------------------------
create table if not exists public.inventory_log (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  change_quantity integer not null,
  reason text not null default '',
  previous_stock integer not null default 0,
  new_stock integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists inventory_log_product_id_idx on public.inventory_log (product_id);
create index if not exists inventory_log_created_at_idx on public.inventory_log (created_at desc);

alter table public.inventory_log enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Sellers can read inventory log') then
    create policy "Sellers can read inventory log" on public.inventory_log
      for select using (public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers can write inventory log') then
    create policy "Sellers can write inventory log" on public.inventory_log
      for insert with check (public.is_seller());
  end if;
end $$;

create or replace function public.adjust_stock(
  p_product_id uuid,
  p_delta integer,
  p_reason text,
  p_variant_id uuid default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_previous integer;
  v_new integer;
begin
  if not public.is_seller() then
    raise exception 'Not authorized';
  end if;

  if p_delta = 0 then
    raise exception 'Adjustment cannot be zero';
  end if;

  if p_variant_id is null then
    select stock_quantity into v_previous from public.products where id = p_product_id;
    if v_previous is null then
      raise exception 'Product not found';
    end if;
    update public.products
      set stock_quantity = greatest(stock_quantity + p_delta, 0)
      where id = p_product_id;
    select stock_quantity into v_new from public.products where id = p_product_id;
    insert into public.inventory_log (product_id, change_quantity, reason, previous_stock, new_stock, created_by)
    values (p_product_id, p_delta, coalesce(p_reason, ''), v_previous, v_new, auth.uid());
  else
    select stock_quantity into v_previous from public.product_variants where id = p_variant_id;
    if v_previous is null then
      raise exception 'Variant not found';
    end if;
    update public.product_variants
      set stock_quantity = greatest(stock_quantity + p_delta, 0)
      where id = p_variant_id;
    select stock_quantity into v_new from public.product_variants where id = p_variant_id;
    insert into public.inventory_log (product_id, variant_id, change_quantity, reason, previous_stock, new_stock, created_by)
    values (p_product_id, p_variant_id, p_delta, coalesce(p_reason, ''), v_previous, v_new, auth.uid());
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- promotions (discount codes). Applied at checkout is a Phase 2 backend
-- concern; this gives the store a real, managed promotions table.
-- ---------------------------------------------------------------------
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text not null default '',
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value integer not null check (discount_value > 0),
  currency text check (currency in ('USD', 'PKR')),
  product_id uuid references public.products (id) on delete set null,
  category_id uuid references public.categories (id) on delete set null,
  min_subtotal_minor integer check (min_subtotal_minor >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer check (usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists promotions_is_active_idx on public.promotions (is_active);
create index if not exists promotions_code_idx on public.promotions (code);

alter table public.promotions enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Sellers can read promotions') then
    create policy "Sellers can read promotions" on public.promotions
      for select using (public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers can insert promotions') then
    create policy "Sellers can insert promotions" on public.promotions
      for insert with check (public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers can update promotions') then
    create policy "Sellers can update promotions" on public.promotions
      for update using (public.is_seller()) with check (public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers can delete promotions') then
    create policy "Sellers can delete promotions" on public.promotions
      for delete using (public.is_seller());
  end if;
end $$;

drop trigger if exists set_promotions_updated_at on public.promotions;
create trigger set_promotions_updated_at
  before update on public.promotions
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------
-- seller_settings (notification preferences)
-- ---------------------------------------------------------------------
create table if not exists public.seller_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  -- Notification preferences
  notify_new_orders boolean not null default true,
  notify_payments boolean not null default true,
  notify_low_stock boolean not null default true,
  notify_out_of_stock boolean not null default true,
  -- Store profile (shown in seller settings)
  store_name text not null default '',
  store_tagline text not null default '',
  contact_email text not null default '',
  contact_phone text not null default '',
  store_address text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.seller_settings enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Sellers can read settings') then
    create policy "Sellers can read settings" on public.seller_settings
      for select using (public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers can insert settings') then
    create policy "Sellers can insert settings" on public.seller_settings
      for insert with check (public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers can update settings') then
    create policy "Sellers can update settings" on public.seller_settings
      for update using (public.is_seller()) with check (public.is_seller());
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Storage: product-images bucket (public reads, seller writes)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'Public read product images') then
    create policy "Public read product images" on storage.objects
      for select using (bucket_id = 'product-images');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers upload product images') then
    create policy "Sellers upload product images" on storage.objects
      for insert with check (bucket_id = 'product-images' and public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers update product images') then
    create policy "Sellers update product images" on storage.objects
      for update using (bucket_id = 'product-images' and public.is_seller());
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Sellers delete product images') then
    create policy "Sellers delete product images" on storage.objects
      for delete using (bucket_id = 'product-images' and public.is_seller());
  end if;
end $$;
