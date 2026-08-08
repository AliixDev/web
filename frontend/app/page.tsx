// frontend/app/page.tsx
//
// Statically rendered at build time (output: 'export'). The product
// list is fetched from Supabase once during `next build`; there is no
// server available at request time to re-fetch it, so the site must
// be rebuilt (the GitHub Actions workflow can be scheduled or
// triggered on a repository_dispatch event) whenever the catalog
// changes.

import { createClient } from "@supabase/supabase-js";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

async function getProducts(): Promise<Product[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load products at build time", error);
    return [];
  }
  return data as Product[];
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="space-y-8">
      <section className="rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 p-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Pakistan-made goods, delivered worldwide
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Cash on Delivery within Pakistan, secure card checkout everywhere else.
        </p>
      </section>

      {products.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          No products available right now. Please check back soon.
        </p>
      ) : (
        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      )}
    </div>
  );
}
