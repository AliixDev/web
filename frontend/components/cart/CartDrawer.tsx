// frontend/components/cart/CartDrawer.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatMoney, priceForCurrency } from "@/lib/currency";
import { useDialog } from "@/lib/useDialog";
import ProductImage from "@/components/product/ProductImage";
import { cn } from "@/lib/utils";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const currency = useStore((s) => s.currency);
  const cart = useStore((s) => s.cart);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const subtotal = useStore((s) => s.cartSubtotalMinor());

  const [removingId, setRemovingId] = useState<string | null>(null);
  const drawerRef = useDialog(open, onClose);

  if (!open) return null;

  function handleRemove(productId: string, variantId: string | null) {
    setRemovingId(`${productId}-${variantId ?? "base"}`);
    // Briefly animate the line out before actually removing it.
    window.setTimeout(() => removeFromCart(productId, variantId), 180);
    window.setTimeout(() => setRemovingId(null), 260);
  }

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div ref={drawerRef} className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      {/* Backdrop */}
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close cart"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 cursor-default bg-black/30 backdrop-blur-[2px]"
      />

      {/* Panel */}
      <aside className="animate-slide-in-right absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-background shadow-panel">
        <header className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="font-display text-xl font-medium tracking-tight">
            Cart{" "}
            <span className="font-sans text-sm font-normal text-neutral-400">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-foreground"
          >
            <X className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
          </button>
        </header>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50">
              <ShoppingBag className="h-6 w-6 text-neutral-300" strokeWidth={1.25} aria-hidden />
            </div>
            <div>
              <p className="font-display text-lg font-medium tracking-tight">Your cart is empty</p>
              <p className="mx-auto mt-1 max-w-[240px] text-[13px] leading-relaxed text-neutral-500">
                Discover premium motorcycle protection, leather jackets, and handcrafted gloves from SDB WEAR.
              </p>
            </div>
            <Link
              href="/shop"
              onClick={onClose}
              className="btn-press inline-flex h-11 items-center gap-2 bg-foreground px-6 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
            >
              Start shopping <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-neutral-100 overflow-y-auto custom-scrollbar" aria-live="polite">
              {cart.map((item) => {
                const unit = priceForCurrency(
                  currency,
                  item.unit_price_usd_cents,
                  item.unit_price_pkr_paisa,
                );
                const isRemoving = removingId === `${item.product_id}-${item.variant_id ?? "base"}`;
                return (
                  <li
                    key={`${item.product_id}-${item.variant_id ?? "base"}`}
                    className={cn(
                      "flex gap-4 px-6 py-5 transition-all duration-200",
                      isRemoving && "opacity-0 -translate-x-3",
                    )}
                  >
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={onClose}
                      className="relative block h-[88px] w-[72px] shrink-0 overflow-hidden bg-neutral-100"
                    >
                      <ProductImage src={item.image_url} alt={item.name} sizes="72px" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={onClose}
                          className="line-clamp-2 text-[13px] font-medium leading-snug transition-opacity duration-200 hover:opacity-60"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.product_id, item.variant_id)}
                          aria-label={`Remove ${item.name} from cart`}
                          className="shrink-0 text-neutral-300 transition-colors duration-200 hover:text-destructive"
                        >
                          <Trash2 className="h-[15px] w-[15px]" strokeWidth={1.5} aria-hidden />
                        </button>
                      </div>
                      {item.variant_name && (
                        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400">
                          {item.variant_name}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div className="flex items-center border border-neutral-200">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.product_id, item.variant_id, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            className="flex h-8 w-8 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-50 disabled:opacity-30"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" aria-hidden />
                          </button>
                          <span className="w-8 text-center text-[13px] tabular-nums" aria-live="polite">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.product_id, item.variant_id, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                            className="flex h-8 w-8 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-50 disabled:opacity-30"
                            disabled={item.quantity >= item.max_stock}
                          >
                            <Plus className="h-3 w-3" aria-hidden />
                          </button>
                        </div>
                        <p className="text-[13px] font-medium tabular-nums">
                          {formatMoney(unit * item.quantity, currency)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <footer className="space-y-3 border-t border-border px-6 py-5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-neutral-500">Subtotal</span>
                <span className="text-[15px] font-medium tabular-nums">{formatMoney(subtotal, currency)}</span>
              </div>
              <p className="text-[12px] leading-relaxed text-neutral-400">
                Shipping and final total are calculated at checkout.
              </p>
              <Link
                href="/checkout"
                onClick={onClose}
                className="btn-press flex h-12 w-full items-center justify-center gap-2 bg-foreground text-[13px] font-medium text-background transition-opacity hover:opacity-85"
              >
                Checkout <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className="flex h-11 w-full items-center justify-center border border-neutral-200 text-[13px] font-medium text-foreground transition-all duration-200 hover:border-foreground hover:bg-foreground hover:text-background"
              >
                View full cart
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
