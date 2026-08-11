// frontend/app/products/[slug]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ArrowRight, ChevronRight } from "lucide-react";
import type { Product, ProductVariant } from "@/lib/types";
import ProductImage from "@/components/product/ProductImage";
import ProductDetail from "./ProductDetail";
import ProductGrid from "@/components/product/ProductGrid";
import Reveal from "@/components/Reveal";

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function generateStaticParams() {
  try {
    const supabase = getSupabase();
    if (!supabase) return [{ slug: "placeholder" }];

    const { data, error } = await supabase.from("products").select("slug").eq("is_active", true);
    if (error) return [{ slug: "placeholder" }];
    const slugs = (data ?? []).map((product) => ({ slug: product.slug as string }));
    return slugs.length > 0 ? slugs : [{ slug: "placeholder" }];
  } catch {
    return [{ slug: "placeholder" }];
  }
}

async function getProduct(slug: string): Promise<Product | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();
    if (error || !data) return null;
    return {
      ...data,
      product_variants: (data.product_variants ?? []).filter(
        (variant: ProductVariant) => variant.is_active,
      ),
    } as Product;
  } catch {
    return null;
  }
}

async function getRelated(product: Product): Promise<Product[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const query = supabase
      .from("products")
      .select("*, product_variants(*)")
      .eq("is_active", true)
      .neq("id", product.id)
      .limit(4);

    if (product.category_id) query.eq("category_id", product.category_id);

    const { data, error } = await query;
    if (error) return [];
    return (data ?? []) as Product[];
  } catch {
    return [];
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);
  if (!product) notFound();

  const related = await getRelated(product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(product.image_url ? { image: [product.image_url] } : {}),
    offers: {
      "@type": "Offer",
      price: (product.price_usd_cents / 100).toFixed(2),
      priceCurrency: "USD",
      availability:
        product.stock_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container pb-28 pt-8 md:pb-12 md:pt-12">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-neutral-400">
          <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <Link href="/shop" className="transition-colors hover:text-foreground">Shop</Link>
          <ChevronRight className="h-3 w-3" aria-hidden />
          <span className="font-medium text-foreground">{product.name}</span>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Gallery */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative">
              <div className="absolute -left-4 -top-4 hidden h-16 w-16 border-l border-t border-neutral-200 lg:block" aria-hidden />
              <div className="relative aspect-square overflow-hidden bg-neutral-100">
                <ProductImage
                  src={product.image_url}
                  alt={product.name}
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  imgClassName="transition-transform duration-700 ease-out hover:scale-[1.03]"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Product photography
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                1 / 1
              </p>
            </div>
          </div>

          {/* Purchase panel */}
          <ProductDetail product={product} />
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="border-t border-border">
          <div className="container py-16 md:py-20">
            <Reveal>
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="eyebrow">Keep exploring</p>
                  <h2 className="mt-3 text-3xl font-light tracking-tight md:text-4xl">You may also like</h2>
                </div>
                <Link
                  href="/shop"
                  className="group hidden shrink-0 items-center gap-1.5 text-[13px] font-medium text-neutral-600 transition-colors hover:text-foreground sm:inline-flex"
                >
                  View all
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </div>
            </Reveal>
            <div className="mt-10">
              <ProductGrid products={related} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
