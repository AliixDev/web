// frontend/components/CheckoutForm.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Banknote, CreditCard, Loader2, Lock, Smartphone, Wallet } from "lucide-react";
import { useStore } from "@/lib/store";
import { callEdgeFunction, getSupabase } from "@/lib/supabaseClient";
import { formatMoney } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthModal from "@/components/auth/AuthModal";
import { cn } from "@/lib/utils";

type PaymentMethod = "stripe" | "cod" | "jazzcash" | "safepay";

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
  cod: {
    label: "Cash on Delivery",
    description: "Pay in cash when your order arrives — Pakistan only.",
    icon: Banknote,
    region: "PKR",
  },
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
    currency === "PKR" ? "cod" : "stripe",
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

  const availableMethods = (Object.entries(PAYMENT_OPTIONS) as [PaymentMethod, (typeof PAYMENT_OPTIONS)[PaymentMethod]][])
    .filter(([, option]) => option.region === currency)
    .map(([key]) => key);

  async function ensureSignedIn(): Promise<boolean> {
    const { data } = await getSupabase().auth.getSession();
    if (data.session) return true;

    // Open the magic-link modal; the order must be resubmitted after sign-in.
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
    if (paymentMethod === "cod" && shipping.country.trim().toLowerCase() !== "pakistan") {
      setError("Cash on Delivery is only available for addresses in Pakistan.");
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

      if (paymentMethod === "cod") {
        const result = await callEdgeFunction<CheckoutResponse>("cod-order", {
          items: cartLines,
          shipping: shippingPayload,
        });
        clearCart();
        router.push(`/order-confirmation/?order_id=${result.order_id}&cod=1`);
        return;
      }

      // jazzcash / safepay — mock local gateway template
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
        <p className="text-neutral-500">Your cart is empty, so there&apos;s nothing to check out yet.</p>
        <button
          type="button"
          onClick={() => router.push("/shop")}
          className="inline-flex h-11 items-center justify-center bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-85"
        >
          Browse the shop
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-12 lg:grid-cols-5">
      {/* Left: shipping details */}
      <section className="lg:col-span-3" aria-labelledby="shipping-heading">
        <h2 id="shipping-heading" className="font-display text-2xl font-medium tracking-tight">
          Delivery
        </h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" type="tel" required value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" required value={shipping.country} onChange={(e) => setShipping({ ...shipping, country: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address1">Address line 1</Label>
            <Input id="address1" required value={shipping.address_line1} onChange={(e) => setShipping({ ...shipping, address_line1: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address2">Address line 2 (optional)</Label>
            <Input id="address2" value={shipping.address_line2} onChange={(e) => setShipping({ ...shipping, address_line2: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" required value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
          </div>
        </div>
      </section>

      {/* Right: payment + summary */}
      <section className="lg:col-span-2" aria-labelledby="payment-heading">
        <div className="lg:sticky lg:top-24">
          <h2 id="payment-heading" className="font-display text-2xl font-medium tracking-tight">
            Payment
          </h2>

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
                      : "border-border bg-background hover:border-foreground/40",
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
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <option.icon className="h-4 w-4 text-neutral-400" strokeWidth={1.75} aria-hidden />
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-neutral-500">
                      {option.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-8 border-t border-border pt-6">
            <dl className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-neutral-500">Subtotal</dt>
                <dd className="font-medium tabular-nums">{formatMoney(subtotalMinor, currency)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-neutral-500">Shipping</dt>
                <dd className="text-neutral-400">Calculated at checkout</dd>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <dt className="font-medium">Total</dt>
                <dd className="text-lg font-medium tabular-nums">{formatMoney(subtotalMinor, currency)}</dd>
              </div>
            </dl>
          </div>

          {notice && (
            <p className="mt-5 rounded-sm border border-foreground/15 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
              {notice}
            </p>
          )}
          {error && (
            <p className="mt-5 rounded-sm border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 bg-foreground text-sm font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Placing order…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" aria-hidden /> Place order · {formatMoney(subtotalMinor, currency)}
              </>
            )}
          </button>
          <p className="mt-4 text-center text-xs text-neutral-400">
            Secure checkout · Stripe for international cards · COD across Pakistan
          </p>
        </div>
      </section>

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
