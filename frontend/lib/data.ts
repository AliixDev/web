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

/** All categories. */
export async function getCategories(): Promise<Category[]> {
  const supabase = getClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase.from("categories").select("id, name, slug").order("name");
    if (error) return [];
    return (data ?? []) as Category[];
  } catch {
    return [];
  }
}

/** Categories enriched with a representative image + product count. */
export async function getCategoryCards(products: Product[]): Promise<CategoryCard[]> {
  const categories = await getCategories();
  return categories.map((category) => {
    const items = products.filter((p) => p.category_id === category.id);
    return {
      ...category,
      image_url: items.find((p) => p.image_url)?.image_url ?? null,
      product_count: items.length,
    };
  });
}
