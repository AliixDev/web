// frontend/components/homepage/FeaturedProducts.tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/lib/types";
import ProductGrid from "@/components/product/ProductGrid";
import Reveal from "@/components/Reveal";

interface FeaturedProductsProps {
  products: Product[];
}

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className="border-b border-neutral-800 bg-[#080808]">
      <div className="container py-16 md:py-24">
        <Reveal>
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
                The edit
              </p>
              <h2 className="mt-3 font-display text-[32px] font-light tracking-tight text-white sm:text-4xl md:text-5xl">
                Featured Pieces
              </h2>
            </div>
            <Link
              href="/shop"
              className="group hidden items-center gap-1.5 text-[13px] font-medium text-neutral-500 transition-colors hover:text-white sm:inline-flex"
            >
              View all
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </Reveal>
        <div className="mt-12">
          <div className="dark-section">
            <ProductGrid products={products} />
          </div>
        </div>
        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/shop"
            className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 transition-colors hover:text-white"
          >
            View all products
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
