// frontend/app/cart/page.tsx
"use client";

import Link from "next/link";
import { ArrowRight, Lock, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatMoney, priceForCurrency } from "@/lib/currency";
import ProductImage from "@/components/product/ProductImage";

export default function CartPage() {
  const currency = useStore((s) => s.currency);
  const cart = useStore((s) => s.cart);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const subtotal = useStore((s) => s.cartSubtotalMinor());

  if (cart.length === 0) {
    return (
      <div className="container flex flex-col items-center justify-center gap-6 py-28 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50">
          <ShoppingBag className="h-8 w-8 text-neutral-300" strokeWidth={1.25} aria-hidden />
        </div>
        <div>
          <h1 className="font-display text-3xl font-light tracking-tight">Your cart is empty</h1>
          <p className="mx-auto mt-3 max-w-sm text-[14px] leading-[1.7] text-neutral-600">
            Handcrafted apparel, home textiles, and electronics from Pakistan are waiting for you.
          </p>
        </div>
        <Link
          href="/shop"
          className="btn-press inline-flex h-12 items-center gap-2 bg-foreground px-7 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
        >
          Start shopping <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="container pb-28 py-10 md:pb-14 md:py-14">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Your selection</p>
          <h1 className="mt-2 text-4xl font-light tracking-tight md:text-5xl">Cart</h1>
          <p className="mt-2 text-[13px] text-neutral-600">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        <Link
          href="/shop"
          className="hidden items-center gap-1.5 text-[13px] font-medium text-neutral-600 transition-colors hover:text-foreground sm:inline-flex"
        >
          Continue shopping
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-3 lg:gap-14">
        {/* Line items */}
        <ul className="divide-y divide-neutral-100 border-y border-neutral-100 lg:col-span-2">
          {cart.map((item) => {
            const unit = priceForCurrency(
              currency,
              item.unit_price_usd_cents,
              item.unit_price_pkr_paisa,
            );
            return (
              <li key={`${item.product_id}-${item.variant_id ?? "base"}`} className="flex gap-5 py-6">
                <Link
                  href={`/products/${item.slug}`}
                  className="relative block h-[112px] w-[96px] shrink-0 overflow-hidden bg-neutral-100"
                >
                  <ProductImage src={item.image_url} alt={item.name} sizes="96px" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.slug}`}
                        className="line-clamp-2 font-display text-[15px] font-medium leading-snug tracking-tight transition-opacity duration-200 hover:opacity-60"
                      >
                        {item.name}
                      </Link>
                      {item.variant_name && (
                        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.15em] text-neutral-400">
                          {item.variant_name}
                        </p>
                      )}
                      <p className="mt-1.5 text-[12px] text-neutral-400">
                        {formatMoney(unit, currency)} each
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product_id, item.variant_id)}
                      aria-label={`Remove ${item.name} from cart`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center text-neutral-300 transition-colors duration-200 hover:text-destructive"
                    >
                      <Trash2 className="h-[15px] w-[15px]" strokeWidth={1.5} aria-hidden />
                    </button>
                  </div>

                  <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-4">
                    <div className="flex items-center border border-neutral-200">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        disabled={item.quantity <= 1}
                        className="flex h-10 w-10 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-50 disabled:opacity-30"
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <span className="w-10 text-center text-[13px] tabular-nums" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                        aria-label="Increase quantity"
                        disabled={item.quantity >= item.max_stock}
                        className="flex h-10 w-10 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-50 disabled:opacity-30"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                    <p className="text-[14px] font-medium tabular-nums">
                      {formatMoney(unit * item.quantity, currency)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Summary */}
        <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Order summary">
          <div className="border border-neutral-200 bg-neutral-50/60 p-7">
            <h2 className="font-display text-xl font-medium tracking-tight">Order summary</h2>
            <dl className="mt-6 space-y-3 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-neutral-600">Subtotal</dt>
                <dd className="font-medium tabular-nums">{formatMoney(subtotal, currency)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-neutral-600">Shipping</dt>
                <dd className="text-neutral-400">Calculated at checkout</dd>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
                <dt className="font-medium">Total</dt>
                <dd className="text-[17px] font-medium tabular-nums" aria-live="polite">
                  {formatMoney(subtotal, currency)}
                </dd>
              </div>
            </dl>
            <Link
              href="/checkout"
              className="btn-press mt-7 flex h-12 w-full items-center justify-center gap-2 bg-foreground text-[13px] font-medium text-background transition-opacity hover:opacity-85"
            >
              <Lock className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              Proceed to checkout
            </Link>
            <p className="mt-4 text-center text-[11px] leading-relaxed text-neutral-400">
              Cash on delivery across Pakistan · Secure card checkout worldwide
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile continue shopping */}
      <div className="mt-8 text-center sm:hidden">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600 transition-colors hover:text-foreground"
        >
          Continue shopping <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {/* Mobile sticky checkout bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-4 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-400">Total</p>
            <p className="text-[15px] font-medium tabular-nums">{formatMoney(subtotal, currency)}</p>
          </div>
          <Link
            href="/checkout"
            className="btn-press flex h-11 flex-1 items-center justify-center gap-2 bg-foreground text-[13px] font-medium text-background transition-opacity hover:opacity-90"
          >
            Checkout <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
