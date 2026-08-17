-- =====================================================================
-- SDBBUY Motorbike Category
-- 1. Removes the Apparel categories (legacy 'apparel' + 'fashion-apparel')
--    and their listings from the store.
-- 2. Adds the Motorbikes category (riding gear and accessories) with ten
--    subcategories and realistic, production-ready products.
-- 3. Adds optional product merchandising columns used by the upgraded
--    product page (brand, gallery images, rating, review count, sale
--    compare-at prices). All new columns are nullable so existing rows
--    are untouched.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Optional merchandising columns on products (additive, nullable)
-- ---------------------------------------------------------------------
alter table public.products
  add column if not exists brand text,
  add column if not exists images jsonb,
  add column if not exists rating numeric(2,1) check (rating is null or rating between 0 and 5),
  add column if not exists review_count integer check (review_count is null or review_count >= 0),
  add column if not exists compare_at_price_usd_cents integer check (compare_at_price_usd_cents is null or compare_at_price_usd_cents >= 0),
  add column if not exists compare_at_price_pkr_paisa integer check (compare_at_price_pkr_paisa is null or compare_at_price_pkr_paisa >= 0);

-- ---------------------------------------------------------------------
-- 2. Remove the Apparel categories completely.
--
-- Two Apparel rows exist: 'apparel' (legacy demo category from the
-- original seed) and 'fashion-apparel' (added with the 2026 catalog).
-- Both must disappear from the storefront.
--
-- The storefront only reads is_active = true rows, so deactivating the
-- categories and their products removes every trace of Apparel from the
-- website (navigation, filters, search, category cards, listings).
--
-- Rows that no order history references are then physically deleted so
-- nothing Apparel-related lingers in the database. Rows referenced by
-- past orders stay deactivated (invisible everywhere) to preserve
-- customer order history — order_items keeps product names denormalized
-- and is the only table holding a restrictive foreign key to products.
-- ---------------------------------------------------------------------
update public.products
set is_active = false
where category_id in (select id from public.categories where slug in ('apparel', 'fashion-apparel'));

update public.categories
set is_active = false
where slug in ('apparel', 'fashion-apparel');

delete from public.product_variants pv
using public.products p
join public.categories c on c.id = p.category_id and c.slug in ('apparel', 'fashion-apparel')
where pv.product_id = p.id
  and not exists (select 1 from public.order_items oi where oi.variant_id = pv.id);

delete from public.products p
using public.categories c
where c.id = p.category_id and c.slug in ('apparel', 'fashion-apparel')
  and not exists (select 1 from public.order_items oi where oi.product_id = p.id);

delete from public.categories
where slug in ('apparel', 'fashion-apparel')
  and not exists (select 1 from public.products p where p.category_id = public.categories.id);

-- ---------------------------------------------------------------------
-- 3. Motorbikes category + subcategories
-- ---------------------------------------------------------------------
insert into public.categories (name, slug, parent_id, is_active)
values ('Motorbikes', 'motorbikes', null, true)
on conflict (slug) do nothing;

insert into public.categories (name, slug, parent_id, is_active)
select v.name, v.slug, p.id, true
from (values
  ('Gloves',                  'motorbike-gloves',       'motorbikes'),
  ('Jackets',                 'motorbike-jackets',      'motorbikes'),
  ('Moto Suits',              'moto-suits',             'motorbikes'),
  ('Helmets',                 'helmets',                'motorbikes'),
  ('Boots',                   'motorbike-boots',        'motorbikes'),
  ('Pants',                   'motorbike-pants',        'motorbikes'),
  ('Protective Gear',         'protective-gear',        'motorbikes'),
  ('Riding Gear',             'riding-gear',            'motorbikes'),
  ('Motorcycle Accessories',  'motorcycle-accessories', 'motorbikes'),
  ('Other Motorbike Gear',    'other-motorbike-gear',   'motorbikes')
) as v(name, slug, parent_slug)
join public.categories p on p.slug = v.parent_slug
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 4. Products
--
-- Every product carries a gallery of four images (full, upper detail,
-- lower detail, wide crop) so the upgraded product page has real
-- thumbnail navigation. image_url is the lead gallery image so product
-- cards keep working unchanged. Prices are stored as integer minor
-- units: USD cents and PKR paisa (1 USD = 280 PKR, matching the rest
-- of the catalog). Ratings are modest seed values shown on the product
-- page; products with compare_at prices display as on sale.
-- ---------------------------------------------------------------------
insert into public.products (
  category_id, slug, name, description, image_url, images, brand,
  rating, review_count, price_usd_cents, price_pkr_paisa,
  compare_at_price_usd_cents, compare_at_price_pkr_paisa, stock_quantity
)
select
  c.id, v.slug, v.name, v.description, v.image_url, v.images::jsonb, v.brand,
  v.rating, v.reviews, v.usd, v.pkr, v.compare_usd, v.compare_pkr, v.stock
from (values
  -- Helmets
  ('helmets', 'sdbbuy-apex-full-face-helmet', 'SDBBUY Apex Full-Face Helmet',
   'A streamlined full-face shell with a wide field of vision and a secure quick-release chin strap. Multi-density impact liner, integrated ventilation ports, and an anti-scratch visor with a simple tool-free swap. CE-style shell construction in a classic gloss finish.',
   'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.7, 64, 18900, 5292000, null, null, 40),
  ('helmets', 'sdbbuy-urban-modular-helmet', 'SDBBUY Urban Modular Helmet',
   'A flip-front modular design for city riding. The chin bar lifts for quick stops and conversations while the drop-down sun visor handles changing light. Plush removable liner, recessed vents, and a quiet, well-sealed shell.',
   'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.5, 41, 14900, 4172000, null, null, 35),
  ('helmets', 'sdbbuy-circuit-racing-helmet', 'SDBBUY Circuit Racing Helmet',
   'A track-oriented full-face helmet with an aerodynamic shell and a larger eye port for peripheral vision. Ventilation channels are tuned for high-speed airflow, and the cheek pads are replaceable for a precise fit.',
   'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.8, 27, 25900, 7252000, 29900, 8372000, 18),

  -- Gloves
  ('motorbike-gloves', 'sdbbuy-street-riding-gloves', 'SDBBUY Street Riding Gloves',
   'Everyday riding gloves with pre-curved fingers, a padded knuckle panel, and a secure hook-and-loop cuff. Perforated backhand keeps hands cool on warm rides while the palm grip is reinforced for solid lever control.',
   'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.4, 88, 3900, 1092000, null, null, 60),
  ('motorbike-gloves', 'sdbbuy-race-pro-gloves', 'SDBBUY Race Pro Gloves',
   'Track-oriented gloves with a hard knuckle protector, carbon-style finger sliders, and a double-layer palm. The long gauntlet cuff locks the glove in place, and accordion panels allow a full range of grip motion.',
   'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.6, 52, 6900, 1932000, 7900, 2212000, 30),
  ('motorbike-gloves', 'sdbbuy-all-weather-waterproof-gloves', 'SDBBUY All-Weather Waterproof Gloves',
   'A waterproof membrane under a durable shell keeps hands dry in the rain, while the thermal lining adds warmth on cold mornings. Touchscreen-compatible fingertips and a visor wipe on the thumb for practical commuter use.',
   'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.5, 73, 5400, 1512000, null, null, 45),

  -- Jackets
  ('motorbike-jackets', 'sdbbuy-heritage-leather-moto-jacket', 'SDBBUY Heritage Leather Moto Jacket',
   'A classic riding silhouette cut from full-grain leather with pre-curved sleeves and a secure zip front. Removable thermal liner, adjustable waist, and pockets sized for daily essentials. Built to age well and ride comfortably.',
   'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.8, 95, 24900, 6972000, null, null, 28),
  ('motorbike-jackets', 'sdbbuy-urban-textile-riding-jacket', 'SDBBUY Urban Textile Riding Jacket',
   'A lightweight textile jacket for city commutes with abrasion-resistant panels, ventilation zips, and a removable waterproof lining. Reflective accents keep you visible at night while the relaxed cut layers easily over a hoodie.',
   'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.5, 61, 13900, 3892000, null, null, 38),
  ('motorbike-jackets', 'sdbbuy-adventure-touring-jacket', 'SDBBUY Adventure Touring Jacket',
   'A multi-season touring jacket with a tough outer shell, full-length ventilation, and a detachable thermal and waterproof liner system. Multiple cargo pockets, an integrated hydration access point, and adjustable protection pockets for long rides.',
   'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1520975954732-35dd22299614?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1520975954732-35dd22299614?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1520975954732-35dd22299614?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1520975954732-35dd22299614?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.6, 44, 19900, 5572000, 22900, 6412000, 22),

  -- Moto Suits
  ('moto-suits', 'sdbbuy-track-one-piece-racing-suit', 'SDBBUY Track One-Piece Racing Suit',
   'A full one-piece suit built for track days with pre-curved limbs, knee pucks, and generous stretch panels at the shoulders and hips. The zip system includes a comfort flap to protect the liner, and the fit is cut close for a tucked position.',
   'https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.7, 19, 44900, 12572000, null, null, 10),
  ('moto-suits', 'sdbbuy-sport-two-piece-suit', 'SDBBUY Sport Two-Piece Suit',
   'A zippered two-piece suit that pairs a sport jacket with matching pants for weekend canyon rides and occasional track days. Adjustable cuff, waist, and ankle closures with a full-circumference connection zip.',
   'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.5, 26, 32900, 9212000, null, null, 12),
  ('moto-suits', 'sdbbuy-adventure-multi-layer-suit', 'SDBBUY Adventure Multi-Layer Suit',
   'A three-layer adventure suit engineered for long-distance travel. The waterproof outer layer, insulated mid layer, and ventilated base can be worn together or separately as conditions change, with pockets sized for touring essentials.',
   'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.4, 33, 27900, 7812000, null, null, 14),

  -- Boots
  ('motorbike-boots', 'sdbbuy-touring-riding-boots', 'SDBBUY Touring Riding Boots',
   'Ankle-height touring boots with oil-resistant soles, reinforced toe and heel counters, and a waterproof membrane. The lace-and-zip closure secures quickly, and the cushioned insole keeps long days in the saddle comfortable.',
   'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.6, 58, 11900, 3332000, null, null, 32),
  ('motorbike-boots', 'sdbbuy-race-track-boots', 'SDBBUY Race Track Boots',
   'A race-focused boot with a rigid heel, replaceable toe slider, and a secure dual-closure system. The shin plate and instep accordion panels support aggressive foot positions, and the vented lining keeps feet cool on hot laps.',
   'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=900&h=1200&auto=format&fit=crop&crop=entropy&q=80',
   '["https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=900&h=1200&auto=format&fit=crop&crop=entropy&q=80","https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.7, 31, 15900, 4452000, null, null, 20),
  ('motorbike-boots', 'sdbbuy-adventure-waterproof-boots', 'SDBBUY Adventure Waterproof Boots',
   'Mid-height adventure boots with a rugged tread, reinforced ankle support, and a fully waterproof build for wet trails. The quick-lace system with a top strap holds the fit under pressure, and the toe is reinforced for off-road use.',
   'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1200&auto=format&fit=crop&sat=-100&q=80',
   '["https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1200&auto=format&fit=crop&sat=-100&q=80","https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.5, 47, 13900, 3892000, null, null, 24),

  -- Pants
  ('motorbike-pants', 'sdbbuy-touring-riding-pants', 'SDBBUY Touring Riding Pants',
   'Reinforced riding pants with abrasion-resistant panels at the knees and seat, a relaxed touring cut, and stretch inserts for comfort on the pegs. Adjustable waist and knee positions with zippered ventilation panels.',
   'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.5, 39, 12900, 3612000, null, null, 26),
  ('motorbike-pants', 'sdbbuy-leather-riding-pants', 'SDBBUY Leather Riding Pants',
   'Slim-fitting leather pants with a full-length side zip for easy wear over jeans or armor. Reinforced seat and knee panels with pre-curved legs for a natural riding posture. Finished with an adjustable waist closure.',
   'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.6, 22, 18900, 5292000, null, null, 16),
  ('motorbike-pants', 'sdbbuy-waterproof-over-pants', 'SDBBUY Waterproof Over-Pants',
   'Packable over-pants that go on over regular trousers in minutes. Fully taped waterproof seams, elasticated cuffs, and reflective panels for wet-weather commuting. Stows into the included pouch when the sky clears.',
   'https://images.unsplash.com/photo-1558981420-c532902e58b4?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1558981420-c532902e58b4?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558981420-c532902e58b4?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1558981420-c532902e58b4?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1558981420-c532902e58b4?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.3, 55, 9900, 2772000, 11900, 3332000, 30),

  -- Protective Gear
  ('protective-gear', 'sdbbuy-knee-shin-guards', 'SDBBUY Knee & Shin Guards',
   'Lightweight knee and shin protectors with a hard shell over a shock-absorbing foam core. Adjustable straps hold them in place under jeans or riding pants, and the vented backing keeps airflow moving on hot rides.',
   'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.4, 67, 3400, 952000, null, null, 70),
  ('protective-gear', 'sdbbuy-back-protector-insert', 'SDBBUY Back Protector Insert',
   'A slim back protector that slides into the armor pocket of most riding jackets. Perforated viscoelastic foam absorbs impact while keeping weight low, with a contoured profile that follows the spine without restricting movement.',
   'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.6, 40, 4900, 1372000, null, null, 55),
  ('protective-gear', 'sdbbuy-body-armor-vest', 'SDBBUY Body Armor Vest',
   'A zip-front armor vest with removable chest, back, shoulder, and elbow protectors. Breathable mesh construction keeps the torso cool, and the adjustable straps dial in a secure fit over a base layer or under a jacket.',
   'https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1635776062127-d379bfcba9f8?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.5, 28, 8900, 2492000, null, null, 25),

  -- Riding Gear
  ('riding-gear', 'sdbbuy-thermal-base-layer-set', 'SDBBUY Thermal Base Layer Set',
   'A thermal top and bottom set worn under riding gear for cold-weather comfort. Soft brushed fabric traps warmth while the flatlock seams prevent chafing under armor, and the four-way stretch moves freely in the riding position.',
   'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.4, 83, 4500, 1260000, null, null, 65),
  ('riding-gear', 'sdbbuy-neck-tube-balaclava', 'SDBBUY Neck Tube & Balaclava',
   'A versatile neck tube that converts into a balaclava for full-face coverage on cold or dusty rides. Soft elasticated knit with a flat seam, quick-dry fibers, and enough stretch to wear over or under a helmet.',
   'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.3, 120, 1400, 392000, null, null, 150),
  ('riding-gear', 'sdbbuy-rain-suit', 'SDBBUY Rain Suit',
   'A two-piece waterproof rain suit with fully taped seams that packs into its own pouch. Elasticated wrists and ankles keep water out, reflective piping adds visibility, and the breathable fabric reduces clamminess inside.',
   'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.2, 49, 5900, 1652000, 6900, 1932000, 40),

  -- Motorcycle Accessories
  ('motorcycle-accessories', 'sdbbuy-tank-bag', 'SDBBUY Tank Bag',
   'A magnetic tank bag with a clear touch-screen map pocket, a main compartment for essentials, and quick-release straps. The padded base protects the tank finish and the bag stays stable at speed.',
   'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.4, 76, 3500, 980000, null, null, 48),
  ('motorcycle-accessories', 'sdbbuy-saddlebag-pair', 'SDBBUY Saddlebag Pair',
   'A pair of throw-over saddlebags with a wide main opening, roll-top closure, and buckled side straps. Water-resistant shell with reflective trim, plus D-rings for additional lashing on long tours.',
   'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1627123424574-724758594e93?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1627123424574-724758594e93?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.5, 38, 6500, 1820000, null, null, 20),
  ('motorcycle-accessories', 'sdbbuy-handlebar-phone-mount', 'SDBBUY Handlebar Phone Mount',
   'A vibration-damped phone mount that clamps to the handlebar and grips phones from 4 to 7 inches. One-hand release, 360-degree rotation, and a silicone cover that keeps the phone secure on rough roads.',
   'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.3, 145, 1900, 532000, null, null, 120),
  ('motorcycle-accessories', 'sdbbuy-disc-brake-lock', 'SDBBUY Disc Brake Lock',
   'A hardened-steel disc lock with a bright reminder cable so you never ride off with it attached. Fits most standard disc rotors and includes a carry pouch. Compact enough to store under the seat.',
   'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.5, 57, 2200, 616000, null, null, 85),

  -- Other Motorbike Gear
  ('other-motorbike-gear', 'sdbbuy-universal-tool-roll', 'SDBBUY Universal Tool Roll',
   'A roll-up tool pouch with elasticated pockets sized for the most common bike-side repairs. Durable canvas shell with a snap closure and a built-in handle, plus a small zippered compartment for spare fuses and fasteners.',
   'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.4, 68, 2100, 588000, null, null, 75),
  ('other-motorbike-gear', 'sdbbuy-handlebar-grip-set', 'SDBBUY Handlebar Grip Set',
   'A set of dual-compound grips with a soft outer layer for comfort and a firm inner core for a stable mount. Texture zones reduce hand fatigue, and the open end allows bar-end weights or mirrors.',
   'https://images.unsplash.com/photo-1558981420-c532902e58b4?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1558981420-c532902e58b4?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1558981420-c532902e58b4?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1558981420-c532902e58b4?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1558981420-c532902e58b4?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.3, 102, 1600, 448000, null, null, 110),
  ('other-motorbike-gear', 'sdbbuy-motorcycle-cover', 'SDBBUY Motorcycle Cover',
   'A weatherproof motorcycle cover with elasticated hem and a grommet for a cable lock. The heat-resistant inner panel protects against hot exhausts, and the cover packs into its own storage bag when not in use.',
   'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1200&auto=format&fit=crop&q=80',
   '["https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1200&auto=format&fit=crop&q=80","https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1200&h=1500&auto=format&fit=crop&crop=top&q=80","https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1200&h=1500&auto=format&fit=crop&crop=bottom&q=80","https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1400&h=1000&auto=format&fit=crop&q=80"]',
   'SDBBUY', 4.4, 91, 2400, 672000, null, null, 90)
) as v(
  cat, slug, name, description, image_url, images, brand,
  rating, reviews, usd, pkr, compare_usd, compare_pkr, stock
)
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 5. Product variants (sizes / options)
-- ---------------------------------------------------------------------
insert into public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
select p.id, v.name, v.sku, v.usd, v.pkr, v.stock
from (values
  -- Helmets
  ('sdbbuy-apex-full-face-helmet', 'S', 'HLF-APX-S', 18900, 5292000, 8),
  ('sdbbuy-apex-full-face-helmet', 'M', 'HLF-APX-M', 18900, 5292000, 14),
  ('sdbbuy-apex-full-face-helmet', 'L', 'HLF-APX-L', 18900, 5292000, 12),
  ('sdbbuy-apex-full-face-helmet', 'XL', 'HLF-APX-XL', 18900, 5292000, 6),
  ('sdbbuy-urban-modular-helmet', 'M', 'HLF-URB-M', 14900, 4172000, 10),
  ('sdbbuy-urban-modular-helmet', 'L', 'HLF-URB-L', 14900, 4172000, 14),
  ('sdbbuy-urban-modular-helmet', 'XL', 'HLF-URB-XL', 14900, 4172000, 11),
  ('sdbbuy-circuit-racing-helmet', 'M', 'HLF-CRC-M', 25900, 7252000, 6),
  ('sdbbuy-circuit-racing-helmet', 'L', 'HLF-CRC-L', 25900, 7252000, 8),
  ('sdbbuy-circuit-racing-helmet', 'XL', 'HLF-CRC-XL', 25900, 7252000, 4),

  -- Gloves
  ('sdbbuy-street-riding-gloves', 'S', 'GLV-STR-S', 3900, 1092000, 12),
  ('sdbbuy-street-riding-gloves', 'M', 'GLV-STR-M', 3900, 1092000, 18),
  ('sdbbuy-street-riding-gloves', 'L', 'GLV-STR-L', 3900, 1092000, 18),
  ('sdbbuy-street-riding-gloves', 'XL', 'GLV-STR-XL', 3900, 1092000, 12),
  ('sdbbuy-race-pro-gloves', 'S', 'GLV-RAC-S', 6900, 1932000, 8),
  ('sdbbuy-race-pro-gloves', 'M', 'GLV-RAC-M', 6900, 1932000, 10),
  ('sdbbuy-race-pro-gloves', 'L', 'GLV-RAC-L', 6900, 1932000, 8),
  ('sdbbuy-race-pro-gloves', 'XL', 'GLV-RAC-XL', 6900, 1932000, 4),
  ('sdbbuy-all-weather-waterproof-gloves', 'S', 'GLV-AWW-S', 5400, 1512000, 10),
  ('sdbbuy-all-weather-waterproof-gloves', 'M', 'GLV-AWW-M', 5400, 1512000, 14),
  ('sdbbuy-all-weather-waterproof-gloves', 'L', 'GLV-AWW-L', 5400, 1512000, 14),
  ('sdbbuy-all-weather-waterproof-gloves', 'XL', 'GLV-AWW-XL', 5400, 1512000, 7),

  -- Jackets
  ('sdbbuy-heritage-leather-moto-jacket', 'S', 'MJK-HER-S', 24900, 6972000, 6),
  ('sdbbuy-heritage-leather-moto-jacket', 'M', 'MJK-HER-M', 24900, 6972000, 8),
  ('sdbbuy-heritage-leather-moto-jacket', 'L', 'MJK-HER-L', 24900, 6972000, 8),
  ('sdbbuy-heritage-leather-moto-jacket', 'XL', 'MJK-HER-XL', 24900, 6972000, 4),
  ('sdbbuy-heritage-leather-moto-jacket', 'XXL', 'MJK-HER-XXL', 24900, 6972000, 2),
  ('sdbbuy-urban-textile-riding-jacket', 'S', 'MJK-URB-S', 13900, 3892000, 9),
  ('sdbbuy-urban-textile-riding-jacket', 'M', 'MJK-URB-M', 13900, 3892000, 11),
  ('sdbbuy-urban-textile-riding-jacket', 'L', 'MJK-URB-L', 13900, 3892000, 11),
  ('sdbbuy-urban-textile-riding-jacket', 'XL', 'MJK-URB-XL', 13900, 3892000, 7),
  ('sdbbuy-adventure-touring-jacket', 'S', 'MJK-ADV-S', 19900, 5572000, 5),
  ('sdbbuy-adventure-touring-jacket', 'M', 'MJK-ADV-M', 19900, 5572000, 7),
  ('sdbbuy-adventure-touring-jacket', 'L', 'MJK-ADV-L', 19900, 5572000, 7),
  ('sdbbuy-adventure-touring-jacket', 'XL', 'MJK-ADV-XL', 19900, 5572000, 3),

  -- Moto Suits
  ('sdbbuy-track-one-piece-racing-suit', 'S', 'MST-TRK-S', 44900, 12572000, 2),
  ('sdbbuy-track-one-piece-racing-suit', 'M', 'MST-TRK-M', 44900, 12572000, 4),
  ('sdbbuy-track-one-piece-racing-suit', 'L', 'MST-TRK-L', 44900, 12572000, 3),
  ('sdbbuy-track-one-piece-racing-suit', 'XL', 'MST-TRK-XL', 44900, 12572000, 1),
  ('sdbbuy-sport-two-piece-suit', 'M', 'MST-SPT-M', 32900, 9212000, 4),
  ('sdbbuy-sport-two-piece-suit', 'L', 'MST-SPT-L', 32900, 9212000, 5),
  ('sdbbuy-sport-two-piece-suit', 'XL', 'MST-SPT-XL', 32900, 9212000, 3),
  ('sdbbuy-adventure-multi-layer-suit', 'S', 'MST-ADV-S', 27900, 7812000, 3),
  ('sdbbuy-adventure-multi-layer-suit', 'M', 'MST-ADV-M', 27900, 7812000, 5),
  ('sdbbuy-adventure-multi-layer-suit', 'L', 'MST-ADV-L', 27900, 7812000, 4),
  ('sdbbuy-adventure-multi-layer-suit', 'XL', 'MST-ADV-XL', 27900, 7812000, 2),

  -- Boots
  ('sdbbuy-touring-riding-boots', 'EU 40', 'MBT-TOU-40', 11900, 3332000, 5),
  ('sdbbuy-touring-riding-boots', 'EU 42', 'MBT-TOU-42', 11900, 3332000, 10),
  ('sdbbuy-touring-riding-boots', 'EU 44', 'MBT-TOU-44', 11900, 3332000, 10),
  ('sdbbuy-touring-riding-boots', 'EU 46', 'MBT-TOU-46', 11900, 3332000, 7),
  ('sdbbuy-race-track-boots', 'EU 40', 'MBT-RAC-40', 15900, 4452000, 3),
  ('sdbbuy-race-track-boots', 'EU 42', 'MBT-RAC-42', 15900, 4452000, 6),
  ('sdbbuy-race-track-boots', 'EU 44', 'MBT-RAC-44', 15900, 4452000, 6),
  ('sdbbuy-race-track-boots', 'EU 46', 'MBT-RAC-46', 15900, 4452000, 5),
  ('sdbbuy-adventure-waterproof-boots', 'EU 40', 'MBT-ADV-40', 13900, 3892000, 4),
  ('sdbbuy-adventure-waterproof-boots', 'EU 42', 'MBT-ADV-42', 13900, 3892000, 8),
  ('sdbbuy-adventure-waterproof-boots', 'EU 44', 'MBT-ADV-44', 13900, 3892000, 8),
  ('sdbbuy-adventure-waterproof-boots', 'EU 46', 'MBT-ADV-46', 13900, 3892000, 4),

  -- Pants
  ('sdbbuy-touring-riding-pants', 'S', 'MPT-TOU-S', 12900, 3612000, 5),
  ('sdbbuy-touring-riding-pants', 'M', 'MPT-TOU-M', 12900, 3612000, 8),
  ('sdbbuy-touring-riding-pants', 'L', 'MPT-TOU-L', 12900, 3612000, 8),
  ('sdbbuy-touring-riding-pants', 'XL', 'MPT-TOU-XL', 12900, 3612000, 5),
  ('sdbbuy-leather-riding-pants', 'S', 'MPT-LTH-S', 18900, 5292000, 3),
  ('sdbbuy-leather-riding-pants', 'M', 'MPT-LTH-M', 18900, 5292000, 5),
  ('sdbbuy-leather-riding-pants', 'L', 'MPT-LTH-L', 18900, 5292000, 5),
  ('sdbbuy-leather-riding-pants', 'XL', 'MPT-LTH-XL', 18900, 5292000, 3),
  ('sdbbuy-waterproof-over-pants', 'S', 'MPT-WTR-S', 9900, 2772000, 7),
  ('sdbbuy-waterproof-over-pants', 'M', 'MPT-WTR-M', 9900, 2772000, 9),
  ('sdbbuy-waterproof-over-pants', 'L', 'MPT-WTR-L', 9900, 2772000, 9),
  ('sdbbuy-waterproof-over-pants', 'XL', 'MPT-WTR-XL', 9900, 2772000, 5),

  -- Protective Gear
  ('sdbbuy-knee-shin-guards', 'One Size', 'PRT-KSG-OS', 3400, 952000, 70),
  ('sdbbuy-back-protector-insert', 'One Size', 'PRT-BKP-OS', 4900, 1372000, 55),
  ('sdbbuy-body-armor-vest', 'S/M', 'PRT-BAV-SM', 8900, 2492000, 9),
  ('sdbbuy-body-armor-vest', 'L/XL', 'PRT-BAV-LX', 8900, 2492000, 16),

  -- Riding Gear
  ('sdbbuy-thermal-base-layer-set', 'S', 'RDG-BLS-S', 4500, 1260000, 15),
  ('sdbbuy-thermal-base-layer-set', 'M', 'RDG-BLS-M', 4500, 1260000, 20),
  ('sdbbuy-thermal-base-layer-set', 'L', 'RDG-BLS-L', 4500, 1260000, 20),
  ('sdbbuy-thermal-base-layer-set', 'XL', 'RDG-BLS-XL', 4500, 1260000, 10),
  ('sdbbuy-neck-tube-balaclava', 'One Size', 'RDG-NTB-OS', 1400, 392000, 150),
  ('sdbbuy-rain-suit', 'S', 'RDG-RNS-S', 5900, 1652000, 10),
  ('sdbbuy-rain-suit', 'M', 'RDG-RNS-M', 5900, 1652000, 12),
  ('sdbbuy-rain-suit', 'L', 'RDG-RNS-L', 5900, 1652000, 12),
  ('sdbbuy-rain-suit', 'XL', 'RDG-RNS-XL', 5900, 1652000, 6),

  -- Motorcycle Accessories
  ('sdbbuy-tank-bag', 'One Size', 'MAC-TNB-OS', 3500, 980000, 48),
  ('sdbbuy-saddlebag-pair', 'One Size', 'MAC-SDB-OS', 6500, 1820000, 20),
  ('sdbbuy-handlebar-phone-mount', 'One Size', 'MAC-PHM-OS', 1900, 532000, 120),
  ('sdbbuy-disc-brake-lock', 'One Size', 'MAC-DBL-OS', 2200, 616000, 85),

  -- Other Motorbike Gear
  ('sdbbuy-universal-tool-roll', 'One Size', 'OMG-TLR-OS', 2100, 588000, 75),
  ('sdbbuy-handlebar-grip-set', 'One Size', 'OMG-GRP-OS', 1600, 448000, 110),
  ('sdbbuy-motorcycle-cover', 'Large', 'OMG-CVR-L', 2400, 672000, 45),
  ('sdbbuy-motorcycle-cover', 'X-Large', 'OMG-CVR-XL', 2400, 672000, 45)
) as v(slug, name, sku, usd, pkr, stock)
join public.products p on p.slug = v.slug
on conflict (sku) do nothing;
