// frontend/components/CheckoutForm.tsx
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { callEdgeFunction, supabase } from "@/lib/supabaseClient";
import { formatMoney } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const cartLines = cart.map((item) => ({
    product_id: item.product_id,
    variant_id: item.variant_id,
    quantity: item.quantity,
  }));

  async function ensureSignedIn(): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) return true;

    const email = window.prompt(
      "Enter your email to sign in and place this order (we'll send a magic link):",
    );
    if (!email) return false;
    const { error: signInError } = await supabase.auth.signInWithOtp({ email });
    if (signInError) {
      setError(signInError.message);
      return false;
    }
    window.alert("Check your email for a sign-in link, then submit the order again.");
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

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Shipping details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
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
              required
              value={shipping.phone}
              onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address1">Address line 1</Label>
            <Input
              id="address1"
              required
              value={shipping.address_line1}
              onChange={(e) => setShipping({ ...shipping, address_line1: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address2">Address line 2 (optional)</Label>
            <Input
              id="address2"
              value={shipping.address_line2}
              onChange={(e) => setShipping({ ...shipping, address_line2: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                required
                value={shipping.city}
                onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                required
                value={shipping.country}
                onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment method</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currency === "PKR" && (
            <>
              <PaymentOption
                id="cod"
                label="Cash on Delivery"
                description="Pay in cash when your order arrives (Pakistan only)."
                selected={paymentMethod === "cod"}
                onSelect={() => setPaymentMethod("cod")}
              />
              <PaymentOption
                id="jazzcash"
                label="JazzCash"
                description="Mobile wallet payment (mock/template integration)."
                selected={paymentMethod === "jazzcash"}
                onSelect={() => setPaymentMethod("jazzcash")}
              />
              <PaymentOption
                id="safepay"
                label="Safepay"
                description="Card / bank payment via Safepay (mock/template integration)."
                selected={paymentMethod === "safepay"}
                onSelect={() => setPaymentMethod("safepay")}
              />
            </>
          )}
          {currency === "USD" && (
            <PaymentOption
              id="stripe"
              label="Credit / Debit Card (Stripe)"
              description="Secure international checkout powered by Stripe."
              selected={paymentMethod === "stripe"}
              onSelect={() => setPaymentMethod("stripe")}
            />
          )}

          <div className="flex items-center justify-between border-t border-border pt-4 text-sm">
            <span className="text-muted-foreground">Items subtotal</span>
            <span className="font-semibold">{formatMoney(subtotalMinor, currency)}</span>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Placing order..." : "Place order"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}

function PaymentOption({
  id,
  label,
  description,
  selected,
  onSelect,
}: {
  id: string;
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-md border p-3 text-left transition-colors ${
        selected ? "border-primary bg-accent" : "border-input hover:bg-accent/50"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`h-4 w-4 shrink-0 rounded-full border-2 ${
            selected ? "border-primary bg-primary" : "border-input"
          }`}
        />
        <span className="font-medium">{label}</span>
      </div>
      <p className="ml-6 text-xs text-muted-foreground">{description}</p>
    </button>
  );
}
