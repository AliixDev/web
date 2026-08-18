-- =====================================================================
-- SDB WEAR — Brand + Catalog Redesign
-- =====================================================================
-- 1. Adds product SEO columns (seo_title, seo_description, seo_keywords).
-- 2. Deactivates the previous customer-facing catalog completely:
--      * legacy demo categories (apparel, home-living, electronics)
--      * the 2026 SDBBUY catalog (leather-jackets, fashion-apparel,
--        boxing, gym-fitness, accessories)
--      * the motorbike marketplace category and its ten subcategories
--    Rows referenced by historical orders stay in the database (order
--    history is preserved) but are invisible everywhere customer-facing.
-- 3. Builds the new SDB WEAR storefront catalog:
--      * Motorbike Gear  — Moto Suits, Moto Gloves, Moto Shoes
--      * Leather Jackets & Biker Fashion — Biker / Casual / Heritage /
--        Racing-Inspired / Biker Fashion
--      * Handcrafted Gloves — Leather / Riding / Driving / Work /
--        Fashion / Mechanic / Tactical / Custom
--    Every product is branded SDB WEAR, uses elegant branded SVG
--    placeholders (no fake product photography), and carries SEO
--    metadata. Prices follow the brand rule: only Handcrafted Gloves
--    may sit below $100; every other category is premium-priced.
--    No ratings or review counts are seeded — review numbers must
--    come from real customers.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Product SEO columns (additive, nullable)
-- ---------------------------------------------------------------------
alter table public.products
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_keywords text;

-- ---------------------------------------------------------------------
-- 2. Retire the previous catalog
-- ---------------------------------------------------------------------
update public.categories
set is_active = false
where slug in (
  -- legacy demo
  'apparel', 'home-living', 'electronics',
  -- 2026 SDBBUY catalog
  'leather-jackets', 'fashion-apparel', 'boxing', 'gym-fitness', 'accessories',
  -- motorbike marketplace category + subcategories
  'motorbikes', 'motorbike-gloves', 'motorbike-jackets', 'moto-suits', 'helmets',
  'motorbike-boots', 'motorbike-pants', 'protective-gear', 'riding-gear',
  'motorcycle-accessories', 'other-motorbike-gear'
);

update public.products p
set is_active = false
where p.category_id in (
  select id from public.categories c where c.slug in (
    'apparel', 'home-living', 'electronics',
    'leather-jackets', 'fashion-apparel', 'boxing', 'gym-fitness', 'accessories',
    'motorbikes', 'motorbike-gloves', 'motorbike-jackets', 'moto-suits', 'helmets',
    'motorbike-boots', 'motorbike-pants', 'protective-gear', 'riding-gear',
    'motorcycle-accessories', 'other-motorbike-gear'
  )
);

-- Physically remove retired rows that no order history references so the
-- old catalog does not linger in the database. Anything referenced by a
-- past order stays (inactive) to preserve order history — order_items
-- keeps product names denormalized. Deletes are scoped strictly to the
-- retired categories so seller-created rows in other categories are
-- never touched.
delete from public.product_variants pv
using public.products p
join public.categories c on c.id = p.category_id and c.slug in (
  'apparel', 'home-living', 'electronics',
  'leather-jackets', 'fashion-apparel', 'boxing', 'gym-fitness', 'accessories',
  'motorbikes', 'motorbike-gloves', 'motorbike-jackets', 'moto-suits', 'helmets',
  'motorbike-boots', 'motorbike-pants', 'protective-gear', 'riding-gear',
  'motorcycle-accessories', 'other-motorbike-gear'
)
where pv.product_id = p.id
  and not exists (select 1 from public.order_items oi where oi.variant_id = pv.id);

delete from public.products p
using public.categories c
where c.id = p.category_id and c.slug in (
  'apparel', 'home-living', 'electronics',
  'leather-jackets', 'fashion-apparel', 'boxing', 'gym-fitness', 'accessories',
  'motorbikes', 'motorbike-gloves', 'motorbike-jackets', 'moto-suits', 'helmets',
  'motorbike-boots', 'motorbike-pants', 'protective-gear', 'riding-gear',
  'motorcycle-accessories', 'other-motorbike-gear'
)
  and not exists (select 1 from public.order_items oi where oi.product_id = p.id);

delete from public.categories c
where c.slug in (
  'apparel', 'home-living', 'electronics',
  'leather-jackets', 'fashion-apparel', 'boxing', 'gym-fitness', 'accessories',
  'motorbikes', 'motorbike-gloves', 'motorbike-jackets', 'moto-suits', 'helmets',
  'motorbike-boots', 'motorbike-pants', 'protective-gear', 'riding-gear',
  'motorcycle-accessories', 'other-motorbike-gear'
)
  and not exists (select 1 from public.products p where p.category_id = c.id);

-- ---------------------------------------------------------------------
-- 3. New SDB WEAR category tree
-- ---------------------------------------------------------------------
insert into public.categories (name, slug, parent_id, is_active)
values
  ('Motorbike Gear',                 'motorbike-gear',                 null, true),
  ('Leather Jackets & Biker Fashion','leather-jackets-biker-fashion',  null, true),
  ('Handcrafted Gloves',             'handcrafted-gloves',             null, true)
on conflict (slug) do update
  set name = excluded.name, parent_id = excluded.parent_id, is_active = true;

insert into public.categories (name, slug, parent_id, is_active)
select v.name, v.slug, p.id, true
from (values
  -- Motorbike Gear
  ('Moto Suits',              'moto-suits',             'motorbike-gear'),
  ('Moto Gloves',             'moto-gloves',            'motorbike-gear'),
  ('Moto Shoes',              'moto-shoes',             'motorbike-gear'),
  -- Leather Jackets & Biker Fashion
  ('Biker Leather Jackets',   'biker-leather-jackets',  'leather-jackets-biker-fashion'),
  ('Casual Leather Jackets',  'casual-leather-jackets', 'leather-jackets-biker-fashion'),
  ('Heritage Leather',        'heritage-leather',       'leather-jackets-biker-fashion'),
  ('Racing-Inspired Jackets', 'racing-inspired-jackets','leather-jackets-biker-fashion'),
  ('Biker Fashion',           'biker-fashion',          'leather-jackets-biker-fashion'),
  -- Handcrafted Gloves
  ('Leather Gloves',          'leather-gloves',         'handcrafted-gloves'),
  ('Riding Gloves',           'riding-gloves',          'handcrafted-gloves'),
  ('Driving Gloves',          'driving-gloves',         'handcrafted-gloves'),
  ('Work Gloves',             'work-gloves',            'handcrafted-gloves'),
  ('Fashion Gloves',          'fashion-gloves',         'handcrafted-gloves'),
  ('Mechanic Gloves',         'mechanic-gloves',        'handcrafted-gloves'),
  ('Tactical Gloves',         'tactical-gloves',        'handcrafted-gloves'),
  ('Custom Gloves',           'custom-gloves',          'handcrafted-gloves')
) as v(name, slug, parent_slug)
join public.categories p on p.slug = v.parent_slug
on conflict (slug) do update
  set name = excluded.name, parent_id = excluded.parent_id, is_active = true;

-- ---------------------------------------------------------------------
-- 4. Products — Motorbike Gear (Moto Suits, Moto Gloves, Moto Shoes)
-- ---------------------------------------------------------------------
insert into public.products (
  category_id, slug, name, seo_title, seo_description, description,
  image_url, images, brand, price_usd_cents, price_pkr_paisa,
  compare_at_price_usd_cents, compare_at_price_pkr_paisa, stock_quantity
)
select
  c.id, v.slug, v.name, v.seo_title, v.seo_description, v.description,
  v.image_url, v.images::jsonb, v.brand, v.usd, v.pkr, v.compare_usd, v.compare_pkr, v.stock
from (values
  -- Moto Suits
  ('moto-suits', 'sdb-wear-1-piece-leather-racing-suit', 'SDB WEAR 1-Piece Leather Racing Suit',
   'SDB WEAR 1-Piece Leather Racing Suit',
   'One-piece leather racing suit from SDB WEAR — pre-curved limbs, knee pucks, stretch panels, and a secure closure for track days.',
   'A full one-piece leather suit built for track days. Pre-curved limbs hold the riding position, replaceable knee pucks protect at the pegs, and stretch panels at the shoulders and hips keep mo[...]',
   '/placeholders/moto-suit.svg',
   '["/placeholders/moto-suit.svg","/placeholders/moto-suit-detail.svg","/placeholders/moto-suit-side.svg"]',
   'SDB WEAR', 44900, 12572000, null, null, 10),
  ('moto-suits', 'sdb-wear-2-piece-motorcycle-leather-suit', 'SDB WEAR 2-Piece Motorcycle Leather Suit',
   'SDB WEAR 2-Piece Motorcycle Leather Suit',
   'Two-piece motorcycle leather suit from SDB WEAR — sport jacket with matching pants, connection zip, and reinforced knee panels.',
   'A zippered two-piece leather suit pairing a sport jacket with matching pants. Full-circumference connection zip, adjustable cuff and waist closures, and reinforced knee panels for weekend rid[...]',
   '/placeholders/moto-suit.svg',
   '["/placeholders/moto-suit.svg","/placeholders/moto-suit-side.svg","/placeholders/moto-suit-detail.svg"]',
   'SDB WEAR', 37900, 10612000, null, null, 12),
  ('moto-suits', 'sdb-wear-premium-track-racing-suit', 'SDB WEAR Premium Track Racing Suit',
   'SDB WEAR Premium Track Racing Suit',
   'Premium track racing suit from SDB WEAR — one-piece race cut, hard knee sliders, perforation zones, and a removable liner.',
   'The premium track suit: a one-piece racing cut with multi-panel leather construction, hard knee sliders, and generous perforation zones for airflow. Removable liner, ergonomic stretch gussets[...]',
   '/placeholders/moto-suit.svg',
   '["/placeholders/moto-suit.svg","/placeholders/moto-suit-detail.svg","/placeholders/moto-suit-side.svg"]',
   'SDB WEAR', 49900, 13972000, 54900, 15372000, 8),
  ('moto-suits', 'sdb-wear-professional-protection-suit', 'SDB WEAR Professional Protection Suit',
   'SDB WEAR Professional Protection Suit',
   'Professional protection suit from SDB WEAR for sport riding — structured leather, armor pockets, and ventilation zips.',
   'A professional-grade protection suit for sport riding and training. Structured leather panels, integrated armor pockets, ventilation zips, and pre-curved sleeves — protection that moves wit[...]',
   '/placeholders/moto-suit.svg',
   '["/placeholders/moto-suit.svg","/placeholders/moto-suit-side.svg","/placeholders/moto-suit-detail.svg"]',
   'SDB WEAR', 39900, 11172000, null, null, 14),

  -- Moto Gloves
  ('moto-gloves', 'sdb-wear-full-finger-racing-gloves', 'SDB WEAR Full-Finger Racing Gloves',
   'SDB WEAR Full-Finger Racing Gloves',
   'Full-finger racing gloves from SDB WEAR — padded knuckle, pre-curved fingers, double-layer palm, and vented backhand.',
   'Full-finger racing gloves with a padded knuckle panel, pre-curved fingers, and a double-layer palm. Perforated backhand vents heat, and the hook-and-loop cuff locks the fit for hard braking.[...]',
   '/placeholders/moto-glove.svg',
   '["/placeholders/moto-glove.svg","/placeholders/moto-glove-detail.svg","/placeholders/moto-glove-side.svg"]',
   'SDB WEAR', 11900, 3332000, null, null, 40),
  ('moto-gloves', 'sdb-wear-short-cuff-riding-gloves', 'SDB WEAR Short-Cuff Riding Gloves',
   'SDB WEAR Short-Cuff Riding Gloves',
   'Short-cuff riding gloves from SDB WEAR — pre-curved fingers, reinforced palm, breathable mesh backhand, touchscreen tips.',
   'Short-cuff riding gloves for everyday rides. Pre-curved fingers, reinforced palm, and a breathable mesh backhand. Touchscreen fingertips keep navigation within reach.',
   '/placeholders/moto-glove.svg',
   '["/placeholders/moto-glove.svg","/placeholders/moto-glove-side.svg","/placeholders/moto-glove-detail.svg"]',
   'SDB WEAR', 10900, 3052000, null, null, 45),
  ('moto-gloves', 'sdb-wear-long-cuff-racing-gloves', 'SDB WEAR Long-Cuff Racing Gloves',
   'SDB WEAR Long-Cuff Racing Gloves',
   'Long-cuff racing gloves from SDB WEAR — hard knuckle shell, finger sliders, double-layer palm, and gauntlet cuff.',
   'Long-cuff racing gloves with a hard knuckle shell, finger sliders, and a double-layer palm. The extended gauntlet secures over the jacket cuff, and accordion panels allow full grip range.',
   '/placeholders/moto-glove.svg',
   '["/placeholders/moto-glove.svg","/placeholders/moto-glove-detail.svg","/placeholders/moto-glove-side.svg"]',
   'SDB WEAR', 13900, 3892000, 15900, 4452000, 30),
  ('moto-gloves', 'sdb-wear-touring-motorcycle-gloves', 'SDB WEAR Touring Motorcycle Gloves',
   'SDB WEAR Touring Motorcycle Gloves',
   'Touring motorcycle gloves from SDB WEAR — waterproof membrane, thermal lining, visor wipe, and touchscreen fingertips.',
   'Touring gloves built for long days in the saddle. A waterproof membrane keeps rain out, the thermal lining adds warmth, and the visor wipe and touchscreen fingertips handle practical stops.',
   '/placeholders/moto-glove.svg',
   '["/placeholders/moto-glove.svg","/placeholders/moto-glove-side.svg","/placeholders/moto-glove-detail.svg"]',
   'SDB WEAR', 12900, 3612000, 14900, 4172000, 35),
  ('moto-gloves', 'sdb-wear-premium-leather-moto-gloves', 'SDB WEAR Premium Leather Moto Gloves',
   'SDB WEAR Premium Leather Moto Gloves',
   'Premium leather moto gloves from SDB WEAR — supple hide, reinforced palm, padded knuckle, and double closure.',
   'Premium leather moto gloves with a supple hide shell, reinforced palm, and padded knuckle. Perforated panels manage heat while the double closure — strap plus cuff — holds a precise fit.[...]',
   '/placeholders/moto-glove.svg',
   '["/placeholders/moto-glove.svg","/placeholders/moto-glove-detail.svg","/placeholders/moto-glove-side.svg"]',
   'SDB WEAR', 15900, 4452000, null, null, 25),

  -- Moto Shoes
  ('moto-shoes', 'sdb-wear-motorcycle-riding-shoes', 'SDB WEAR Motorcycle Riding Shoes',
   'SDB WEAR Motorcycle Riding Shoes',
   'Motorcycle riding shoes from SDB WEAR — reinforced toe and heel, oil-resistant sole, waterproof membrane, lace-and-zip closure.',
   'Ankle-height riding shoes that look right off the bike. Reinforced toe and heel counters, oil-resistant soles, and a waterproof membrane. Lace-and-zip closure secures in seconds.',
   '/placeholders/moto-shoe.svg',
   '["/placeholders/moto-shoe.svg","/placeholders/moto-shoe-side.svg","/placeholders/moto-shoe-detail.svg"]',
   'SDB WEAR', 12900, 3612000, null, null, 35),
  ('moto-shoes', 'sdb-wear-premium-moto-boots', 'SDB WEAR Premium Moto Boots',
   'SDB WEAR Premium Moto Boots',
   'Premium moto boots from SDB WEAR — full-length zip, reinforced ankle, rigid heel and toe, cushioned insole.',
   'Premium moto boots with a full-length zip, reinforced ankle support, and a cushioned insole. The rigid heel and toe protect the foot while the padded shaft keeps long rides comfortable.',
   '/placeholders/moto-shoe.svg',
   '["/placeholders/moto-shoe.svg","/placeholders/moto-shoe-detail.svg","/placeholders/moto-shoe-side.svg"]',
   'SDB WEAR', 17900, 5012000, null, null, 25),
  ('moto-shoes', 'sdb-wear-urban-motorcycle-shoes', 'SDB WEAR Urban Motorcycle Shoes',
   'SDB WEAR Urban Motorcycle Shoes',
   'Urban motorcycle shoes from SDB WEAR — low-profile silhouette, reinforced toe box, grippy commuter sole, waterproof lining.',
   'Urban riding shoes with a low-profile silhouette, reinforced toe box, and grippy commuter sole. A hidden waterproof membrane and breathable lining suit daily city riding.',
   '/placeholders/moto-shoe.svg',
   '["/placeholders/moto-shoe.svg","/placeholders/moto-shoe-side.svg","/placeholders/moto-shoe-detail.svg"]',
   'SDB WEAR', 10900, 3052000, null, null, 40),
  ('moto-shoes', 'sdb-wear-leather-riding-boots', 'SDB WEAR Leather Riding Boots',
   'SDB WEAR Leather Riding Boots',
   'Leather riding boots from SDB WEAR — classic profile, reinforced ankle, oil-resistant sole, waterproof membrane, side zip.',
   'Leather riding boots with a classic profile and modern protection. Reinforced ankle, oil-resistant sole, and a waterproof membrane. Lace front with a side zip for easy entry.',
   '/placeholders/moto-shoe.svg',
   '["/placeholders/moto-shoe.svg","/placeholders/moto-shoe-detail.svg","/placeholders/moto-shoe-side.svg"]',
   'SDB WEAR', 14900, 4172000, 16900, 4732000, 28)
) as v(
  cat, slug, name, seo_title, seo_description, description,
  image_url, images, brand, usd, pkr, compare_usd, compare_pkr, stock
)
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 4b. Products — Leather Jackets & Biker Fashion
-- ---------------------------------------------------------------------
insert into public.products (
  category_id, slug, name, seo_title, seo_description, description,
  image_url, images, brand, price_usd_cents, price_pkr_paisa,
  compare_at_price_usd_cents, compare_at_price_pkr_paisa, stock_quantity
)
select
  c.id, v.slug, v.name, v.seo_title, v.seo_description, v.description,
  v.image_url, v.images::jsonb, v.brand, v.usd, v.pkr, v.compare_usd, v.compare_pkr, v.stock
from (values
  -- Biker Leather Jackets
  ('biker-leather-jackets', 'sdb-wear-classic-black-biker-leather-jacket', 'SDB WEAR Classic Black Biker Leather Jacket',
   'SDB WEAR Classic Black Biker Leather Jacket',
   'Classic black biker leather jacket from SDB WEAR — full-grain leather, asymmetric zip, quilted shoulders, four pockets.',
   'The classic black biker jacket: full-grain leather, asymmetric zip, quilted shoulder panels, and four pockets. Ribbed cuffs and hem hold the fit; the structured silhouette ages into its own.[...]',
   '/placeholders/leather-jacket.svg',
   '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-side.svg","/placeholders/leather-jacket-detail.svg"]',
   'SDB WEAR', 22900, 6412000, null, null, 25),
  ('biker-leather-jackets', 'sdb-wear-premium-motorcycle-leather-jacket', 'SDB WEAR Premium Motorcycle Leather Jacket',
   'SDB WEAR Premium Motorcycle Leather Jacket',
   'Premium motorcycle leather jacket from SDB WEAR — riding-oriented cut, pre-curved sleeves, removable thermal liner.',
   'A premium motorcycle leather jacket with a riding-oriented cut. Pre-curved sleeves, removable thermal liner, adjustable waist, and armor-ready pockets. Built for the road and made to last.',
   '/placeholders/leather-jacket.svg',
   '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-detail.svg","/placeholders/leather-jacket-side.svg"]',
   'SDB WEAR', 29900, 8372000, 32900, 9212000, 20),
  ('biker-leather-jackets', 'sdb-wear-urban-biker-leather-jacket', 'SDB WEAR Urban Biker Leather Jacket',
   'SDB WEAR Urban Biker Leather Jacket',
   'Urban biker leather jacket from SDB WEAR — streamlined profile, smooth leather, minimal hardware, clean zip front.',
   'An urban biker jacket with a streamlined profile. Smooth leather, minimal hardware, and a clean zip front. Two exterior and two interior pockets keep daily essentials close.',
   '/placeholders/leather-jacket.svg',
   '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-side.svg","/placeholders/leather-jacket-detail.svg"]',
   'SDB WEAR', 19900, 5572000, null, null, 30),

  -- Casual Leather Jackets
  ('casual-leather-jackets', 'sdb-wear-minimal-black-leather-jacket', 'SDB WEAR Minimal Black Leather Jacket',
   'SDB WEAR Minimal Black Leather Jacket',
   'Minimal black leather jacket from SDB WEAR — no visible branding, clean zip front, understated hardware, relaxed fit.',
   'A minimal black leather jacket with no visible branding. Clean zip front, understated hardware, and a relaxed fit that layers over anything. Leather that earns its place in a rotation.',
   '/placeholders/leather-jacket.svg',
   '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-detail.svg","/placeholders/leather-jacket-side.svg"]',
   'SDB WEAR', 17900, 5012000, null, null, 30),
  ('casual-leather-jackets', 'sdb-wear-premium-casual-leather-jacket', 'SDB WEAR Premium Casual Leather Jacket',
   'SDB WEAR Premium Casual Leather Jacket',
   'Premium casual leather jacket from SDB WEAR — soft hand feel, tailored cut, stand collar, hidden placket.',
   'A premium casual leather jacket with a soft hand feel and a tailored cut. Stand collar, hidden placket, and functional pockets. Detail is in the stitching and the fit.',
   '/placeholders/leather-jacket.svg',
   '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-side.svg","/placeholders/leather-jacket-detail.svg"]',
   'SDB WEAR', 19900, 5572000, null, null, 26),
  ('casual-leather-jackets', 'sdb-wear-relaxed-everyday-leather-jacket', 'SDB WEAR Relaxed Everyday Leather Jacket',
   'SDB WEAR Relaxed Everyday Leather Jacket',
   'Relaxed everyday leather jacket from SDB WEAR — softer drape, roomier cut, full-zip front, ribbed collar and cuffs.',
   'A relaxed everyday leather jacket with a softer drape and roomier cut. Full-zip front, ribbed collar and cuffs, and a smooth lining. Easy to wear, easy to reach for.',
   '/placeholders/leather-jacket.svg',
   '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-detail.svg","/placeholders/leather-jacket-side.svg"]',
   'SDB WEAR', 16900, 4732000, null, null, 32),

  -- Heritage Leather
  ('heritage-leather', 'sdb-wear-heritage-rider-jacket', 'SDB WEAR Heritage Rider Jacket',
   'SDB WEAR Heritage Rider Jacket',
   'Heritage rider jacket from SDB WEAR — full-grain leather, racing silhouette, snap collar, quilted lining.',
   'A heritage rider jacket cut from full-grain leather with a classic racing silhouette. Snap collar, zip front, quilted lining, and four exterior pockets. Sharp, tailored, and built to age well[...]',
   '/placeholders/leather-jacket.svg',
   '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-side.svg","/placeholders/leather-jacket-detail.svg"]',
   'SDB WEAR', 24900, 6972000, 27900, 7812000, 18),
  ('heritage-leather', 'sdb-wear-heritage-leather-riding-jacket', 'SDB WEAR Heritage Leather Riding Jacket',
   'SDB WEAR Heritage Leather Riding Jacket',
   'Heritage leather riding jacket from SDB WEAR — cafe-racer profile, clean chest panel, pre-curved sleeves.',
   'A heritage leather riding jacket with a timeless cafe-racer profile. Clean chest panel, secure zip front, and pre-curved sleeves. Reinforced stitching throughout for years of wear.',
   '/placeholders/leather-jacket.svg',
   '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-detail.svg","/placeholders/leather-jacket-side.svg"]',
   'SDB WEAR', 21900, 6132000, null, null, 22),

  -- Racing-Inspired Jackets
  ('racing-inspired-jackets', 'sdb-wear-vintage-racing-leather-jacket', 'SDB WEAR Vintage Racing Leather Jacket',
   'SDB WEAR Vintage Racing Leather Jacket',
   'Vintage racing leather jacket from SDB WEAR — period-inspired panels, contrast stitching, zip sleeves, modern fit.',
   'A vintage racing leather jacket with period-inspired panels and a modern fit. Contrast stitching, zip sleeves, and a tapered waist. Racing heritage without the track-day price.',
   '/placeholders/leather-jacket.svg',
   '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-side.svg","/placeholders/leather-jacket-detail.svg"]',
   'SDB WEAR', 25900, 7252000, null, null, 15),
  ('racing-inspired-jackets', 'sdb-wear-racing-inspired-leather-jacket', 'SDB WEAR Racing-Inspired Leather Jacket',
   'SDB WEAR Racing-Inspired Leather Jacket',
   'Racing-inspired leather jacket from SDB WEAR — aerodynamic paneling, perforated zones, structured shoulders.',
   'A racing-inspired leather jacket with aerodynamic paneling, perforated ventilation zones, and a secure zip front. Structured shoulders and a close cut for a sharp silhouette.',
   '/placeholders/leather-jacket.svg',
   '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-detail.svg","/placeholders/leather-jacket-side.svg"]',
   'SDB WEAR', 23900, 6692000, null, null, 20),

  -- Biker Fashion
  ('biker-fashion', 'sdb-wear-leather-biker-vest', 'SDB WEAR Leather Biker Vest',
   'SDB WEAR Leather Biker Vest',
   'Leather biker vest from SDB WEAR — full-grain hide, zip front, four pockets, clean stitching.',
   'A leather biker vest cut from full-grain hide with a zip front and four pockets. Clean stitching and a straight hem. Layers over a tee or a hoodie for the classic biker look.',
   '/placeholders/leather-jacket.svg',
   '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-detail.svg","/placeholders/leather-jacket-side.svg"]',
   'SDB WEAR', 14900, 4172000, null, null, 35),
  ('biker-fashion', 'sdb-wear-biker-fashion-leather-jacket', 'SDB WEAR Biker Fashion Leather Jacket',
   'SDB WEAR Biker Fashion Leather Jacket',
   'Biker fashion leather jacket from SDB WEAR — tailored waist, asymmetric zip, quilted accents.',
   'A biker-fashion leather jacket with a tailored waist, asymmetric zip, and quilted accents. Fashion-forward cut with the same full-grain construction as the rest of the line.',
   '/placeholders/leather-jacket.svg',
   '["/placeholders/leather-jacket.svg","/placeholders/leather-jacket-side.svg","/placeholders/leather-jacket-detail.svg"]',
   'SDB WEAR', 17900, 5012000, null, null, 28)
) as v(
  cat, slug, name, seo_title, seo_description, description,
  image_url, images, brand, usd, pkr, compare_usd, compare_pkr, stock
)
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 4c. Products — Handcrafted Gloves (only category priced below $100)
-- ---------------------------------------------------------------------
insert into public.products (
  category_id, slug, name, seo_title, seo_description, description,
  image_url, images, brand, price_usd_cents, price_pkr_paisa,
  compare_at_price_usd_cents, compare_at_price_pkr_paisa, stock_quantity
)
select
  c.id, v.slug, v.name, v.seo_title, v.seo_description, v.description,
  v.image_url, v.images::jsonb, v.brand, v.usd, v.pkr, v.compare_usd, v.compare_pkr, v.stock
from (values
  -- Leather Gloves
  ('leather-gloves', 'sdb-wear-stitched-leather-gloves', 'SDB WEAR Stitched Leather Gloves',
   'SDB WEAR Stitched Leather Gloves',
   'Stitched leather gloves from SDB WEAR — full-grain hide, reinforced stitching, snap closure, everyday fit.',
   'Stitched leather gloves with a clean, tailored silhouette. Full-grain hide, reinforced stitching, and a secure snap closure. An everyday glove with workshop-built construction.',
   '/placeholders/gloves.svg',
   '["/placeholders/gloves.svg","/placeholders/gloves-detail.svg","/placeholders/gloves-side.svg"]',
   'SDB WEAR', 7900, 2212000, null, null, 60),
  ('leather-gloves', 'sdb-wear-premium-handcrafted-leather-gloves', 'SDB WEAR Premium Handcrafted Leather Gloves',
   'SDB WEAR Premium Handcrafted Leather Gloves',
   'Premium handcrafted leather gloves from SDB WEAR — soft lined interior, precise stitching, perforated knuckles.',
   'Premium stitched leather gloves with a soft lined interior and precise stitching. Perforated knuckles for flexibility and a classic cut that works on the road and off it.',
   '/placeholders/gloves.svg',
   '["/placeholders/gloves.svg","/placeholders/gloves-side.svg","/placeholders/gloves-detail.svg"]',
   'SDB WEAR', 9900, 2772000, null, null, 45),

  -- Riding Gloves
  ('riding-gloves', 'sdb-wear-stitched-riding-gloves', 'SDB WEAR Stitched Riding Gloves',
   'SDB WEAR Stitched Riding Gloves',
   'Stitched riding gloves from SDB WEAR — reinforced palm, padded knuckle, pre-curved fingers, secure cuff.',
   'Stitched riding gloves with a reinforced palm and padded knuckle panel. Pre-curved fingers and a secure cuff. Built for the hand that holds the bars.',
   '/placeholders/gloves.svg',
   '["/placeholders/gloves.svg","/placeholders/gloves-detail.svg","/placeholders/gloves-side.svg"]',
   'SDB WEAR', 6900, 1932000, null, null, 70),
  ('riding-gloves', 'sdb-wear-reinforced-stitched-riding-gloves', 'SDB WEAR Reinforced Stitched Riding Gloves',
   'SDB WEAR Reinforced Stitched Riding Gloves',
   'Reinforced stitched riding gloves from SDB WEAR — double-layer palm, padded knuckle, touchscreen fingertips.',
   'Reinforced stitched riding gloves with a double-layer palm and padded knuckle. Touchscreen fingertips and a hook-and-loop cuff. Protection with a stitched, crafted feel.',
   '/placeholders/gloves.svg',
   '["/placeholders/gloves.svg","/placeholders/gloves-side.svg","/placeholders/gloves-detail.svg"]',
   'SDB WEAR', 8900, 2492000, null, null, 55),

  -- Driving Gloves
  ('driving-gloves', 'sdb-wear-classic-driving-gloves', 'SDB WEAR Classic Driving Gloves',
   'SDB WEAR Classic Driving Gloves',
   'Classic driving gloves from SDB WEAR — timeless cut, ventilated backhand, slip-on fit with wrist snap.',
   'Classic stitched driving gloves with a timeless cut and ventilated backhand. Slip-on fit with a wrist snap. Crafted construction for the purist.',
   '/placeholders/gloves.svg',
   '["/placeholders/gloves.svg","/placeholders/gloves-detail.svg","/placeholders/gloves-side.svg"]',
   'SDB WEAR', 5900, 1652000, null, null, 80),
  ('driving-gloves', 'sdb-wear-perforated-driving-gloves', 'SDB WEAR Perforated Driving Gloves',
   'SDB WEAR Perforated Driving Gloves',
   'Perforated driving gloves from SDB WEAR — breathable construction, supple leather, reinforced seams.',
   'Perforated stitched driving gloves that breathe. Supple leather, reinforced seams, and a close fit that keeps the wheel in hand.',
   '/placeholders/gloves.svg',
   '["/placeholders/gloves.svg","/placeholders/gloves-side.svg","/placeholders/gloves-detail.svg"]',
   'SDB WEAR', 6900, 1932000, null, null, 75),

  -- Work Gloves
  ('work-gloves', 'sdb-wear-stitched-work-gloves', 'SDB WEAR Stitched Work Gloves',
   'SDB WEAR Stitched Work Gloves',
   'Stitched work gloves from SDB WEAR — tough leather palm, reinforced fingertips, elasticated wrist.',
   'Stitched work gloves with a tough leather palm and reinforced fingertips. Elasticated wrist and a practical cut for everyday tasks.',
   '/placeholders/gloves.svg',
   '["/placeholders/gloves.svg","/placeholders/gloves-detail.svg","/placeholders/gloves-side.svg"]',
   'SDB WEAR', 3900, 1092000, null, null, 120),
  ('work-gloves', 'sdb-wear-reinforced-work-gloves', 'SDB WEAR Reinforced Work Gloves',
   'SDB WEAR Reinforced Work Gloves',
   'Reinforced work gloves from SDB WEAR — double-layer palm, padded knuckle, reinforced thumb.',
   'Reinforced stitched work gloves with a double-layer palm, padded knuckle, and reinforced thumb. Durable construction for the workshop.',
   '/placeholders/gloves.svg',
   '["/placeholders/gloves.svg","/placeholders/gloves-side.svg","/placeholders/gloves-detail.svg"]',
   'SDB WEAR', 4900, 1372000, null, null, 100),

  -- Fashion Gloves
  ('fashion-gloves', 'sdb-wear-fashion-stitch-gloves', 'SDB WEAR Fashion Stitch Gloves',
   'SDB WEAR Fashion Stitch Gloves',
   'Fashion stitch gloves from SDB WEAR — slim profile, soft leather, precise stitching, secure snap.',
   'Fashion stitched gloves with a slim profile and clean lines. Soft leather, precise stitching, and a secure snap. Designed to be seen.',
   '/placeholders/gloves.svg',
   '["/placeholders/gloves.svg","/placeholders/gloves-detail.svg","/placeholders/gloves-side.svg"]',
   'SDB WEAR', 5900, 1652000, null, null, 65),

  -- Mechanic Gloves
  ('mechanic-gloves', 'sdb-wear-mechanic-stitched-gloves', 'SDB WEAR Mechanic Stitched Gloves',
   'SDB WEAR Mechanic Stitched Gloves',
   'Mechanic stitched gloves from SDB WEAR — grippy palm, reinforced seams, snug fit, touchscreen tips.',
   'Stitched mechanic gloves with a grippy palm, reinforced seams, and a snug fit. Touchscreen fingertips keep tools and phones within reach.',
   '/placeholders/gloves.svg',
   '["/placeholders/gloves.svg","/placeholders/gloves-detail.svg","/placeholders/gloves-side.svg"]',
   'SDB WEAR', 4500, 1260000, null, null, 90),

  -- Tactical Gloves
  ('tactical-gloves', 'sdb-wear-tactical-style-stitched-gloves', 'SDB WEAR Tactical-Style Stitched Gloves',
   'SDB WEAR Tactical-Style Stitched Gloves',
   'Tactical-style stitched gloves from SDB WEAR — reinforced palm, padded knuckle, adjustable strap.',
   'Tactical-style stitched gloves with a reinforced palm, padded knuckle, and adjustable strap. Rugged construction with a precise, tailored feel.',
   '/placeholders/gloves.svg',
   '["/placeholders/gloves.svg","/placeholders/gloves-side.svg","/placeholders/gloves-detail.svg"]',
   'SDB WEAR', 7900, 2212000, null, null, 50),

  -- Custom Gloves
  ('custom-gloves', 'sdb-wear-custom-stitched-gloves', 'SDB WEAR Custom Stitched Gloves',
   'SDB WEAR Custom Stitched Gloves',
   'Custom stitched gloves from SDB WEAR — made to your measurements, choose leather and stitching.',
   'Custom stitched gloves made to your measurements. Choose the leather, the stitching, and the fit — workshop-built around your hand.',
   '/placeholders/gloves.svg',
   '["/placeholders/gloves.svg","/placeholders/gloves-detail.svg","/placeholders/gloves-side.svg"]',
   'SDB WEAR', 11900, 3332000, null, null, 20)
) as v(
  cat, slug, name, seo_title, seo_description, description,
  image_url, images, brand, usd, pkr, compare_usd, compare_pkr, stock
)
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 5. Product variants
--
-- Apparel, moto gloves, and handcrafted gloves use alpha sizes; moto
-- shoes use EU sizes. SKUs are derived from the product slug + size so
-- every variant has a unique internal SKU. SKUs are never shown on the
-- customer-facing site.
-- ---------------------------------------------------------------------
insert into public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
select p.id, s.name, p.slug || '-' || s.code, p.price_usd_cents, p.price_pkr_paisa, s.stock
from public.products p
join (values
  ('S','s',10), ('M','m',14), ('L','l',14), ('XL','xl',8)
) as s(name, code, stock) on true
where p.slug in (
  -- Moto Suits
  'sdb-wear-1-piece-leather-racing-suit',
  'sdb-wear-2-piece-motorcycle-leather-suit',
  'sdb-wear-premium-track-racing-suit',
  'sdb-wear-professional-protection-suit',
  -- Moto Gloves
  'sdb-wear-full-finger-racing-gloves',
  'sdb-wear-short-cuff-riding-gloves',
  'sdb-wear-long-cuff-racing-gloves',
  'sdb-wear-touring-motorcycle-gloves',
  'sdb-wear-premium-leather-moto-gloves',
  -- Biker Leather Jackets
  'sdb-wear-classic-black-biker-leather-jacket',
  'sdb-wear-premium-motorcycle-leather-jacket',
  'sdb-wear-urban-biker-leather-jacket',
  -- Casual Leather Jackets
  'sdb-wear-minimal-black-leather-jacket',
  'sdb-wear-premium-casual-leather-jacket',
  'sdb-wear-relaxed-everyday-leather-jacket',
  -- Heritage Leather
  'sdb-wear-heritage-rider-jacket',
  'sdb-wear-heritage-leather-riding-jacket',
  -- Racing-Inspired Jackets
  'sdb-wear-vintage-racing-leather-jacket',
  'sdb-wear-racing-inspired-leather-jacket',
  -- Biker Fashion
  'sdb-wear-leather-biker-vest',
  'sdb-wear-biker-fashion-leather-jacket',
  -- Handcrafted Gloves
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
on conflict (sku) do nothing;

insert into public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
select p.id, s.name, p.slug || '-' || s.code, p.price_usd_cents, p.price_pkr_paisa, s.stock
from public.products p
join (values
  ('EU 40','eu40',6), ('EU 42','eu42',10), ('EU 44','eu44',10), ('EU 46','eu46',7)
) as s(name, code, stock) on true
where p.slug in (
  'sdb-wear-motorcycle-riding-shoes',
  'sdb-wear-premium-moto-boots',
  'sdb-wear-urban-motorcycle-shoes',
  'sdb-wear-leather-riding-boots'
)
on conflict (sku) do nothing;
