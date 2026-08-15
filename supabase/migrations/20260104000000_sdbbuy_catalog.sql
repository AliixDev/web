-- =====================================================================
-- SDBBUY Product Catalog
-- Replaces demo seed data with professional leather, fashion, boxing,
-- gym, and accessories products.
-- =====================================================================

-- Deactivate old demo products
UPDATE public.products SET is_active = false WHERE slug IN (
  'embroidered-lawn-kurta', 'handwoven-multani-rug', 'wireless-earbuds-pro'
);

-- ---------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------
INSERT INTO public.categories (name, slug) VALUES
  ('Leather & Jackets', 'leather-jackets'),
  ('Fashion Apparel', 'fashion-apparel'),
  ('Boxing', 'boxing'),
  ('Gym & Fitness', 'gym-fitness'),
  ('Accessories', 'accessories')
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------
-- Products — Leather & Jackets
-- ---------------------------------------------------------------------
INSERT INTO public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT
  (SELECT id FROM public.categories WHERE slug = 'leather-jackets'),
  'premium-leather-biker-jacket',
  'SDBBUY Premium Leather Biker Jacket',
  'Built for everyday wear, the SDBBUY Premium Leather Biker Jacket combines a structured silhouette with practical storage and a classic racing-inspired profile. Genuine leather construction with a matte finish, asymmetric zip closure, and quilted shoulder panels. Multiple interior and exterior pockets. Ribbed cuffs and hem for a secure fit.',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
  24900,
  6970000,
  25
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT
  (SELECT id FROM public.categories WHERE slug = 'leather-jackets'),
  'classic-leather-bomber-jacket',
  'SDBBUY Classic Leather Bomber Jacket',
  'A timeless bomber silhouette reworked in genuine leather. The SDBBUY Classic Bomber features a zip front, ribbed collar, cuffs, and hem, and a clean lined interior. Two side pockets and one interior pocket. Relaxed fit designed for layering over hoodies and tees.',
  'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=800',
  21900,
  6130000,
  30
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT
  (SELECT id FROM public.categories WHERE slug = 'leather-jackets'),
  'heritage-leather-racing-jacket',
  'SDBBUY Heritage Leather Racing Jacket',
  'Inspired by classic racing silhouettes, the Heritage Racing Jacket pairs a structured leather shell with a streamlined cut. Features a snap-button collar, zip front, and quilted lining for warmth. Four exterior pockets and a clean chest panel. Designed for a sharp, tailored look.',
  'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=800',
  23900,
  6690000,
  20
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------
-- Products — Fashion Apparel
-- ---------------------------------------------------------------------
INSERT INTO public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT
  (SELECT id FROM public.categories WHERE slug = 'fashion-apparel'),
  'premium-oversized-hoodie',
  'SDBBUY Premium Oversized Hoodie',
  'Heavyweight cotton-blend hoodie with a relaxed oversized fit. Features a kangaroo pocket, adjustable drawstring hood, and ribbed cuffs and hem. Double-stitched seams throughout. Pre-shrunk fabric maintains its shape after washing. Ideal for layering or standalone wear.',
  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
  7900,
  2210000,
  60
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT
  (SELECT id FROM public.categories WHERE slug = 'fashion-apparel'),
  'essential-tee',
  'SDBBUY Essential T-Shirt',
  'Clean, minimal, built to last. The SDBBUY Essential Tee is cut from 100% combed cotton with a mid-weight feel. Crew neck, regular fit, reinforced shoulder seams. Pre-shrunk with a smooth hand feel. A reliable everyday staple.',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
  3500,
  980000,
  100
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT
  (SELECT id FROM public.categories WHERE slug = 'fashion-apparel'),
  'performance-cargo-pants',
  'SDBBUY Performance Cargo Pants',
  'Tapered cargo pants built from a durable cotton-nylon blend. Features six pockets including two secured cargo pockets, elasticated waistband with drawcord, and articulated knees for unrestricted movement. A clean, modern take on utility wear.',
  'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
  6900,
  1930000,
  45
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------
-- Products — Boxing
-- ---------------------------------------------------------------------
INSERT INTO public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT
  (SELECT id FROM public.categories WHERE slug = 'boxing'),
  'boxing-gloves',
  'SDBBUY Boxing Gloves',
  'Multi-layer foam padding with a genuine leather exterior. Full wraparound wrist strap with hook-and-loop closure for a secure fit. Ventilated palm to reduce moisture buildup. Suitable for bag work, pad work, and sparring. Available in multiple weights.',
  'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800',
  6900,
  1930000,
  50
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT
  (SELECT id FROM public.categories WHERE slug = 'boxing'),
  'boxing-hand-wraps',
  'SDBBUY Boxing Hand Wraps',
  'Cotton-blend hand wraps with controlled stretch for consistent wrist and knuckle support. Thumb loop and hook-and-loop closure for quick, secure application. 180-inch length provides full coverage for hands and wrists. Machine washable.',
  'https://images.unsplash.com/photo-1517438322307-e67111335449?w=800',
  1500,
  420000,
  120
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT
  (SELECT id FROM public.categories WHERE slug = 'boxing'),
  'boxing-training-shorts',
  'SDBBUY Boxing Training Shorts',
  'Lightweight polyester shorts with a wide elastic waistband and internal drawcord. Side split hems for unrestricted leg movement. Moisture-wicking fabric keeps you dry during training. Reinforced stitching throughout.',
  'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800',
  3900,
  1090000,
  80
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------
-- Products — Gym & Fitness
-- ---------------------------------------------------------------------
INSERT INTO public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT
  (SELECT id FROM public.categories WHERE slug = 'gym-fitness'),
  'performance-training-hoodie',
  'SDBBUY Performance Training Hoodie',
  'Lightweight performance hoodie in a polyester-elastane blend. Four-way stretch fabric with moisture-wicking properties. Kangaroo pocket, adjustable hood, and thumbhole cuffs. Designed for warm-ups, outdoor training, and everyday wear.',
  'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800',
  6500,
  1820000,
  55
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT
  (SELECT id FROM public.categories WHERE slug = 'gym-fitness'),
  'training-tee',
  'SDBBUY Training T-Shirt',
  'Sleeveless training tee cut from breathable, moisture-wicking fabric. Lightweight construction with a relaxed fit for unrestricted movement during workouts. Flatlock seams reduce chafing. Quick-dry finish.',
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800',
  3200,
  900000,
  90
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT
  (SELECT id FROM public.categories WHERE slug = 'gym-fitness'),
  'performance-gym-shorts',
  'SDBBUY Performance Gym Shorts',
  'Quick-dry gym shorts in a lightweight polyester build. Elasticated waistband with internal drawcord, zippered side pocket, and mesh ventilation panels. 7-inch inseam for a balanced fit during training.',
  'https://images.unsplash.com/photo-1506617420156-8e4536971650?w=800',
  4200,
  1180000,
  70
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------
-- Products — Accessories
-- ---------------------------------------------------------------------
INSERT INTO public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT
  (SELECT id FROM public.categories WHERE slug = 'accessories'),
  'leather-belt',
  'SDBBUY Leather Belt',
  'Full-grain leather belt with a brushed metal buckle. Clean edge finishing and a classic width suitable for casual and semi-formal wear. Available in multiple sizes.',
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
  3900,
  1090000,
  60
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT
  (SELECT id FROM public.categories WHERE slug = 'accessories'),
  'training-gym-bag',
  'SDBBUY Training Gym Bag',
  'Durable polyester gym bag with a spacious main compartment, ventilated shoe pocket, and multiple interior organizer pockets. Padded shoulder strap and grab handles. Water-resistant base panel. Designed for daily training use.',
  'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
  5900,
  1650000,
  40
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (category_id, slug, name, description, image_url, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT
  (SELECT id FROM public.categories WHERE slug = 'accessories'),
  'leather-wallet',
  'SDBBUY Leather Wallet',
  'Slim-profile wallet in full-grain leather with six card slots, two note compartments, and an ID window. Minimalist design with clean stitching. Fits comfortably in front or back pocket.',
  'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800',
  4500,
  1260000,
  55
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------
-- Product Variants
-- ---------------------------------------------------------------------

-- Leather Biker Jacket — sizes
INSERT INTO public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT id, 'M', 'PLBJ-M', 24900, 6970000, 8 FROM public.products WHERE slug = 'premium-leather-biker-jacket'
UNION ALL
SELECT id, 'L', 'PLBJ-L', 24900, 6970000, 8 FROM public.products WHERE slug = 'premium-leather-biker-jacket'
UNION ALL
SELECT id, 'XL', 'PLBJ-XL', 24900, 6970000, 5 FROM public.products WHERE slug = 'premium-leather-biker-jacket'
UNION ALL
SELECT id, 'XXL', 'PLBJ-XXL', 24900, 6970000, 4 FROM public.products WHERE slug = 'premium-leather-biker-jacket'
ON CONFLICT (sku) DO NOTHING;

-- Leather Bomber Jacket — sizes
INSERT INTO public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT id, 'S', 'CLBJ-S', 21900, 6130000, 8 FROM public.products WHERE slug = 'classic-leather-bomber-jacket'
UNION ALL
SELECT id, 'M', 'CLBJ-M', 21900, 6130000, 10 FROM public.products WHERE slug = 'classic-leather-bomber-jacket'
UNION ALL
SELECT id, 'L', 'CLBJ-L', 21900, 6130000, 8 FROM public.products WHERE slug = 'classic-leather-bomber-jacket'
UNION ALL
SELECT id, 'XL', 'CLBJ-XL', 21900, 6130000, 4 FROM public.products WHERE slug = 'classic-leather-bomber-jacket'
ON CONFLICT (sku) DO NOTHING;

-- Heritage Racing Jacket — sizes
INSERT INTO public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT id, 'M', 'HLRJ-M', 23900, 6690000, 7 FROM public.products WHERE slug = 'heritage-leather-racing-jacket'
UNION ALL
SELECT id, 'L', 'HLRJ-L', 23900, 6690000, 7 FROM public.products WHERE slug = 'heritage-leather-racing-jacket'
UNION ALL
SELECT id, 'XL', 'HLRJ-XL', 23900, 6690000, 6 FROM public.products WHERE slug = 'heritage-leather-racing-jacket'
ON CONFLICT (sku) DO NOTHING;

-- Oversized Hoodie — sizes
INSERT INTO public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT id, 'S', 'POH-S', 7900, 2210000, 15 FROM public.products WHERE slug = 'premium-oversized-hoodie'
UNION ALL
SELECT id, 'M', 'POH-M', 7900, 2210000, 15 FROM public.products WHERE slug = 'premium-oversized-hoodie'
UNION ALL
SELECT id, 'L', 'POH-L', 7900, 2210000, 15 FROM public.products WHERE slug = 'premium-oversized-hoodie'
UNION ALL
SELECT id, 'XL', 'POH-XL', 7900, 2210000, 10 FROM public.products WHERE slug = 'premium-oversized-hoodie'
UNION ALL
SELECT id, 'XXL', 'POH-XXL', 7900, 2210000, 5 FROM public.products WHERE slug = 'premium-oversized-hoodie'
ON CONFLICT (sku) DO NOTHING;

-- Essential Tee — sizes
INSERT INTO public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT id, 'S', 'SET-S', 3500, 980000, 25 FROM public.products WHERE slug = 'essential-tee'
UNION ALL
SELECT id, 'M', 'SET-M', 3500, 980000, 25 FROM public.products WHERE slug = 'essential-tee'
UNION ALL
SELECT id, 'L', 'SET-L', 3500, 980000, 25 FROM public.products WHERE slug = 'essential-tee'
UNION ALL
SELECT id, 'XL', 'SET-XL', 3500, 980000, 15 FROM public.products WHERE slug = 'essential-tee'
UNION ALL
SELECT id, 'XXL', 'SET-XXL', 3500, 980000, 10 FROM public.products WHERE slug = 'essential-tee'
ON CONFLICT (sku) DO NOTHING;

-- Cargo Pants — sizes
INSERT INTO public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT id, 'S', 'PCP-S', 6900, 1930000, 10 FROM public.products WHERE slug = 'performance-cargo-pants'
UNION ALL
SELECT id, 'M', 'PCP-M', 6900, 1930000, 12 FROM public.products WHERE slug = 'performance-cargo-pants'
UNION ALL
SELECT id, 'L', 'PCP-L', 6900, 1930000, 12 FROM public.products WHERE slug = 'performance-cargo-pants'
UNION ALL
SELECT id, 'XL', 'PCP-XL', 6900, 1930000, 8 FROM public.products WHERE slug = 'performance-cargo-pants'
UNION ALL
SELECT id, 'XXL', 'PCP-XXL', 6900, 1930000, 3 FROM public.products WHERE slug = 'performance-cargo-pants'
ON CONFLICT (sku) DO NOTHING;

-- Boxing Gloves — weights
INSERT INTO public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT id, '10 oz', 'SBG-10', 6900, 1930000, 15 FROM public.products WHERE slug = 'boxing-gloves'
UNION ALL
SELECT id, '12 oz', 'SBG-12', 6900, 1930000, 15 FROM public.products WHERE slug = 'boxing-gloves'
UNION ALL
SELECT id, '14 oz', 'SBG-14', 6900, 1930000, 10 FROM public.products WHERE slug = 'boxing-gloves'
UNION ALL
SELECT id, '16 oz', 'SBG-16', 6900, 1930000, 10 FROM public.products WHERE slug = 'boxing-gloves'
ON CONFLICT (sku) DO NOTHING;

-- Boxing Hand Wraps — sizes
INSERT INTO public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT id, '120 inch', 'SBHW-120', 1500, 420000, 40 FROM public.products WHERE slug = 'boxing-hand-wraps'
UNION ALL
SELECT id, '180 inch', 'SBHW-180', 1500, 420000, 80 FROM public.products WHERE slug = 'boxing-hand-wraps'
ON CONFLICT (sku) DO NOTHING;

-- Boxing Training Shorts — sizes
INSERT INTO public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT id, 'S', 'SBTS-S', 3900, 1090000, 20 FROM public.products WHERE slug = 'boxing-training-shorts'
UNION ALL
SELECT id, 'M', 'SBTS-M', 3900, 1090000, 20 FROM public.products WHERE slug = 'boxing-training-shorts'
UNION ALL
SELECT id, 'L', 'SBTS-L', 3900, 1090000, 20 FROM public.products WHERE slug = 'boxing-training-shorts'
UNION ALL
SELECT id, 'XL', 'SBTS-XL', 3900, 1090000, 20 FROM public.products WHERE slug = 'boxing-training-shorts'
ON CONFLICT (sku) DO NOTHING;

-- Performance Training Hoodie — sizes
INSERT INTO public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT id, 'S', 'PTH-S', 6500, 1820000, 15 FROM public.products WHERE slug = 'performance-training-hoodie'
UNION ALL
SELECT id, 'M', 'PTH-M', 6500, 1820000, 15 FROM public.products WHERE slug = 'performance-training-hoodie'
UNION ALL
SELECT id, 'L', 'PTH-L', 6500, 1820000, 15 FROM public.products WHERE slug = 'performance-training-hoodie'
UNION ALL
SELECT id, 'XL', 'PTH-XL', 6500, 1820000, 10 FROM public.products WHERE slug = 'performance-training-hoodie'
ON CONFLICT (sku) DO NOTHING;

-- Training Tee — sizes
INSERT INTO public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT id, 'S', 'STT-S', 3200, 900000, 25 FROM public.products WHERE slug = 'training-tee'
UNION ALL
SELECT id, 'M', 'STT-M', 3200, 900000, 25 FROM public.products WHERE slug = 'training-tee'
UNION ALL
SELECT id, 'L', 'STT-L', 3200, 900000, 25 FROM public.products WHERE slug = 'training-tee'
UNION ALL
SELECT id, 'XL', 'STT-XL', 3200, 900000, 15 FROM public.products WHERE slug = 'training-tee'
ON CONFLICT (sku) DO NOTHING;

-- Performance Gym Shorts — sizes
INSERT INTO public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT id, 'S', 'PGS-S', 4200, 1180000, 18 FROM public.products WHERE slug = 'performance-gym-shorts'
UNION ALL
SELECT id, 'M', 'PGS-M', 4200, 1180000, 18 FROM public.products WHERE slug = 'performance-gym-shorts'
UNION ALL
SELECT id, 'L', 'PGS-L', 4200, 1180000, 18 FROM public.products WHERE slug = 'performance-gym-shorts'
UNION ALL
SELECT id, 'XL', 'PGS-XL', 4200, 1180000, 16 FROM public.products WHERE slug = 'performance-gym-shorts'
ON CONFLICT (sku) DO NOTHING;

-- Leather Belt — sizes
INSERT INTO public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT id, '32"', 'SLB-32', 3900, 1090000, 20 FROM public.products WHERE slug = 'leather-belt'
UNION ALL
SELECT id, '34"', 'SLB-34', 3900, 1090000, 20 FROM public.products WHERE slug = 'leather-belt'
UNION ALL
SELECT id, '36"', 'SLB-36', 3900, 1090000, 15 FROM public.products WHERE slug = 'leather-belt'
UNION ALL
SELECT id, '38"', 'SLB-38', 3900, 1090000, 5 FROM public.products WHERE slug = 'leather-belt'
ON CONFLICT (sku) DO NOTHING;

-- Training Gym Bag — one size
INSERT INTO public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT id, 'One Size', 'STGB-OS', 5900, 1650000, 40 FROM public.products WHERE slug = 'training-gym-bag'
ON CONFLICT (sku) DO NOTHING;

-- Leather Wallet — one size
INSERT INTO public.product_variants (product_id, name, sku, price_usd_cents, price_pkr_paisa, stock_quantity)
SELECT id, 'One Size', 'SLW-OS', 4500, 1260000, 55 FROM public.products WHERE slug = 'leather-wallet'
ON CONFLICT (sku) DO NOTHING;
