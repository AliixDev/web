-- =====================================================================
-- SDB WEAR — Brand + Catalog Redesign
-- Supabase / PostgreSQL
-- Migration: 20260106000000_sdb_wear_redesign.sql
-- =====================================================================

begin;

-- =====================================================================
-- 1. PRODUCT SEO COLUMNS
-- =====================================================================

alter table public.products
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_keywords text;


-- =====================================================================
-- 2. REQUIRED UNIQUE INDEXES
-- =====================================================================

create unique index if not exists categories_slug_unique_idx
  on public.categories (slug);

create unique index if not exists products_slug_unique_idx
  on public.products (slug);

create unique index if not exists product_variants_sku_unique_idx
  on public.product_variants (sku);


-- =====================================================================
-- 3. RETIRED CATEGORY SLUGS
-- =====================================================================

update public.categories
set is_active = false
where slug in (
  'apparel',
  'home-living',
  'electronics',
  'leather-jackets',
  'fashion-apparel',
  'boxing',
  'gym-fitness',
  'accessories',
  'motorbikes',
  'motorbike-gloves',
  'motorbike-jackets',
  'moto-suits',
  'helmets',
  'motorbike-boots',
  'motorbike-pants',
  'protective-gear',
  'riding-gear',
  'motorcycle-accessories',
  'other-motorbike-gear'
);


-- =====================================================================
-- 4. DEACTIVATE PRODUCTS IN RETIRED CATEGORIES
-- =====================================================================

update public.products p
set is_active = false
where exists (
  select 1
  from public.categories c
  where c.id = p.category_id
    and c.slug in (
      'apparel',
      'home-living',
      'electronics',
      'leather-jackets',
      'fashion-apparel',
      'boxing',
      'gym-fitness',
      'accessories',
      'motorbikes',
      'motorbike-gloves',
      'motorbike-jackets',
      'moto-suits',
      'helmets',
      'motorbike-boots',
      'motorbike-pants',
      'protective-gear',
      'riding-gear',
      'motorcycle-accessories',
      'other-motorbike-gear'
    )
);


-- =====================================================================
-- 5. REMOVE OLD VARIANTS NOT USED BY ORDER HISTORY
-- =====================================================================

delete from public.product_variants pv
where exists (
  select 1
  from public.products p
  join public.categories c
    on c.id = p.category_id
  where p.id = pv.product_id
    and c.slug in (
      'apparel',
      'home-living',
      'electronics',
      'leather-jackets',
      'fashion-apparel',
      'boxing',
      'gym-fitness',
      'accessories',
      'motorbikes',
      'motorbike-gloves',
      'motorbike-jackets',
      'moto-suits',
      'helmets',
      'motorbike-boots',
      'motorbike-pants',
      'protective-gear',
      'riding-gear',
      'motorcycle-accessories',
      'other-motorbike-gear'
    )
)
and not exists (
  select 1
  from public.order_items oi
  where oi.variant_id = pv.id
);


-- =====================================================================
-- 6. REMOVE OLD PRODUCTS NOT USED BY ORDER HISTORY
-- =====================================================================

delete from public.products p
where exists (
  select 1
  from public.categories c
  where c.id = p.category_id
    and c.slug in (
      'apparel',
      'home-living',
      'electronics',
      'leather-jackets',
      'fashion-apparel',
      'boxing',
      'gym-fitness',
      'accessories',
      'motorbikes',
      'motorbike-gloves',
      'motorbike-jackets',
      'moto-suits',
      'helmets',
      'motorbike-boots',
      'motorbike-pants',
      'protective-gear',
      'riding-gear',
      'motorcycle-accessories',
      'other-motorbike-gear'
    )
)
and not exists (
  select 1
  from public.order_items oi
  where oi.product_id = p.id
);


-- =====================================================================
-- 7. REMOVE EMPTY RETIRED CATEGORIES
-- =====================================================================

delete from public.categories c
where c.slug in (
  'apparel',
  'home-living',
  'electronics',
  'leather-jackets',
  'fashion-apparel',
  'boxing',
  'gym-fitness',
  'accessories',
  'motorbikes',
  'motorbike-gloves',
  'motorbike-jackets',
  'moto-suits',
  'helmets',
  'motorbike-boots',
  'motorbike-pants',
  'protective-gear',
  'riding-gear',
  'motorcycle-accessories',
  'other-motorbike-gear'
)
and not exists (
  select 1
  from public.products p
  where p.category_id = c.id
);


-- =====================================================================
-- 8. TOP-LEVEL SDB WEAR CATEGORIES
-- =====================================================================

insert into public.categories (
  name,
  slug,
  parent_id,
  is_active
)
values
  (
    'Motorbike Gear',
    'motorbike-gear',
    null,
    true
  ),
  (
    'Leather Jackets & Biker Fashion',
    'leather-jackets-biker-fashion',
    null,
    true
  ),
  (
    'Handcrafted Gloves',
    'handcrafted-gloves',
    null,
    true
  )
on conflict (slug)
do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  is_active = true;


-- =====================================================================
-- 9. SUBCATEGORIES
-- =====================================================================

insert into public.categories (
  name,
  slug,
  parent_id,
  is_active
)
select
  v.name,
  v.slug,
  p.id,
  true
from (
  values
    ('Moto Suits', 'moto-suits', 'motorbike-gear'),
    ('Moto Gloves', 'moto-gloves', 'motorbike-gear'),
    ('Moto Shoes', 'moto-shoes', 'motorbike-gear'),

    ('Biker Leather Jackets', 'biker-leather-jackets', 'leather-jackets-biker-fashion'),
    ('Casual Leather Jackets', 'casual-leather-jackets', 'leather-jackets-biker-fashion'),
    ('Heritage Leather', 'heritage-leather', 'leather-jackets-biker-fashion'),
    ('Racing-Inspired Jackets', 'racing-inspired-jackets', 'leather-jackets-biker-fashion'),
    ('Biker Fashion', 'biker-fashion', 'leather-jackets-biker-fashion'),

    ('Leather Gloves', 'leather-gloves', 'handcrafted-gloves'),
    ('Riding Gloves', 'riding-gloves', 'handcrafted-gloves'),
    ('Driving Gloves', 'driving-gloves', 'handcrafted-gloves'),
    ('Work Gloves', 'work-gloves', 'handcrafted-gloves'),
    ('Fashion Gloves', 'fashion-gloves', 'handcrafted-gloves'),
    ('Mechanic Gloves', 'mechanic-gloves', 'handcrafted-gloves'),
    ('Tactical Gloves', 'tactical-gloves', 'handcrafted-gloves'),
    ('Custom Gloves', 'custom-gloves', 'handcrafted-gloves')
) as v(name, slug, parent_slug)
join public.categories p
  on p.slug = v.parent_slug
on conflict (slug)
do update set
  name = excluded.name,
  parent_id = excluded.parent_id,
  is_active = true;


-- =====================================================================
-- 10. MOTORBIKE GEAR PRODUCTS
-- =====================================================================

insert into public.products (
  category_id,
  slug,
  name,
  seo_title,
  seo_description,
  seo_keywords,
  description,
  image_url,
  images,
  brand,
  price_usd_cents,
  price_pkr_paisa,
  compare_at_price_usd_cents,
  compare_at_price_pkr_paisa,
  stock_quantity,
  is_active
)
select
  c.id,
  v.slug,
  v.name,
  v.seo_title,
  v.seo_description,
  v.seo_keywords,
  v.description,
  v.image_url,
  v.images,
  v.brand,
  v.price_usd_cents::integer,
  v.price_pkr_paisa::integer,
  v.compare_at_price_usd_cents::integer,
  v.compare_at_price_pkr_paisa::integer,
  v.stock_quantity::integer,
  true
from (
  values

  (
    'moto-suits',
    'sdb-wear-1-piece-leather-racing-suit',
    'SDB WEAR 1-Piece Leather Racing Suit',
    'SDB WEAR 1-Piece Leather Racing Suit',
    'One-piece leather racing suit from SDB WEAR with a close riding cut, stretch panels and track-focused construction.',
    'SDB WEAR, motorcycle racing suit, leather racing suit, one piece moto suit',
    'A full one-piece leather suit built for track days. Pre-curved limbs hold the riding position, replaceable knee pucks protect at the pegs, and stretch panels at the shoulders and hips keep movement free.',
    '/placeholders/moto-suit.svg',
    '["/placeholders/moto-suit.svg","/placeholders/moto-suit-detail.svg","/placeholders/moto-suit-side.svg"]'::jsonb,
    'SDB WEAR',
    44900,
    12572000,
    null::integer,
    null::integer,
    10
  ),

  (
    'moto-suits',
    'sdb-wear-2-piece-motorcycle-leather-suit',
    'SDB WEAR 2-Piece Motorcycle Leather Suit',
    'SDB WEAR 2-Piece Motorcycle Leather Suit',
    'Two-piece motorcycle leather suit from SDB WEAR with sport jacket, matching pants and connection zip.',
    'SDB WEAR, two piece motorcycle suit, leather motorcycle suit, riding suit',
    'A zippered two-piece leather suit pairing a sport jacket with matching pants. Full-circumference connection zip, adjustable cuff and waist closures, and reinforced knee panels.',
    '/placeholders/moto-suit.svg',
    '["/placeholders/moto-suit.svg","/placeholders/moto-suit-side.svg","/placeholders/moto-suit-detail.svg"]'::jsonb,
    'SDB WEAR',
    37900,
    10612000,
    null::integer,
    null::integer,
    12
  ),

  (
    'moto-suits',
    'sdb-wear-premium-track-racing-suit',
    'SDB WEAR Premium Track Racing Suit',
    'SDB WEAR Premium Track Racing Suit',
    'Premium track racing suit from SDB WEAR with race cut, leather construction, sliders and ventilation zones.',
    'SDB WEAR, premium racing suit, track suit, motorcycle racing gear',
    'The premium track suit features a one-piece racing cut, multi-panel leather construction, hard knee sliders and generous perforation zones for airflow.',
    '/placeholders/moto-suit.svg',
    '["/placeholders/moto-suit.svg","/placeholders/moto-suit-detail.svg","/placeholders/moto-suit-side.svg"]'::jsonb,
    'SDB WEAR',
    49900,
    13972000,
    54900,
    15372000,
    8
  ),

  (
    'moto-suits',
    'sdb-wear-professional-protection-suit',
    'SDB WEAR Professional Protection Suit',
    'SDB WEAR Professional Protection Suit',
    'Professional motorcycle protection suit from SDB WEAR with structured leather panels, armor pockets and ventilation.',
    'SDB WEAR, protection suit, motorcycle protective gear, leather riding suit',
    'A professional-grade protection suit for sport riding and training. Structured leather panels, integrated armor pockets, ventilation zips and pre-curved sleeves.',
    '/placeholders/moto-suit.svg',
    '["/placeholders/moto-suit.svg","/placeholders/moto-suit-side.svg","/placeholders/moto-suit-detail.svg"]'::jsonb,
    'SDB WEAR',
    39900,
    11172000,
    null::integer,
    null::integer,
    14
  ),

  (
    'moto-gloves',
    'sdb-wear-full-finger-racing-gloves',
    'SDB WEAR Full-Finger Racing Gloves',
    'SDB WEAR Full-Finger Racing Gloves',
    'Full-finger racing gloves from SDB WEAR with padded knuckles, pre-curved fingers and reinforced palm.',
    'SDB WEAR, racing gloves, motorcycle gloves, full finger riding gloves',
    'Full-finger racing gloves with padded knuckle panels, pre-curved fingers and a double-layer palm.',
    '/placeholders/moto-glove.svg',
    '["/placeholders/moto-glove.svg","/placeholders/moto-glove-detail.svg","/placeholders/moto-glove-side.svg"]'::jsonb,
    'SDB WEAR',
    11900,
    3332000,
    null::integer,
    null::integer,
    40
  ),

  (
    'moto-gloves',
    'sdb-wear-short-cuff-riding-gloves',
    'SDB WEAR Short-Cuff Riding Gloves',
    'SDB WEAR Short-Cuff Riding Gloves',
    'Short-cuff riding gloves from SDB WEAR with reinforced palm, breathable backhand and touchscreen fingertips.',
    'SDB WEAR, short cuff gloves, riding gloves, motorcycle gloves',
    'Short-cuff riding gloves for everyday rides. Pre-curved fingers, reinforced palm, breathable mesh backhand and touchscreen fingertips.',
    '/placeholders/moto-glove.svg',
    '["/placeholders/moto-glove.svg","/placeholders/moto-glove-side.svg","/placeholders/moto-glove-detail.svg"]'::jsonb,
    'SDB WEAR',
    10900,
    3052000,
    null::integer,
    null::integer,
    45
  ),

  (
    'moto-gloves',
    'sdb-wear-long-cuff-racing-gloves',
    'SDB WEAR Long-Cuff Racing Gloves',
    'SDB WEAR Long-Cuff Racing Gloves',
    'Long-cuff racing gloves from SDB WEAR with hard knuckle protection, finger sliders and gauntlet cuff.',
    'SDB WEAR, long cuff racing gloves, motorcycle racing gloves, gauntlet gloves',
    'Long-cuff racing gloves with a hard knuckle shell, finger sliders, double-layer palm and extended gauntlet cuff.',
    '/placeholders/moto-glove.svg',
    '["/placeholders/moto-glove.svg","/placeholders/moto-glove-detail.svg","/placeholders/moto-glove-side.svg"]'::jsonb,
    'SDB WEAR',
    13900,
    3892000,
    15900,
    4452000,
    30
  ),

  (
    'moto-gloves',
    'sdb-wear-touring-motorcycle-gloves',
    'SDB WEAR Touring Motorcycle Gloves',
    'SDB WEAR Touring Motorcycle Gloves',
    'Touring motorcycle gloves from SDB WEAR with waterproof membrane, thermal lining and touchscreen fingertips.',
    'SDB WEAR, touring motorcycle gloves, waterproof riding gloves, motorcycle touring gear',
    'Touring gloves built for long days in the saddle. A waterproof membrane, thermal lining, visor wipe and touchscreen fingertips handle practical stops.',
    '/placeholders/moto-glove.svg',
    '["/placeholders/moto-glove.svg","/placeholders/moto-glove-side.svg","/placeholders/moto-glove-detail.svg"]'::jsonb,
    'SDB WEAR',
    12900,
    3612000,
    14900,
    4172000,
    35
  ),

  (
    'moto-gloves',
    'sdb-wear-premium-leather-moto-gloves',
    'SDB WEAR Premium Leather Moto Gloves',
    'SDB WEAR Premium Leather Moto Gloves',
    'Premium leather motorcycle gloves from SDB WEAR with reinforced palm, padded knuckle and double closure.',
    'SDB WEAR, premium leather moto gloves, motorcycle gloves, leather riding gloves',
    'Premium leather moto gloves with a supple hide shell, reinforced palm and padded knuckle. Perforated panels manage heat while the double closure holds a precise fit.',
    '/placeholders/moto-glove.svg',
    '["/placeholders/moto-glove.svg","/placeholders/moto-glove-detail.svg","/placeholders/moto-glove-side.svg"]'::jsonb,
    'SDB WEAR',
    15900,
    4452000,
    null::integer,
    null::integer,
    25
  ),

  (
    'moto-shoes',
    'sdb-wear-motorcycle-riding-shoes',
    'SDB WEAR Motorcycle Riding Shoes',
    'SDB WEAR Motorcycle Riding Shoes',
    'Motorcycle riding shoes from SDB WEAR with reinforced toe and heel, oil-resistant sole and waterproof membrane.',
    'SDB WEAR, motorcycle shoes, riding shoes, motorcycle footwear',
    'Ankle-height riding shoes that look right off the bike. Reinforced toe and heel counters, oil-resistant soles and a waterproof membrane.',
    '/placeholders/moto-shoe.svg',
    '["/placeholders/moto-shoe.svg","/placeholders/moto-shoe-side.svg","/placeholders/moto-shoe-detail.svg"]'::jsonb,
    'SDB WEAR',
    12900,
    3612000,
    null::integer,
    null::integer,
    35
  ),

  (
    'moto-shoes',
    'sdb-wear-premium-moto-boots',
    'SDB WEAR Premium Moto Boots',
    'SDB WEAR Premium Moto Boots',
    'Premium motorcycle boots from SDB WEAR with reinforced ankle, rigid heel and toe and cushioned insole.',
    'SDB WEAR, premium moto boots, motorcycle boots, riding boots',
    'Premium moto boots with a full-length zip, reinforced ankle support and cushioned insole.',
    '/placeholders/moto-shoe.svg',
    '["/placeholders/moto-shoe.svg","/placeholders/moto-shoe-detail.svg","/placeholders/moto-shoe-side.svg"]'::jsonb,
    'SDB WEAR',
    17900,
    5012000,
    null::integer,
    null::integer,
    25
  ),

  (
    'moto-shoes',
    'sdb-wear-urban-motorcycle-shoes',
    'SDB WEAR Urban Motorcycle Shoes',
    'SDB WEAR Urban Motorcycle Shoes',
    'Urban motorcycle shoes from SDB WEAR with low-profile silhouette, reinforced toe and commuter sole.',
    'SDB WEAR, urban motorcycle shoes, commuter riding shoes, motorcycle footwear',
    'Urban riding shoes with a low-profile silhouette, reinforced toe box, grippy commuter sole and waterproof membrane.',
    '/placeholders/moto-shoe.svg',
    '["/placeholders/moto-shoe.svg","/placeholders/moto-shoe-side.svg","/placeholders/moto-shoe-detail.svg"]'::jsonb,
    'SDB WEAR',
    10900,
    3052000,
    null::integer,
    null::integer,
    40
  ),

  (
    'moto-shoes',
    'sdb-wear-leather-riding-boots',
    'SDB WEAR Leather Riding Boots',
    'SDB WEAR Leather Riding Boots',
    'Leather riding boots from SDB WEAR with reinforced ankle, oil-resistant sole and waterproof membrane.',
    'SDB WEAR, leather riding boots, motorcycle boots, leather motorcycle footwear',
    'Leather riding boots with a classic profile and modern protection. Reinforced ankle, oil-resistant sole and waterproof membrane.',
    '/placeholders/moto-shoe.svg',
    '["/placeholders/moto-shoe.svg","/placeholders/moto-shoe-detail.svg","/placeholders/moto-shoe-side.svg"]'::jsonb,
    'SDB WEAR',
    14900,
    4172000,
    16900,
    4732000,
    28
  )

) as v(
  cat_slug,
  slug,
  name,
  seo_title,
  seo_description,
  seo_keywords,
  description,
  image_url,
  images,
  brand,
  price_usd_cents,
  price_pkr_paisa,
  compare_at_price_usd_cents,
  compare_at_price_pkr_paisa,
  stock_quantity
)
join public.categories c
  on c.slug = v.cat_slug
on conflict (slug)
do update set
  category_id = excluded.category_id,
  name = excluded.name,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  seo_keywords = excluded.seo_keywords,
  description = excluded.description,
  image_url = excluded.image_url,
  images = excluded.images,
  brand = excluded.brand,
  price_usd_cents = excluded.price_usd_cents,
  price_pkr_paisa = excluded.price_pkr_paisa,
  compare_at_price_usd_cents = excluded.compare_at_price_usd_cents,
  compare_at_price_pkr_paisa = excluded.compare_at_price_pkr_paisa,
  stock_quantity = excluded.stock_quantity,
  is_active = true;


-- =====================================================================
-- 11. LEATHER JACKETS & BIKER FASHION
-- =====================================================================

insert into public.products (
  category_id,
  slug,
  name,
  seo_title,
  seo_description,
  seo_keywords,
  description,
  image_url,
  images,
  brand,
  price_usd_cents,
  price_pkr_paisa,
  compare_at_price_usd_cents,
  compare_at_price_pkr_paisa,
  stock_quantity,
  is_active
)
select
  c.id,
  v.slug,
  v.name,
  v.seo_title,
  v.seo_description,
  v.seo_keywords,
  v.description,
  v.image_url,
  v.images,
  v.brand,
  v.price_usd_cents::integer,
  v.price_pkr_paisa::integer,
  v.compare_at_price_usd_cents::integer,
  v.compare_at_price_pkr_paisa::integer,
  v.stock_quantity::integer,
  true
from (
  values

  (
    'biker-leather-jackets',
    'sdb-wear-classic-black-biker-leather-jacket',
    'SDB WEAR Classic Black Biker Leather Jacket',
    'SDB WEAR Classic Black Biker Leather Jacket',
    'Classic black biker leather jacket from SDB WEAR with full-grain leather, asymmetric zip and quilted shoulders.',
    'SDB WEAR, black biker jacket, leather jacket, motorcycle jacket',
    'The classic black biker jacket: full-grain leather, asymmetric zip, quilted shoulder panels and four pockets.',
    '/placeholders/leather-jacket.svg',
    '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-side.svg","/placeholders/leather-jacket-detail.svg"]'::jsonb,
    'SDB WEAR',
    22900,
    6412000,
    null::integer,
    null::integer,
    25
  ),

  (
    'biker-leather-jackets',
    'sdb-wear-premium-motorcycle-leather-jacket',
    'SDB WEAR Premium Motorcycle Leather Jacket',
    'SDB WEAR Premium Motorcycle Leather Jacket',
    'Premium motorcycle leather jacket from SDB WEAR with riding-oriented cut, pre-curved sleeves and thermal liner.',
    'SDB WEAR, premium motorcycle jacket, leather riding jacket, biker jacket',
    'A premium motorcycle leather jacket with a riding-oriented cut, pre-curved sleeves, removable thermal liner and armor-ready pockets.',
    '/placeholders/leather-jacket.svg',
    '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-detail.svg","/placeholders/leather-jacket-side.svg"]'::jsonb,
    'SDB WEAR',
    29900,
    8372000,
    32900,
    9212000,
    20
  ),

  (
    'biker-leather-jackets',
    'sdb-wear-urban-biker-leather-jacket',
    'SDB WEAR Urban Biker Leather Jacket',
    'SDB WEAR Urban Biker Leather Jacket',
    'Urban biker leather jacket from SDB WEAR with streamlined profile, smooth leather and minimal hardware.',
    'SDB WEAR, urban biker jacket, leather jacket, city motorcycle jacket',
    'An urban biker jacket with a streamlined profile, smooth leather, minimal hardware and a clean zip front.',
    '/placeholders/leather-jacket.svg',
    '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-side.svg","/placeholders/leather-jacket-detail.svg"]'::jsonb,
    'SDB WEAR',
    19900,
    5572000,
    null::integer,
    null::integer,
    30
  ),

  (
    'casual-leather-jackets',
    'sdb-wear-minimal-black-leather-jacket',
    'SDB WEAR Minimal Black Leather Jacket',
    'SDB WEAR Minimal Black Leather Jacket',
    'Minimal black leather jacket from SDB WEAR with clean zip front and understated hardware.',
    'SDB WEAR, minimal leather jacket, black leather jacket, casual jacket',
    'A minimal black leather jacket with clean zip front, understated hardware and a relaxed fit.',
    '/placeholders/leather-jacket.svg',
    '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-detail.svg","/placeholders/leather-jacket-side.svg"]'::jsonb,
    'SDB WEAR',
    17900,
    5012000,
    null::integer,
    null::integer,
    30
  ),

  (
    'casual-leather-jackets',
    'sdb-wear-premium-casual-leather-jacket',
    'SDB WEAR Premium Casual Leather Jacket',
    'SDB WEAR Premium Casual Leather Jacket',
    'Premium casual leather jacket from SDB WEAR with soft hand feel, tailored cut and stand collar.',
    'SDB WEAR, premium casual leather jacket, mens leather jacket, casual leather',
    'A premium casual leather jacket with a soft hand feel and tailored cut. Stand collar, hidden placket and functional pockets.',
    '/placeholders/leather-jacket.svg',
    '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-side.svg","/placeholders/leather-jacket-detail.svg"]'::jsonb,
    'SDB WEAR',
    19900,
    5572000,
    null::integer,
    null::integer,
    26
  ),

  (
    'casual-leather-jackets',
    'sdb-wear-relaxed-everyday-leather-jacket',
    'SDB WEAR Relaxed Everyday Leather Jacket',
    'SDB WEAR Relaxed Everyday Leather Jacket',
    'Relaxed everyday leather jacket from SDB WEAR with softer drape, roomier cut and ribbed collar.',
    'SDB WEAR, relaxed leather jacket, everyday leather jacket, casual biker fashion',
    'A relaxed everyday leather jacket with a softer drape and roomier cut. Full-zip front, ribbed collar and cuffs.',
    '/placeholders/leather-jacket.svg',
    '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-detail.svg","/placeholders/leather-jacket-side.svg"]'::jsonb,
    'SDB WEAR',
    16900,
    4732000,
    null::integer,
    null::integer,
    32
  ),

  (
    'heritage-leather',
    'sdb-wear-heritage-rider-jacket',
    'SDB WEAR Heritage Rider Jacket',
    'SDB WEAR Heritage Rider Jacket',
    'Heritage rider jacket from SDB WEAR with full-grain leather, classic racing silhouette and quilted lining.',
    'SDB WEAR, heritage rider jacket, vintage leather jacket, classic biker jacket',
    'A heritage rider jacket cut from full-grain leather with a classic racing silhouette, snap collar, zip front and quilted lining.',
    '/placeholders/leather-jacket.svg',
    '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-side.svg","/placeholders/leather-jacket-detail.svg"]'::jsonb,
    'SDB WEAR',
    24900,
    6972000,
    27900,
    7812000,
    18
  ),

  (
    'heritage-leather',
    'sdb-wear-heritage-leather-riding-jacket',
    'SDB WEAR Heritage Leather Riding Jacket',
    'SDB WEAR Heritage Leather Riding Jacket',
    'Heritage leather riding jacket from SDB WEAR with cafe-racer profile, clean chest panel and pre-curved sleeves.',
    'SDB WEAR, heritage leather jacket, cafe racer jacket, leather riding jacket',
    'A heritage leather riding jacket with a timeless cafe-racer profile, clean chest panel, secure zip front and pre-curved sleeves.',
    '/placeholders/leather-jacket.svg',
    '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-detail.svg","/placeholders/leather-jacket-side.svg"]'::jsonb,
    'SDB WEAR',
    21900,
    6132000,
    null::integer,
    null::integer,
    22
  ),

  (
    'racing-inspired-jackets',
    'sdb-wear-vintage-racing-leather-jacket',
    'SDB WEAR Vintage Racing Leather Jacket',
    'SDB WEAR Vintage Racing Leather Jacket',
    'Vintage racing leather jacket from SDB WEAR with period-inspired panels and modern fit.',
    'SDB WEAR, vintage racing jacket, racing leather jacket, biker fashion',
    'A vintage racing leather jacket with period-inspired panels, contrast stitching, zip sleeves and modern fit.',
    '/placeholders/leather-jacket.svg',
    '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-side.svg","/placeholders/leather-jacket-detail.svg"]'::jsonb,
    'SDB WEAR',
    25900,
    7252000,
    null::integer,
    null::integer,
    15
  ),

  (
    'racing-inspired-jackets',
    'sdb-wear-racing-inspired-leather-jacket',
    'SDB WEAR Racing-Inspired Leather Jacket',
    'SDB WEAR Racing-Inspired Leather Jacket',
    'Racing-inspired leather jacket from SDB WEAR with aerodynamic paneling, perforated zones and structured shoulders.',
    'SDB WEAR, racing leather jacket, racing inspired jacket, motorcycle fashion',
    'A racing-inspired leather jacket with aerodynamic paneling, perforated ventilation zones, structured shoulders and close cut.',
    '/placeholders/leather-jacket.svg',
    '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-detail.svg","/placeholders/leather-jacket-side.svg"]'::jsonb,
    'SDB WEAR',
    23900,
    6692000,
    null::integer,
    null::integer,
    20
  ),

  (
    'biker-fashion',
    'sdb-wear-leather-biker-vest',
    'SDB WEAR Leather Biker Vest',
    'SDB WEAR Leather Biker Vest',
    'Leather biker vest from SDB WEAR with full-grain hide, zip front and four pockets.',
    'SDB WEAR, leather biker vest, biker fashion, motorcycle vest',
    'A leather biker vest cut from full-grain hide with zip front and four pockets. Layers easily over a tee or hoodie.',
    '/placeholders/leather-jacket.svg',
    '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-detail.svg","/placeholders/leather-jacket-side.svg"]'::jsonb,
    'SDB WEAR',
    14900,
    4172000,
    null::integer,
    null::integer,
    35
  ),

  (
    'biker-fashion',
    'sdb-wear-biker-fashion-leather-jacket',
    'SDB WEAR Biker Fashion Leather Jacket',
    'SDB WEAR Biker Fashion Leather Jacket',
    'Biker fashion leather jacket from SDB WEAR with tailored waist, asymmetric zip and quilted accents.',
    'SDB WEAR, biker fashion jacket, leather biker jacket, fashion leather jacket',
    'A biker-fashion leather jacket with tailored waist, asymmetric zip and quilted accents.',
    '/placeholders/leather-jacket.svg',
    '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-side.svg","/placeholders/leather-jacket-detail.svg"]'::jsonb,
    'SDB WEAR',
    17900,
    5012000,
    null::integer,
    null::integer,
    28
  )

) as v(
  cat_slug,
  slug,
  name,
  seo_title,
  seo_description,
  seo_keywords,
  description,
  image_url,
  images,
  brand,
  price_usd_cents,
  price_pkr_paisa,
  compare_at_price_usd_cents,
  compare_at_price_pkr_paisa,
  stock_quantity
)
join public.categories c
  on c.slug = v.cat_slug
on conflict (slug)
do update set
  category_id = excluded.category_id,
  name = excluded.name,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  seo_keywords = excluded.seo_keywords,
  description = excluded.description,
  image_url = excluded.image_url,
  images = excluded.images,
  brand = excluded.brand,
  price_usd_cents = excluded.price_usd_cents,
  price_pkr_paisa = excluded.price_pkr_paisa,
  compare_at_price_usd_cents = excluded.compare_at_price_usd_cents,
  compare_at_price_pkr_paisa = excluded.compare_at_price_pkr_paisa,
  stock_quantity = excluded.stock_quantity,
  is_active = true;


-- =====================================================================
-- 12. HANDCRAFTED GLOVES
-- =====================================================================

insert into public.products (
  category_id,
  slug,
  name,
  seo_title,
  seo_description,
  seo_keywords,
  description,
  image_url,
  images,
  brand,
  price_usd_cents,
  price_pkr_paisa,
  compare_at_price_usd_cents,
  compare_at_price_pkr_paisa,
  stock_quantity,
  is_active
)
select
  c.id,
  v.slug,
  v.name,
  v.seo_title,
  v.seo_description,
  v.seo_keywords,
  v.description,
  v.image_url,
  v.images,
  v.brand,
  v.price_usd_cents::integer,
  v.price_pkr_paisa::integer,
  v.compare_at_price_usd_cents::integer,
  v.compare_at_price_pkr_paisa::integer,
  v.stock_quantity::integer,
  true
from (
  values

  (
    'leather-gloves',
    'sdb-wear-stitched-leather-gloves',
    'SDB WEAR Stitched Leather Gloves',
    'SDB WEAR Stitched Leather Gloves',
    'Stitched leather gloves from SDB WEAR with full-grain hide, reinforced stitching and snap closure.',
    'SDB WEAR, leather gloves, stitched gloves, handcrafted leather gloves',
    'Stitched leather gloves with a clean tailored silhouette. Full-grain hide, reinforced stitching and secure snap closure.',
    '/placeholders/gloves.svg',
    '["/placeholders/gloves.svg","/placeholders/gloves-detail.svg","/placeholders/gloves-side.svg"]'::jsonb,
    'SDB WEAR',
    7900,
    2212000,
    null::integer,
    null::integer,
    60
  ),

  (
    'leather-gloves',
    'sdb-wear-premium-handcrafted-leather-gloves',
    'SDB WEAR Premium Handcrafted Leather Gloves',
    'SDB WEAR Premium Handcrafted Leather Gloves',
    'Premium handcrafted leather gloves from SDB WEAR with soft lining and precise stitching.',
    'SDB WEAR, premium leather gloves, handcrafted gloves, leather handwear',
    'Premium stitched leather gloves with soft lining, precise stitching and perforated knuckles.',
    '/placeholders/gloves.svg',
    '["/placeholders/gloves.svg","/placeholders/gloves-side.svg","/placeholders/gloves-detail.svg"]'::jsonb,
    'SDB WEAR',
    9900,
    2772000,
    null::integer,
    null::integer,
    45
  ),

  (
    'riding-gloves',
    'sdb-wear-stitched-riding-gloves',
    'SDB WEAR Stitched Riding Gloves',
    'SDB WEAR Stitched Riding Gloves',
    'Stitched riding gloves from SDB WEAR with reinforced palm, padded knuckle and pre-curved fingers.',
    'SDB WEAR, riding gloves, motorcycle gloves, stitched riding gloves',
    'Stitched riding gloves with reinforced palm, padded knuckle panel, pre-curved fingers and secure cuff.',
    '/placeholders/gloves.svg',
    '["/placeholders/gloves.svg","/placeholders/gloves-detail.svg","/placeholders/gloves-side.svg"]'::jsonb,
    'SDB WEAR',
    6900,
    1932000,
    null::integer,
    null::integer,
    70
  ),

  (
    'riding-gloves',
    'sdb-wear-reinforced-stitched-riding-gloves',
    'SDB WEAR Reinforced Stitched Riding Gloves',
    'SDB WEAR Reinforced Stitched Riding Gloves',
    'Reinforced stitched riding gloves from SDB WEAR with double-layer palm and padded knuckle.',
    'SDB WEAR, reinforced riding gloves, motorcycle riding gloves, stitched gloves',
    'Reinforced stitched riding gloves with double-layer palm, padded knuckle, touchscreen fingertips and hook-and-loop cuff.',
    '/placeholders/gloves.svg',
    '["/placeholders/gloves.svg","/placeholders/gloves-side.svg","/placeholders/gloves-detail.svg"]'::jsonb,
    'SDB WEAR',
    8900,
    2492000,
    null::integer,
    null::integer,
    55
  ),

  (
    'driving-gloves',
    'sdb-wear-classic-driving-gloves',
    'SDB WEAR Classic Driving Gloves',
    'SDB WEAR Classic Driving Gloves',
    'Classic driving gloves from SDB WEAR with ventilated backhand and wrist snap.',
    'SDB WEAR, driving gloves, classic leather gloves, handcrafted driving gloves',
    'Classic stitched driving gloves with timeless cut, ventilated backhand and wrist snap.',
    '/placeholders/gloves.svg',
    '["/placeholders/gloves.svg","/placeholders/gloves-detail.svg","/placeholders/gloves-side.svg"]'::jsonb,
    'SDB WEAR',
    5900,
    1652000,
    null::integer,
    null::integer,
    80
  ),

  (
    'driving-gloves',
    'sdb-wear-perforated-driving-gloves',
    'SDB WEAR Perforated Driving Gloves',
    'SDB WEAR Perforated Driving Gloves',
    'Perforated driving gloves from SDB WEAR with breathable construction and reinforced seams.',
    'SDB WEAR, perforated driving gloves, leather driving gloves, handcrafted gloves',
    'Perforated stitched driving gloves with breathable construction, supple leather and reinforced seams.',
    '/placeholders/gloves.svg',
    '["/placeholders/gloves.svg","/placeholders/gloves-detail.svg","/placeholders/gloves-side.svg"]'::jsonb,
    'SDB WEAR',
    6900,
    1932000,
    null::integer,
    null::integer,
    75
  ),

  (
    'work-gloves',
    'sdb-wear-stitched-work-gloves',
    'SDB WEAR Stitched Work Gloves',
    'SDB WEAR Stitched Work Gloves',
    'Stitched work gloves from SDB WEAR with tough leather palm and reinforced fingertips.',
    'SDB WEAR, work gloves, leather work gloves, handcrafted work gloves',
    'Stitched work gloves with tough leather palm, reinforced fingertips and elasticated wrist.',
    '/placeholders/gloves.svg',
    '["/placeholders/gloves.svg","/placeholders/gloves-detail.svg","/placeholders/gloves-side.svg"]'::jsonb,
    'SDB WEAR',
    3900,
    1092000,
    null::integer,
    null::integer,
    120
  ),

  (
    'work-gloves',
    'sdb-wear-reinforced-work-gloves',
    'SDB WEAR Reinforced Work Gloves',
    'SDB WEAR Reinforced Work Gloves',
    'Reinforced work gloves from SDB WEAR with double-layer palm, padded knuckle and reinforced thumb.',
    'SDB WEAR, reinforced work gloves, leather work gloves, workshop gloves',
    'Reinforced stitched work gloves with double-layer palm, padded knuckle and reinforced thumb.',
    '/placeholders/gloves.svg',
    '["/placeholders/gloves.svg","/placeholders/gloves-detail.svg","/placeholders/gloves-side.svg"]'::jsonb,
    'SDB WEAR',
    4900,
    1372000,
    null::integer,
    null::integer,
    100
  ),

  (
    'fashion-gloves',
    'sdb-wear-fashion-stitch-gloves',
    'SDB WEAR Fashion Stitch Gloves',
    'SDB WEAR Fashion Stitch Gloves',
    'Fashion stitch gloves from SDB WEAR with slim profile, soft leather and precise stitching.',
    'SDB WEAR, fashion gloves, leather fashion gloves, stitched gloves',
    'Fashion stitched gloves with slim profile, clean lines, soft leather and secure snap.',
    '/placeholders/gloves.svg',
    '["/placeholders/gloves.svg","/placeholders/gloves-detail.svg","/placeholders/gloves-side.svg"]'::jsonb,
    'SDB WEAR',
    5900,
    1652000,
    null::integer,
    null::integer,
    65
  ),

  (
    'mechanic-gloves',
    'sdb-wear-mechanic-stitched-gloves',
    'SDB WEAR Mechanic Stitched Gloves',
    'SDB WEAR Mechanic Stitched Gloves',
    'Mechanic stitched gloves from SDB WEAR with grippy palm, reinforced seams and touchscreen tips.',
    'SDB WEAR, mechanic gloves, workshop gloves, stitched mechanic gloves',
    'Stitched mechanic gloves with grippy palm, reinforced seams, snug fit and touchscreen fingertips.',
    '/placeholders/gloves.svg',
    '["/placeholders/gloves.svg","/placeholders/gloves-detail.svg","/placeholders/gloves-side.svg"]'::jsonb,
    'SDB WEAR',
    4500,
    1260000,
    null::integer,
    null::integer,
    90
  ),

  (
    'tactical-gloves',
    'sdb-wear-tactical-style-stitched-gloves',
    'SDB WEAR Tactical-Style Stitched Gloves',
    'SDB WEAR Tactical-Style Stitched Gloves',
    'Tactical-style stitched gloves from SDB WEAR with reinforced palm, padded knuckle and adjustable strap.',
    'SDB WEAR, tactical style gloves, reinforced gloves, stitched gloves',
    'Tactical-style stitched gloves with reinforced palm, padded knuckle and adjustable strap.',
    '/placeholders/gloves.svg',
    '["/placeholders/gloves.svg","/placeholders/gloves-side.svg","/placeholders/gloves-detail.svg"]'::jsonb,
    'SDB WEAR',
    7900,
    2212000,
    null::integer,
    null::integer,
    50
  ),

  (
    'custom-gloves',
    'sdb-wear-custom-stitched-gloves',
    'SDB WEAR Custom Stitched Gloves',
    'SDB WEAR Custom Stitched Gloves',
    'Custom stitched gloves from SDB WEAR made to your measurements with selectable leather and stitching.',
    'SDB WEAR, custom gloves, handmade gloves, bespoke leather gloves',
    'Custom stitched gloves made to your measurements. Choose the leather, stitching and fit.',
    '/placeholders/gloves.svg',
    '["/placeholders/gloves.svg","/placeholders/gloves-detail.svg","/placeholders/gloves-side.svg"]'::jsonb,
    'SDB WEAR',
    11900,
    3332000,
    null::integer,
    null::integer,
    20
  )

) as v(
  cat_slug,
  slug,
  name,
  seo_title,
  seo_description,
  seo_keywords,
  description,
  image_url,
  images,
  brand,
  price_usd_cents,
  price_pkr_paisa,
  compare_at_price_usd_cents,
  compare_at_price_pkr_paisa,
  stock_quantity
)
join public.categories c
  on c.slug = v.cat_slug
on conflict (slug)
do update set
  category_id = excluded.category_id,
  name = excluded.name,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  seo_keywords = excluded.seo_keywords,
  description = excluded.description,
  image_url = excluded.image_url,
  images = excluded.images,
  brand = excluded.brand,
  price_usd_cents = excluded.price_usd_cents,
  price_pkr_paisa = excluded.price_pkr_paisa,
  compare_at_price_usd_cents = excluded.compare_at_price_usd_cents,
  compare_at_price_pkr_paisa = excluded.compare_at_price_pkr_paisa,
  stock_quantity = excluded.stock_quantity,
  is_active = true;


-- =====================================================================
-- 13. PRODUCT VARIANTS — ALPHA SIZES
-- =====================================================================

insert into public.product_variants (
  product_id,
  name,
  sku,
  price_usd_cents,
  price_pkr_paisa,
  stock_quantity,
  is_active
)
select
  p.id,
  s.name,
  p.slug || '-' || s.code,
  p.price_usd_cents,
  p.price_pkr_paisa,
  s.stock,
  true
from public.products p
cross join (
  values
    ('S', 's', 10),
    ('M', 'm', 14),
    ('L', 'l', 14),
    ('XL', 'xl', 8)
) as s(name, code, stock)
where p.slug in (
  'sdb-wear-1-piece-leather-racing-suit',
  'sdb-wear-2-piece-motorcycle-leather-suit',
  'sdb-wear-premium-track-racing-suit',
  'sdb-wear-professional-protection-suit',

  'sdb-wear-full-finger-racing-gloves',
  'sdb-wear-short-cuff-riding-gloves',
  'sdb-wear-long-cuff-racing-gloves',
  'sdb-wear-touring-motorcycle-gloves',
  'sdb-wear-premium-leather-moto-gloves',

  'sdb-wear-classic-black-biker-leather-jacket',
  'sdb-wear-premium-motorcycle-leather-jacket',
  'sdb-wear-urban-biker-leather-jacket',
  'sdb-wear-minimal-black-leather-jacket',
  'sdb-wear-premium-casual-leather-jacket',
  'sdb-wear-relaxed-everyday-leather-jacket',
  'sdb-wear-heritage-rider-jacket',
  'sdb-wear-heritage-leather-riding-jacket',
  'sdb-wear-vintage-racing-leather-jacket',
  'sdb-wear-racing-inspired-leather-jacket',
  'sdb-wear-leather-biker-vest',
  'sdb-wear-biker-fashion-leather-jacket',

  'sdb-wear-stitched-leather-gloves',
  'sdb-wear-premium-handcrafted-leather-gloves',
  'sdb-wear-stitched-riding-gloves',
  'sdb-wear-reinforced-stitched-riding-gloves',
  'sdb-wear-classic-driving-gloves',
  'sdb-wear-perforated-driving-gloves',
  'sdb-wear-stitched-work-gloves',
  'sdb-wear-reinforced-work-gloves',
  'sdb-wear-fashion-stitch-gloves',
  'sdb-wear-mechanic-stitched-gloves',
  'sdb-wear-tactical-style-stitched-gloves',
  'sdb-wear-custom-stitched-gloves'
)
on conflict (sku)
do update set
  product_id = excluded.product_id,
  name = excluded.name,
  price_usd_cents = excluded.price_usd_cents,
  price_pkr_paisa = excluded.price_pkr_paisa,
  stock_quantity = excluded.stock_quantity,
  is_active = true;


-- =====================================================================
-- 14. PRODUCT VARIANTS — EU SHOE SIZES
-- =====================================================================

insert into public.product_variants (
  product_id,
  name,
  sku,
  price_usd_cents,
  price_pkr_paisa,
  stock_quantity,
  is_active
)
select
  p.id,
  s.name,
  p.slug || '-' || s.code,
  p.price_usd_cents,
  p.price_pkr_paisa,
  s.stock,
  true
from public.products p
cross join (
  values
    ('EU 40', 'eu40', 6),
    ('EU 42', 'eu42', 10),
    ('EU 44', 'eu44', 10),
    ('EU 46', 'eu46', 7)
) as s(name, code, stock)
where p.slug in (
  'sdb-wear-motorcycle-riding-shoes',
  'sdb-wear-premium-moto-boots',
  'sdb-wear-urban-motorcycle-shoes',
  'sdb-wear-leather-riding-boots'
)
on conflict (sku)
do update set
  product_id = excluded.product_id,
  name = excluded.name,
  price_usd_cents = excluded.price_usd_cents,
  price_pkr_paisa = excluded.price_pkr_paisa,
  stock_quantity = excluded.stock_quantity,
  is_active = true;


-- =====================================================================
-- 15. ENSURE NO SEEDED RATINGS / REVIEWS
-- =====================================================================

update public.products
set
  rating = null,
  review_count = null
where brand = 'SDB WEAR';


-- =====================================================================
-- 16. FINAL SAFETY CHECKS
-- =====================================================================

update public.products
set is_active = true
where brand = 'SDB WEAR';


update public.categories
set is_active = true
where slug in (
  'motorbike-gear',
  'moto-suits',
  'moto-gloves',
  'moto-shoes',

  'leather-jackets-biker-fashion',
  'biker-leather-jackets',
  'casual-leather-jackets',
  'heritage-leather',
  'racing-inspired-jackets',
  'biker-fashion',

  'handcrafted-gloves',
  'leather-gloves',
  'riding-gloves',
  'driving-gloves',
  'work-gloves',
  'fashion-gloves',
  'mechanic-gloves',
  'tactical-gloves',
  'custom-gloves'
);


commit;
