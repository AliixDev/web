// frontend/components/homepage/CategoryGrid.tsx
"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import ProductImage from "@/components/product/ProductImage";
import Reveal from "@/components/Reveal";

interface CategoryGridProps {
  categories: Category[];
  products: Product[];
}

function productsIn(
  category: Category | undefined,
  categories: Category[],
  products: Product[],
): Product[] {
  if (!category) return [];
  const ids = new Set([
    category.id,
    ...categories.filter((c) => c.parent_id === category.id).map((c) => c.id),
  ]);
  return products.filter((p) => p.category_id && ids.has(p.category_id));
}

function leadImage(items: Product[]): string | null {
  return items.find((p) => p.image_url)?.image_url ?? null;
}

const CATEGORY_DISPLAY = [
  { slug: "motorbike-gear", name: "Motorbike Gear", tag: "Protection" },
  { slug: "leather-jackets-biker-fashion", name: "Leather Jackets", tag: "Craft" },
  { slug: "handcrafted-gloves", name: "Handcrafted Gloves", tag: "Stitched" },
] as const;

export default function CategoryGrid({ categories, products }: CategoryGridProps) {
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));

  return (
    <section className="border-b border-neutral-800 bg-[#080808]">
      <div className="container py-16 md:py-24">
        <Reveal>
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                The collection
              </p>
              <h2 className="mt-3 font-display text-[32px] font-light tracking-tight text-white sm:text-4xl md:text-5xl">
                Shop by Category
              </h2>
            </div>
            <Link
              href="/shop"
              className="group hidden items-center gap-1.5 text-[13px] font-medium text-neutral-500 transition-colors hover:text-white sm:inline-flex"
            >
              View all
              <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {CATEGORY_DISPLAY.map((block, index) => {
            const cat = catBySlug.get(block.slug);
            const items = productsIn(cat, categories, products);
            const image = leadImage(items);

            return (
              <Reveal key={block.slug} delay={index * 90}>
                <Link
                  href={`/shop?category=${block.slug}`}
                  className="group relative block aspect-[4/5] overflow-hidden bg-neutral-900"
                >
                  {image ? (
                    <ProductImage
                      src={image}
                      alt={block.name}
                      sizes="(min-width: 640px) 33vw, 100vw"
                      imgClassName="img-zoom"
                      className="bg-neutral-900"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-950">
                      <span className="font-display text-[48px] font-light text-neutral-800">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                  )}

                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 group-hover:from-black/90"
                    aria-hidden
                  />

                  <span
                    className="absolute left-4 top-4 font-display text-[11px] font-light tracking-[0.2em] text-white/50"
                    aria-hidden
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/50">
                        {block.tag}
                      </p>
                      <p className="mt-1 font-display text-[20px] font-light tracking-tight text-white sm:text-[22px]">
                        {block.name}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                        {items.length} {items.length === 1 ? "piece" : "pieces"}
                      </p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition-all duration-300 group-hover:rotate-45 group-hover:border-white/50">
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
