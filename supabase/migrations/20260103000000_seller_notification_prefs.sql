-- =====================================================================
-- Seller Central: honor notification preferences + low/out-of-stock alerts
--
-- The seller_settings table already lets the seller choose which
-- notification types they want (Seller Central → Settings →
-- Notifications). Until now those flags were decorative: the order and
-- payment triggers always fired, and no trigger ever produced the
-- low_stock / out_of_stock notifications the UI already knows how to
-- render. This migration:
--
--   1. Adds public.seller_wants(pref), the single DB-level check for a
--      notification preference (defaults to true while unset).
--   2. Makes the existing order + payment triggers respect the flags.
--   3. Adds AFTER UPDATE OF stock_quantity triggers on products and
--      product_variants that fire low_stock / out_of_stock alerts when
--      stock crosses the 5-unit threshold (matching LOW_STOCK_THRESHOLD
--      in the frontend).
--
-- These run as security definer so they bypass RLS exactly like the
-- original notify_order_created / notify_payment_received triggers.
-- =====================================================================

-- ---------------------------------------------------------------------
-- seller_wants(pref): does any seller have this preference enabled?
-- Falls back to true when no seller_settings row exists yet, matching
-- the UI defaults (all notifications on).
-- ---------------------------------------------------------------------
create or replace function public.seller_wants(pref text)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce(
    bool_or(
      case pref
        when 'notify_new_orders'     then s.notify_new_orders
        when 'notify_payments'       then s.notify_payments
        when 'notify_low_stock'      then s.notify_low_stock
        when 'notify_out_of_stock'   then s.notify_out_of_stock
      end
    ),
    true
  )
  from public.seller_settings s;
$$;

-- ---------------------------------------------------------------------
-- Respect preferences in the existing order/payment triggers
-- ---------------------------------------------------------------------
create or replace function public.notify_order_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if public.seller_wants('notify_new_orders') then
    insert into public.seller_notifications (type, title, body, order_id)
    values ('new_order', 'New order received', 'Order ' || left(new.id::text, 8) || ' — ' || new.shipping_name || ', ' || new.shipping_city, new.id);
  end if;
  return new;
end;
$$;

create or replace function public.notify_payment_received()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.payment_status = 'paid' and old.payment_status is distinct from 'paid'
     and public.seller_wants('notify_payments') then
    insert into public.seller_notifications (type, title, body, order_id)
    values ('payment', 'Payment received', 'Payment confirmed for order ' || left(new.id::text, 8), new.id);
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Low stock / out of stock alerts
-- ---------------------------------------------------------------------
create or replace function public.notify_stock_changed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_product_name text;
  v_item_name text;
  v_threshold integer := 5; -- LOW_STOCK_THRESHOLD in the frontend
begin
  -- Only react when the update actually moved stock and we crossed a threshold.
  if new.stock_quantity = old.stock_quantity then
    return new;
  end if;

  if TG_TABLE_NAME = 'products' then
    select name into v_product_name from public.products where id = new.id;
    v_item_name := v_product_name;
  else
    select p.name, v.name into v_product_name, v_item_name
    from public.product_variants v
    join public.products p on p.id = v.product_id
    where v.id = new.id;
    v_item_name := v_product_name || ' — ' || v_item_name;
  end if;

  -- Out of stock (crossed from in-stock to 0)
  if new.stock_quantity = 0 and old.stock_quantity > 0 then
    if public.seller_wants('notify_out_of_stock') then
      insert into public.seller_notifications (type, title, body, product_id)
      values (
        'out_of_stock',
        'Out of stock',
        v_item_name || ' has sold out.',
        case when TG_TABLE_NAME = 'products' then new.id else new.product_id end
      );
    end if;
    return new;
  end if;

  -- Low stock (crossed from above threshold to at/below it)
  if new.stock_quantity <= v_threshold and old.stock_quantity > v_threshold then
    if public.seller_wants('notify_low_stock') then
      insert into public.seller_notifications (type, title, body, product_id)
      values (
        'low_stock',
        'Low stock',
        v_item_name || ' has ' || new.stock_quantity || ' unit' || case when new.stock_quantity = 1 then '' else 's' end || ' left.',
        case when TG_TABLE_NAME = 'products' then new.id else new.product_id end
      );
    end if;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists notify_stock_changed_products on public.products;
create trigger notify_stock_changed_products
  after update of stock_quantity on public.products
  for each row execute procedure public.notify_stock_changed();

drop trigger if exists notify_stock_changed_variants on public.product_variants;
create trigger notify_stock_changed_variants
  after update of stock_quantity on public.product_variants
  for each row execute procedure public.notify_stock_changed();
