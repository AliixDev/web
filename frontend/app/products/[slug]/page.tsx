// frontend/app/products/[slug]/page.tsx

import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Image from "next/image";
import type { Product } from "@/lib/types";
import ProductDetail from "./ProductDetail";

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Required for `output: 'export'`: every dynamic [slug] route must be
// known and pre-rendered at build time, since there is no server to
// resolve new slugs on demand once deployed to GitHub Pages.
export async function generateStaticParams() {
  try {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase.from("products").select("slug").eq("is_active", true);
    if (error) {
      console.error("generateStaticParams: failed to fetch product slugs", error);
      return [];
    }
    return (data ?? []).map((product) => ({ slug: product.slug as string }));
  } catch (err) {
    console.error("generateStaticParams: unexpected error", err);
    return [];
  }
}

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;
  return data as Product;
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill unoptimized className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <ProductDetail product={product} />
    </div>
  );
}
