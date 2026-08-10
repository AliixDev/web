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
    window.setTimeout(() => setJustAdded(false), 1600);
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
          sizes="(min-width: 1024px) 25vw, 50vw"
          className={cn(outOfStock && "grayscale")}
          imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />

        {outOfStock && (
          <span className="absolute left-3 top-3 bg-background/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-foreground backdrop-blur">
            Sold out
          </span>
        )}

        {/* Hover action */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-background transition-transform duration-300 ease-out group-hover:translate-y-0 group-focus-within:translate-y-0">
          {hasVariants ? (
            <Link
              href={`/products/${product.slug}`}
              className="flex h-11 w-full items-center justify-center gap-1.5 border-t border-border text-[13px] font-medium transition-colors hover:bg-foreground hover:text-background"
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
                "flex h-11 w-full items-center justify-center gap-1.5 border-t border-border text-[13px] font-medium transition-colors",
                outOfStock
                  ? "cursor-not-allowed text-neutral-400"
                  : "hover:bg-foreground hover:text-background",
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
          <Link
            href={`/products/${product.slug}`}
            className="line-clamp-1 text-[13.5px] font-medium tracking-tight text-foreground transition-opacity hover:opacity-60"
          >
            {product.name}
          </Link>
          {hasVariants && (
            <p className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-neutral-400">
              {variants.length} options
            </p>
          )}
        </div>
        <p className="shrink-0 text-[13.5px] font-medium tabular-nums">
          {hasVariants && <span className="text-neutral-400">from </span>}
          {formatMoney(unitPrice, currency)}
        </p>
      </div>
    </article>
  );
}
