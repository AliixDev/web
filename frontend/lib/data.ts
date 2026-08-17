// frontend/lib/data.ts
//
// Build-time data access. All fetches run during `next build` (static
// export) and gracefully return empty results when Supabase env vars
// are not configured.

import { createClient } from "@supabase/supabase-js";
import type { Category, CategoryCard, Product, ProductVariant } from "./types";

function getClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

/** All active products with their active variants, newest first. */
export async function getProducts(): Promise<Product[]> {
  const supabase = getClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data ?? []).map((product) => ({
      ...product,
      product_variants: (product.product_variants ?? []).filter(
        (variant: ProductVariant) => variant.is_active,
      ),
    })) as Product[];
  } catch {
    return [];
  }
}

/** All visible categories (hidden ones are excluded from the store). */
export async function getCategories(): Promise<Category[]> {
  const supabase = getClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, slug, parent_id")
      .eq("is_active", true)
      .order("name");
    if (error) return [];
    return (data ?? []) as Category[];
  } catch {
    return [];
  }
}

/** Top-level categories only — used for navigation and the homepage. */
export async function getTopLevelCategories(): Promise<Category[]> {
  const categories = await getCategories();
  return categories.filter((category) => !category.parent_id);
}

/**
 * Categories enriched with a representative image + product count.
 * Parent categories aggregate products from their subcategories, so a
 * category with children (e.g. Motorbikes) still shows the full count
 * and a real lead image. Only top-level categories are returned.
 */
export async function getCategoryCards(products: Product[]): Promise<CategoryCard[]> {
  const categories = await getCategories();
  const topLevel = categories.filter((category) => !category.parent_id);
  return topLevel.map((category) => {
    const descendantIds = new Set([
      category.id,
      ...categories.filter((c) => c.parent_id === category.id).map((c) => c.id),
    ]);
    const items = products.filter(
      (p) => p.category_id && descendantIds.has(p.category_id),
    );
    return {
      ...category,
      image_url: items.find((p) => p.image_url)?.image_url ?? null,
      product_count: items.length,
    };
  });
}
