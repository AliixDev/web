// frontend/lib/types.ts

export type Currency = "USD" | "EUR" | "GBP" | "AED" | "SAR" | "CAD" | "AUD" | "CHF" | "PKR";

export interface Category {
  id: string;
  name: string;
  slug: string;
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
