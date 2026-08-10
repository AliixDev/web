// frontend/components/cart/CartDrawer.tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatMoney, priceForCurrency } from "@/lib/currency";
import ProductImage from "@/components/product/ProductImage";

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

  // Lock body scroll + close on Escape while open
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close cart"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 cursor-default bg-black/30 backdrop-blur-[2px]"
      />

      {/* Panel */}
      <aside className="animate-slide-in-right absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background shadow-panel">
        <header className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="font-display text-xl font-medium tracking-tight">
            Cart <span className="text-sm text-neutral-400">({cart.length})</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-sm text-neutral-500 transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-neutral-50">
              <ShoppingBag className="h-6 w-6 text-neutral-400" strokeWidth={1.25} aria-hidden />
            </div>
            <div>
              <p className="font-display text-lg font-medium">Your cart is empty</p>
              <p className="mt-1 text-sm text-neutral-500">
                Discover handcrafted goods from Pakistan.
              </p>
            </div>
            <Link
              href="/shop"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-85"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-y-auto">
              {cart.map((item) => {
                const unit = priceForCurrency(
                  currency,
                  item.unit_price_usd_cents,
                  item.unit_price_pkr_paisa,
                );
                return (
                  <li key={`${item.product_id}-${item.variant_id ?? "base"}`} className="flex gap-4 px-6 py-5">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={onClose}
                      className="relative block h-24 w-20 shrink-0 overflow-hidden bg-neutral-100"
                    >
                      <ProductImage src={item.image_url} alt={item.name} sizes="80px" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={onClose}
                          className="line-clamp-2 text-sm font-medium leading-snug transition-opacity hover:opacity-60"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product_id, item.variant_id)}
                          aria-label={`Remove ${item.name} from cart`}
                          className="shrink-0 text-neutral-400 transition-colors hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                      {item.variant_name && (
                        <p className="mt-0.5 text-xs uppercase tracking-[0.12em] text-neutral-400">
                          {item.variant_name}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-3">
                        <div className="flex items-center border border-border">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.product_id, item.variant_id, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            className="flex h-8 w-8 items-center justify-center text-neutral-500 transition-colors hover:bg-accent disabled:opacity-40"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" aria-hidden />
                          </button>
                          <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.product_id, item.variant_id, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                            disabled={item.quantity >= item.max_stock}
                            className="flex h-8 w-8 items-center justify-center text-neutral-500 transition-colors hover:bg-accent disabled:opacity-40"
                          >
                            <Plus className="h-3 w-3" aria-hidden />
                          </button>
                        </div>
                        <p className="text-sm font-medium tabular-nums">
                          {formatMoney(unit * item.quantity, currency)}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <footer className="space-y-4 border-t border-border px-6 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Subtotal</span>
                <span className="text-base font-medium tabular-nums">
                  {formatMoney(subtotal, currency)}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Shipping and final total are calculated at checkout.
              </p>
              <Link
                href="/checkout"
                onClick={onClose}
                className="flex h-12 w-full items-center justify-center bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-85"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={onClose}
                className="flex h-12 w-full items-center justify-center border border-foreground/20 text-sm font-medium transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
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
