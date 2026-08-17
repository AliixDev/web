// frontend/components/product/ProductCard.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatMoney, priceForCurrency } from "@/lib/currency";
import type { Product } from "@/lib/types";
import ProductImage from "./ProductImage";
import { cn } from "@/lib/utils";

export default function ProductCard({ product }: { product: Product }) {
  const currency = useStore((s) => s.currency);
  const addToCart = useStore((s) => s.addToCart);

  const [justAdded, setJustAdded] = useState(false);

  const variants = product.product_variants?.filter((v) => v.is_active) ?? [];
  const hasVariants = variants.length > 0;
  const outOfStock = product.stock_quantity <= 0;
  const unitPrice = priceForCurrency(currency, product.price_usd_cents, product.price_pkr_paisa);
  const compareAt =
    product.compare_at_price_usd_cents != null
      ? priceForCurrency(
          currency,
          product.compare_at_price_usd_cents,
          product.compare_at_price_pkr_paisa ?? product.compare_at_price_usd_cents * 280,
        )
      : null;
  const onSale = compareAt != null && compareAt > unitPrice;

  function handleQuickAdd() {
    if (hasVariants || outOfStock) return;
    addToCart({
      product_id: product.id,
      variant_id: null,
      slug: product.slug,
      name: product.name,
      variant_name: null,
      image_url: product.image_url,
      unit_price_usd_cents: product.price_usd_cents,
      unit_price_pkr_paisa: product.price_pkr_paisa,
      quantity: 1,
      max_stock: product.stock_quantity,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <article className="group relative flex flex-col">
      {/* Image */}
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-neutral-100"
        aria-label={product.name}
      >
        <ProductImage
          src={product.image_url}
          alt={product.name}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 33vw, 50vw"
          className={cn(outOfStock && "grayscale")}
          imgClassName="img-zoom"
        />

        {outOfStock && (
          <span className="absolute left-3 top-3 bg-background/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground backdrop-blur-sm">
            Sold out
          </span>
        )}

        {/* Hover action bar */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-background transition-transform duration-300 ease-premium group-hover:translate-y-0 group-focus-within:translate-y-0">
          {hasVariants ? (
            <Link
              href={`/products/${product.slug}`}
              className="flex h-11 w-full items-center justify-center gap-1.5 border-t border-border text-[13px] font-medium transition-colors duration-200 hover:bg-foreground hover:text-background"
            >
              Choose options
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={outOfStock}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-1.5 border-t border-border text-[13px] font-medium transition-colors duration-200",
                outOfStock ? "cursor-not-allowed text-neutral-400" : "hover:bg-foreground hover:text-background",
              )}
              aria-label={justAdded ? "Added to cart" : `Add ${product.name} to cart`}
            >
              {justAdded ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden /> Added to cart
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" aria-hidden /> Add to cart
                </>
              )}
            </button>
          )}
        </div>
      </Link>

      {/* Meta */}
      <div className="flex items-start justify-between gap-3 pt-3.5">
        <div className="min-w-0">
          {product.brand && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              {product.brand}
            </p>
          )}
          <Link
            href={`/products/${product.slug}`}
            className="line-clamp-1 font-display text-[15px] font-medium tracking-tight text-foreground transition-opacity duration-200 hover:opacity-60"
          >
            {product.name}
          </Link>
          {hasVariants && (
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              {variants.length} options
            </p>
          )}
        </div>
        <p className="shrink-0 text-right">
          <span className="block text-[13px] font-medium tabular-nums">
            {hasVariants && <span className="text-neutral-400">from </span>}
            {formatMoney(unitPrice, currency)}
          </span>
          {onSale && compareAt != null && (
            <span className="block text-[12px] text-neutral-400 line-through tabular-nums">
              {formatMoney(compareAt, currency)}
            </span>
          )}
        </p>
      </div>
    </article>
  );
}
