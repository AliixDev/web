// frontend/app/products/[slug]/ProductDetail.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, Check, Loader2, Minus, Plus, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatMoney, priceForCurrency } from "@/lib/currency";
import type { Product, ProductVariant } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const currency = useStore((s) => s.currency);
  const addToCart = useStore((s) => s.addToCart);

  const variants = product.product_variants?.filter((v) => v.is_active) ?? [];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.length > 0 ? variants[0] : null,
  );
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState<"idle" | "added" | "buying">("idle");

  const baseUnit = priceForCurrency(currency, product.price_usd_cents, product.price_pkr_paisa);
  const variantOverride =
    selectedVariant &&
    priceForCurrency(
      currency,
      selectedVariant.price_usd_cents ?? product.price_usd_cents,
      selectedVariant.price_pkr_paisa ?? product.price_pkr_paisa,
    );
  const unitPrice = variantOverride ?? baseUnit;
  const stock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;
  const outOfStock = stock <= 0;

  function handleAddToCart() {
    addToCart({
      product_id: product.id,
      variant_id: selectedVariant?.id ?? null,
      slug: product.slug,
      name: product.name,
      variant_name: selectedVariant?.name ?? null,
      image_url: product.image_url,
      unit_price_usd_cents: selectedVariant?.price_usd_cents ?? product.price_usd_cents,
      unit_price_pkr_paisa: selectedVariant?.price_pkr_paisa ?? product.price_pkr_paisa,
      quantity,
      max_stock: stock,
    });
    setAdding("added");
    window.setTimeout(() => setAdding("idle"), 1600);
  }

  function handleBuyNow() {
    handleAddToCart();
    setAdding("buying");
    router.push("/checkout");
  }

  return (
    <div>
      <p className="eyebrow text-neutral-400">
        {product.category_id ? "From the collection" : "SitaraSouq"}
      </p>
      <h1 className="mt-3 text-4xl font-light leading-tight tracking-tight md:text-5xl">
        {product.name}
      </h1>

      <p className="mt-5 text-2xl font-medium tabular-nums">
        {formatMoney(unitPrice * quantity, currency)}
      </p>
      <p className="mt-1 text-xs text-neutral-400">
        {currency === "PKR" ? "Pakistani Rupees" : "US Dollars"} · prices verified at checkout
      </p>

      <div className="mt-8 space-y-7">
        {/* Variants */}
        {variants.length > 0 && (
          <div>
            <p className="text-[13px] font-medium">
              Option{" "}
              <span className="ml-1 text-neutral-400">{selectedVariant?.name}</span>
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {variants.map((variant) => {
                const disabled = variant.stock_quantity <= 0;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => {
                      setSelectedVariant(variant);
                      setQuantity(1);
                    }}
                    disabled={disabled}
                    aria-pressed={selectedVariant?.id === variant.id}
                    className={cn(
                      "min-w-[3.5rem] border px-4 py-2.5 text-[13px] transition-all duration-200",
                      selectedVariant?.id === variant.id
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background text-foreground hover:border-foreground/60",
                      disabled && "cursor-not-allowed opacity-40",
                    )}
                  >
                    {variant.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 text-xs text-neutral-400" aria-live="polite">
              {selectedVariant
                ? `${selectedVariant.stock_quantity} available${selectedVariant.sku ? ` · ${selectedVariant.sku}` : ""}`
                : "Select an option"}
            </p>
          </div>
        )}

        {/* Stock state */}
        <p className={cn("flex items-center gap-2 text-[13px]", outOfStock ? "text-destructive" : "text-neutral-600")}>
          <span className={cn("h-1.5 w-1.5 rounded-full", outOfStock ? "bg-destructive" : "bg-foreground")} aria-hidden />
          {outOfStock ? "Currently out of stock" : `${stock} in stock`}
        </p>

        {/* Quantity */}
        <div className="flex items-center gap-4">
          <span className="text-[13px] font-medium">Quantity</span>
          <div className="flex items-center border border-border">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="flex h-11 w-11 items-center justify-center text-neutral-500 transition-colors hover:bg-accent disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden />
            </button>
            <span className="w-10 text-center text-sm tabular-nums" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
              disabled={outOfStock || quantity >= stock}
              aria-label="Increase quantity"
              className="flex h-11 w-11 items-center justify-center text-neutral-500 transition-colors hover:bg-accent disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>

        {/* CTAs */}
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={cn(
              "flex h-[3.25rem] items-center justify-center gap-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-40",
              adding === "added"
                ? "bg-neutral-200 text-foreground"
                : "bg-foreground text-background hover:opacity-90",
            )}
          >
            {adding === "added" ? (
              <>
                <Check className="h-4 w-4" aria-hidden /> Added to cart
              </>
            ) : (
              "Add to cart"
            )}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={outOfStock}
            className="flex h-[3.25rem] items-center justify-center gap-2 border border-foreground/20 text-sm font-medium transition-colors hover:border-foreground hover:bg-foreground hover:text-background disabled:opacity-40"
          >
            {adding === "buying" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Taking you to checkout
              </>
            ) : (
              "Buy now"
            )}
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="mt-10 border-t border-border pt-8">
        <h2 className="eyebrow text-neutral-400">About this piece</h2>
        <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-neutral-600">
          {product.description}
        </p>
      </div>

      {/* Delivery info */}
      <div className="mt-8 space-y-4 border-t border-border pt-8">
        <div className="flex items-start gap-3.5">
          <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" strokeWidth={1.5} aria-hidden />
          <div>
            <p className="text-[13px] font-medium">Cash on delivery</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-500">
              Available for delivery addresses in Pakistan.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3.5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" strokeWidth={1.5} aria-hidden />
          <div>
            <p className="text-[13px] font-medium">Secure international checkout</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-500">
              Pay with your card via Stripe, in USD, from anywhere in the world.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
