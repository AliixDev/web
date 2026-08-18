// frontend/components/CheckoutForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CreditCard, Loader2, Lock, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import { callEdgeFunction, getSupabase } from "@/lib/supabaseClient";
import { formatMoney, priceForCurrency } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProductImage from "@/components/product/ProductImage";
import AuthModal from "@/components/auth/AuthModal";
import { cn } from "@/lib/utils";

type PaymentMethod = "stripe" | "jazzcash" | "safepay";

interface ShippingDetails {
  name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  country: string;
}

interface CheckoutResponse {
  url?: string;
  order_id: string;
  total_minor?: number;
}

const PAYMENT_OPTIONS: Record<
  PaymentMethod,
  { label: string; description: string; icon: typeof CreditCard; region: "PKR" | "USD" }
> = {
  jazzcash: {
    label: "JazzCash",
    description: "Pay with a JazzCash mobile wallet.",
    icon: Smartphone,
    region: "PKR",
  },
  safepay: {
    label: "Safepay",
    description: "Card / bank payment via Safepay.",
    icon: Wallet,
    region: "PKR",
  },
  stripe: {
    label: "Credit / Debit Card",
    description: "Secure international checkout powered by Stripe.",
    icon: CreditCard,
    region: "USD",
  },
};

export default function CheckoutForm() {
  const router = useRouter();
  const currency = useStore((s) => s.currency);
  const cart = useStore((s) => s.cart);
  const clearCart = useStore((s) => s.clearCart);
  const subtotalMinor = useStore((s) => s.cartSubtotalMinor());

  const [shipping, setShipping] = useState<ShippingDetails>({
    name: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    country: currency === "PKR" ? "Pakistan" : "",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    currency === "PKR" ? "jazzcash" : "stripe",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const cartLines = cart.map((item) => ({
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
  }));

  const availableMethods = (
    Object.entries(PAYMENT_OPTIONS) as [PaymentMethod, (typeof PAYMENT_OPTIONS)[PaymentMethod]][]
  )
    .filter(([, option]) => option.region === currency)
    .map(([key]) => key);

  async function ensureSignedIn(): Promise<boolean> {
    const { data } = await getSupabase().auth.getSession();
    if (data.session) return true;
    setAuthOpen(true);
    return false;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setIsSubmitting(true);
    try {
      const signedIn = await ensureSignedIn();
      if (!signedIn) {
        setIsSubmitting(false);
        return;
      }

      const shippingPayload = {
        name: shipping.name,
        phone: shipping.phone,
        address_line1: shipping.address_line1,
        address_line2: shipping.address_line2 || undefined,
        city: shipping.city,
        country: shipping.country,
      };

      if (paymentMethod === "stripe") {
        const result = await callEdgeFunction<CheckoutResponse>("create-checkout", {
          currency,
          items: cartLines,
          shipping: shippingPayload,
        });
        if (result.url) {
          clearCart();
          window.location.href = result.url;
        }
        return;
      }

      const result = await callEdgeFunction<CheckoutResponse>("local-gateway-checkout", {
        gateway: paymentMethod,
        items: cartLines,
        shipping: shippingPayload,
      });
      if (result.url) {
        clearCart();
        window.location.href = result.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (cart.length === 0 && !isSubmitting) {
    return (
      <div className="flex flex-col items-center gap-5 py-20 text-center">
        <p className="text-neutral-600">Your cart is empty, so there&apos;s nothing to check out yet.</p>
        <button
          type="button"
          onClick={() => router.push("/shop")}
          className="btn-press inline-flex h-11 items-center justify-center bg-foreground px-6 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
        >
          Browse the shop
        </button>
      </div>
    );
  }

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <form onSubmit={handleSubmit} className="grid gap-12 lg:grid-cols-5 lg:gap-16">
      {/* Left: details */}
      <div className="space-y-14 lg:col-span-3">
        {/* Delivery */}
        <section aria-labelledby="shipping-heading">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-sm font-light text-neutral-400" aria-hidden>
              01
            </span>
            <h2 id="shipping-heading" className="font-display text-2xl font-medium tracking-tight">
              Delivery
            </h2>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                autoComplete="name"
                required
                value={shipping.name}
                onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                required
                value={shipping.phone}
                onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                autoComplete="country-name"
                required
                value={shipping.country}
                onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address1">Address line 1</Label>
              <Input
                id="address1"
                autoComplete="address-line1"
                required
                value={shipping.address_line1}
                onChange={(e) => setShipping({ ...shipping, address_line1: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address2">Address line 2 (optional)</Label>
              <Input
                id="address2"
                autoComplete="address-line2"
                value={shipping.address_line2}
                onChange={(e) => setShipping({ ...shipping, address_line2: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                autoComplete="address-level2"
                required
                value={shipping.city}
                onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
              />
            </div>
          </div>
        </section>

        {/* Payment */}
        <section aria-labelledby="payment-heading">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-sm font-light text-neutral-400" aria-hidden>
              02
            </span>
            <h2 id="payment-heading" className="font-display text-2xl font-medium tracking-tight">
              Payment
            </h2>
          </div>

          <div className="mt-6 space-y-3">
            {availableMethods.map((method) => {
              const option = PAYMENT_OPTIONS[method];
              const selected = paymentMethod === method;
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full items-start gap-4 border p-4 text-left transition-all duration-200",
                    selected
                      ? "border-foreground bg-foreground/[0.03]"
                      : "border-neutral-200 bg-background hover:border-neutral-400",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      selected ? "border-foreground" : "border-neutral-300",
                    )}
                    aria-hidden
                  >
                    {selected && <span className="h-2.5 w-2.5 rounded-full bg-foreground" />}
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-[13px] font-medium">
                      <option.icon className="h-4 w-4 text-neutral-400" strokeWidth={1.75} aria-hidden />
                      {option.label}
                    </span>
                    <span className="mt-1 block text-[12px] leading-relaxed text-neutral-600">
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {notice && (
            <p className="mt-5 border border-neutral-200 bg-neutral-50 px-4 py-3 text-[13px] text-neutral-600">
              {notice}
            </p>
          )}
          {error && (
            <p
              className="mt-5 border border-destructive/20 bg-destructive/5 px-4 py-3 text-[13px] text-destructive"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-press mt-8 flex h-12 w-full items-center justify-center gap-2 bg-foreground text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Placing order…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Place order ·{" "}
                {formatMoney(subtotalMinor, currency)}
              </>
            )}
          </button>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-neutral-400">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            Secure checkout · Card payments via Stripe worldwide
          </p>
        </section>
      </div>

      {/* Right: order summary */}
      <aside className="lg:col-span-2" aria-label="Order summary">
        <div className="lg:sticky lg:top-28">
          <h2 className="font-display text-2xl font-medium tracking-tight">
            Order summary{" "}
            <span className="font-sans text-sm font-normal text-neutral-400">
              ({itemCount} {itemCount === 1 ? "item" : "items"})
            </span>
          </h2>

          <ul className="mt-6 divide-y divide-neutral-100 border-y border-neutral-100">
            {cart.map((item) => {
              const unit = priceForCurrency(
                currency,
                item.unit_price_usd_cents,
                item.unit_price_pkr_paisa,
              );
              return (
                <li key={`${item.product_id}-${item.variant_id ?? "base"}`} className="flex gap-4 py-4">
                  <div className="relative h-[72px] w-[60px] shrink-0 overflow-hidden bg-neutral-100">
                    <ProductImage src={item.image_url} alt={item.name} sizes="60px" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="line-clamp-1 text-[13px] font-medium">{item.name}</p>
                    {item.variant_name && (
                      <p className="mt-0.5 text-[11px] uppercase tracking-[0.15em] text-neutral-400">
                        {item.variant_name}
                      </p>
                    )}
                    <p className="mt-auto text-[12px] text-neutral-400">
                      Qty {item.quantity} × {formatMoney(unit, currency)}
                    </p>
                  </div>
                  <p className="shrink-0 text-[13px] font-medium tabular-nums">
                    {formatMoney(unit * item.quantity, currency)}
                  </p>
                </li>
              );
            })}
          </ul>

          <dl className="mt-5 space-y-2.5 text-[13px]">
            <div className="flex items-center justify-between">
              <dt className="text-neutral-600">Subtotal</dt>
              <dd className="font-medium tabular-nums">{formatMoney(subtotalMinor, currency)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-neutral-600">Shipping</dt>
              <dd className="text-neutral-400">Calculated at checkout</dd>
            </div>
            <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
              <dt className="font-medium">Total</dt>
              <dd className="text-[17px] font-medium tabular-nums">
                {formatMoney(subtotalMinor, currency)}
              </dd>
            </div>
          </dl>

          <p className="mt-6 border border-neutral-200 bg-neutral-50 px-4 py-3 text-[12px] leading-relaxed text-neutral-600">
            You&apos;ll be asked to sign in before placing the order — orders are tied to your
            account so you can track them later.
          </p>
        </div>
      </aside>

      <AuthModal
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
          setNotice("We've emailed you a sign-in link. Open it, then place your order again.");
        }}
        context="checkout"
      />
    </form>
  );
}
