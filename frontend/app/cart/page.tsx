// frontend/app/cart/page.tsx
"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
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
        <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-neutral-50">
          <ShoppingBag className="h-8 w-8 text-neutral-300" strokeWidth={1.25} aria-hidden />
        </div>
        <div>
          <h1 className="font-display text-3xl font-light tracking-tight">Your cart is empty</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-neutral-500">
            Handcrafted apparel, home textiles, and electronics from Pakistan are
            waiting for you.
          </p>
        </div>
        <Link
          href="/shop"
          className="inline-flex h-12 items-center gap-2 bg-foreground px-7 text-sm font-medium text-background transition-opacity hover:opacity-85"
        >
          Start shopping <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-10 md:py-14">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-neutral-400">Your selection</p>
          <h1 className="mt-2 text-4xl font-light tracking-tight md:text-5xl">Cart</h1>
          <p className="mt-2 text-sm text-neutral-500">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} items
          </p>
        </div>
        <Link
          href="/shop"
          className="hidden items-center gap-1.5 text-sm font-medium underline decoration-neutral-300 underline-offset-8 transition-colors hover:text-neutral-500 sm:inline-flex"
        >
          Continue shopping
        </Link>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-3 lg:gap-14">
        {/* Line items */}
        <ul className="divide-y divide-border border-y border-border lg:col-span-2">
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
                  className="relative block h-28 w-24 shrink-0 overflow-hidden bg-neutral-100"
                >
                  <ProductImage src={item.image_url} alt={item.name} sizes="96px" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        href={`/products/${item.slug}`}
                        className="line-clamp-2 text-[15px] font-medium leading-snug transition-opacity hover:opacity-60"
                      >
                        {item.name}
                      </Link>
                      {item.variant_name && (
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-neutral-400">
                          {item.variant_name}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product_id, item.variant_id)}
                      aria-label={`Remove ${item.name} from cart`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-neutral-400 transition-colors hover:bg-accent hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>

                  <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-4">
                    <div className="flex items-center border border-border">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.product_id, item.variant_id, item.quantity - 1)
                        }
                        aria-label="Decrease quantity"
                        disabled={item.quantity <= 1}
                        className="flex h-10 w-10 items-center justify-center text-neutral-500 transition-colors hover:bg-accent disabled:opacity-40"
                      >
                        <Minus className="h-3.5 w-3.5" aria-hidden />
                      </button>
                      <span className="w-10 text-center text-sm tabular-nums" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.product_id, item.variant_id, item.quantity + 1)
                        }
                        aria-label="Increase quantity"
                        disabled={item.quantity >= item.max_stock}
                        className="flex h-10 w-10 items-center justify-center text-neutral-500 transition-colors hover:bg-accent disabled:opacity-40"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                    <p className="text-[15px] font-medium tabular-nums">
                      {formatMoney(unit * item.quantity, currency)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border border-border bg-neutral-50/60 p-7">
            <h2 className="font-display text-xl font-medium tracking-tight">Order summary</h2>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd className="font-medium tabular-nums">{formatMoney(subtotal, currency)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-neutral-500">Shipping</dt>
                <dd className="text-neutral-400">Calculated at checkout</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4">
                <dt className="font-medium">Total</dt>
                <dd className="text-lg font-medium tabular-nums">{formatMoney(subtotal, currency)}</dd>
              </div>
            </dl>
            <Link
              href="/checkout"
              className="mt-7 flex h-12 w-full items-center justify-center gap-2 bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-85"
            >
              Proceed to checkout <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <p className="mt-4 text-center text-xs leading-relaxed text-neutral-400">
              Cash on delivery across Pakistan · Secure card checkout worldwide
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
