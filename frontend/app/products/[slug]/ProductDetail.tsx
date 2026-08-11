// frontend/app/products/[slug]/ProductDetail.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const [showStickyBar, setShowStickyBar] = useState(false);

  const purchaseRef = useRef<HTMLDivElement | null>(null);

  // Mobile: reveal the sticky buy bar once the in-page purchase panel
  // has scrolled out of view.
  useEffect(() => {
    const node = purchaseRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
    window.setTimeout(() => setAdding("idle"), 1800);
  }

  function handleBuyNow() {
    handleAddToCart();
    setAdding("buying");
    router.push("/checkout");
  }

  const addLabel = adding === "added" ? "Added to cart" : "Add to cart";

  return (
    <>
      <div>
        <p className="eyebrow">{product.category_id ? "From the collection" : "SitaraSouq"}</p>
        <h1 className="mt-3 text-[32px] font-light leading-[1.08] tracking-tight md:text-[42px]">
          {product.name}
        </h1>

        {/* Price */}
        <div className="mt-5 flex items-baseline gap-3">
          <p className="text-2xl font-medium tabular-nums">{formatMoney(unitPrice * quantity, currency)}</p>
          <p className="text-[12px] text-neutral-400">
            {currency === "PKR" ? "Pakistani Rupees" : "US Dollars"} · verified at checkout
          </p>
        </div>

        <div ref={purchaseRef} className="mt-8 space-y-7">
          {/* Variants */}
          {variants.length > 0 && (
            <div>
              <p className="text-[13px] font-medium">
                Option <span className="ml-1 text-neutral-400">{selectedVariant?.name}</span>
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
                        "min-w-[3.5rem] border px-4 py-2.5 text-[13px] font-medium transition-all duration-200",
                        selectedVariant?.id === variant.id
                          ? "border-foreground bg-foreground text-background"
                          : "border-neutral-200 bg-background text-foreground hover:border-neutral-400",
                        disabled && "cursor-not-allowed opacity-30",
                      )}
                    >
                      {variant.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2.5 text-[12px] text-neutral-400" aria-live="polite">
                {selectedVariant
                  ? `${selectedVariant.stock_quantity} available${selectedVariant.sku ? ` · ${selectedVariant.sku}` : ""}`
                  : "Select an option"}
              </p>
            </div>
          )}

          {/* Stock state */}
          <p
            className={cn(
              "flex items-center gap-2 text-[13px]",
              outOfStock ? "text-destructive" : "text-neutral-600",
            )}
          >
            <span
              className={cn("h-1.5 w-1.5 rounded-full", outOfStock ? "bg-destructive" : "bg-foreground")}
              aria-hidden
            />
            {outOfStock ? "Currently out of stock" : `${stock} in stock`}
          </p>

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="text-[13px] font-medium">Quantity</span>
            <div className="flex items-center border border-neutral-200">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="flex h-11 w-11 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-50 disabled:opacity-30"
              >
                <Minus className="h-3.5 w-3.5" aria-hidden />
              </button>
              <span className="w-10 text-center text-[13px] font-medium tabular-nums" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                disabled={outOfStock || quantity >= stock}
                aria-label="Increase quantity"
                className="flex h-11 w-11 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-50 disabled:opacity-30"
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
                "btn-press flex h-[3.25rem] items-center justify-center gap-2 text-[13px] font-medium transition-all duration-200 disabled:opacity-30",
                adding === "added" ? "bg-neutral-100 text-foreground" : "bg-foreground text-background hover:opacity-90",
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
              className="btn-press flex h-[3.25rem] items-center justify-center gap-2 border border-neutral-300 text-[13px] font-medium transition-all duration-200 hover:border-foreground hover:bg-foreground hover:text-background disabled:opacity-30"
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
        <div className="mt-10 border-t border-neutral-200 pt-8">
          <h2 className="eyebrow">About this piece</h2>
          <p className="mt-3 max-w-prose text-[14px] leading-[1.8] text-neutral-600">{product.description}</p>
        </div>

        {/* Delivery info */}
        <div className="mt-8 space-y-5 border-t border-neutral-200 pt-8">
          <div className="flex items-start gap-3.5">
            <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" strokeWidth={1.25} aria-hidden />
            <div>
              <p className="text-[13px] font-medium">Cash on delivery</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-600">
                Available for delivery addresses in Pakistan.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" strokeWidth={1.25} aria-hidden />
            <div>
              <p className="text-[13px] font-medium">Secure international checkout</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-600">
                Pay with your card via Stripe, in USD, from anywhere in the world.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky buy bar */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl transition-transform duration-300 ease-premium md:hidden",
          showStickyBar ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">
              {outOfStock ? "Out of stock" : `${quantity} × ${formatMoney(unitPrice, currency)}`}
            </p>
            <p className="text-[15px] font-medium tabular-nums">{formatMoney(unitPrice * quantity, currency)}</p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={cn(
              "btn-press flex h-11 flex-1 items-center justify-center gap-2 text-[13px] font-medium transition-colors disabled:opacity-30",
              adding === "added" ? "bg-neutral-100 text-foreground" : "bg-foreground text-background hover:opacity-90",
            )}
          >
            {adding === "added" ? (
              <>
                <Check className="h-4 w-4" aria-hidden /> Added
              </>
            ) : (
              addLabel
            )}
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={outOfStock}
            className="btn-press flex h-11 items-center justify-center border border-neutral-300 px-5 text-[13px] font-medium transition-colors hover:border-foreground hover:bg-foreground hover:text-background disabled:opacity-30"
          >
            {adding === "buying" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              "Buy now"
            )}
          </button>
        </div>
      </div>
    </>
  );
}
