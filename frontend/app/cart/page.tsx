// frontend/app/cart/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { formatMoney, priceForCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Trash2, Minus, Plus } from "lucide-react";

export default function CartPage() {
  const currency = useStore((s) => s.currency);
  const cart = useStore((s) => s.cart);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const subtotal = useStore((s) => s.cartSubtotalMinor());

  if (cart.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-muted-foreground">Your cart is empty.</p>
        <Button asChild className="mt-4">
          <Link href="/">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="space-y-4 md:col-span-2">
        <h1 className="text-2xl font-bold">Your cart</h1>
        {cart.map((item) => {
          const unit = priceForCurrency(currency, item.unit_price_usd_cents, item.unit_price_pkr_paisa);
          return (
            <div
              key={`${item.product_id}-${item.variant_id ?? "base"}`}
              className="flex items-center gap-4 rounded-lg border border-border p-4"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                {item.image_url && (
                  <Image src={item.image_url} alt={item.name} fill unoptimized className="object-cover" />
                )}
              </div>
              <div className="flex-1">
                <Link href={`/products/${item.slug}`} className="font-medium hover:text-primary">
                  {item.name}
                </Link>
                {item.variant_name && (
                  <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                )}
                <p className="text-sm font-semibold">{formatMoney(unit, currency)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-md border border-input p-1 hover:bg-accent"
                  onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-6 text-center text-sm">{item.quantity}</span>
                <button
                  type="button"
                  className="rounded-md border border-input p-1 hover:bg-accent disabled:opacity-50"
                  onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                  disabled={item.quantity >= item.max_stock}
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-destructive"
                onClick={() => removeFromCart(item.product_id, item.variant_id)}
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="h-fit space-y-4 rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold">{formatMoney(subtotal, currency)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Shipping and final total are calculated at checkout.
        </p>
        <Button asChild size="lg" className="w-full">
          <Link href="/checkout">Proceed to checkout</Link>
        </Button>
      </div>
    </div>
  );
}
