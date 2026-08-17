// frontend/lib/types.ts

export type Currency = "USD" | "EUR" | "GBP" | "AED" | "SAR" | "CAD" | "AUD" | "CHF" | "PKR";

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price_usd_cents: number | null;
  price_pkr_paisa: number | null;
  stock_quantity: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  category_id: string | null;
  slug: string;
  name: string;
  description: string;
  image_url: string | null;
  price_usd_cents: number;
  price_pkr_paisa: number;
  is_active: boolean;
  stock_quantity: number;
  created_at?: string;
  // Optional merchandising fields used by the product page. All are
  // nullable so existing catalog rows keep working unchanged.
  brand?: string | null;
  images?: string[] | null;
  rating?: number | null;
  review_count?: number | null;
  compare_at_price_usd_cents?: number | null;
  compare_at_price_pkr_paisa?: number | null;
  // SEO fields managed from Seller Central and rendered into the static
  // product pages with sensible fallbacks.
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  product_variants?: ProductVariant[];
}

export interface CartItem {
  product_id: string;
  variant_id: string | null;
  slug: string;
  name: string;
  variant_name: string | null;
  image_url: string | null;
  unit_price_usd_cents: number;
  unit_price_pkr_paisa: number;
  quantity: number;
  max_stock: number;
}

/** A category enriched with a representative image + product count (computed at build time). */
export interface CategoryCard extends Category {
  image_url: string | null;
  product_count: number;
}
