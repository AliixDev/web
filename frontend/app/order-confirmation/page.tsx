// frontend/app/order-confirmation/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { getSupabase } from "@/lib/supabaseClient";

interface OrderSummary {
  id: string;
  status: string;
  payment_method: string;
  payment_status: string;
  total_minor: number;
  currency: string;
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const { data } = await getSupabase()
          .from("orders")
          .select("id, status, payment_method, payment_status, total_minor, currency")
          .eq("id", orderId)
          .single();
        setOrder(data as OrderSummary | null);
      } catch {
        // order stays null — fallback copy is shown
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="container flex flex-col items-center gap-5 py-28 text-center">
        <p className="text-neutral-600">No order reference was found.</p>
        <Link
          href="/"
          className="btn-press inline-flex h-11 items-center justify-center bg-foreground px-6 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
        >
          Return home
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-16 md:py-24">
      <div className="mx-auto max-w-md text-center">
        <div className="animate-scale-in mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-foreground">
          <CheckCircle2 className="h-8 w-8 text-background" strokeWidth={1.5} aria-hidden />
        </div>
        <h1 className="mt-7 font-display text-4xl font-light tracking-tight">Thank you for your order</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-neutral-600">
          Your order reference is{" "}
          <span className="font-mono text-[13px] text-foreground">{orderId}</span>
        </p>

        <div className="mt-10 space-y-4 text-left">
          {loading ? (
            <div className="space-y-3" aria-label="Loading order details">
              <div className="skeleton h-10" />
              <div className="skeleton h-10" />
              <div className="skeleton h-10" />
            </div>
          ) : order ? (
            <>
              <dl className="divide-y divide-neutral-100 border-y border-neutral-100 text-[13px]">
                <div className="flex items-center justify-between py-3.5">
                  <dt className="text-neutral-600">Status</dt>
                  <dd className="font-medium capitalize">{order.status.replace("_", " ")}</dd>
                </div>
                <div className="flex items-center justify-between py-3.5">
                  <dt className="text-neutral-600">Payment method</dt>
                  <dd className="font-medium capitalize">{order.payment_method}</dd>
                </div>
                <div className="flex items-center justify-between py-3.5">
                  <dt className="text-neutral-600">Payment status</dt>
                  <dd className="font-medium capitalize">{order.payment_status.replace("_", " ")}</dd>
                </div>
              </dl>
              <ol className="space-y-3 border border-neutral-200 bg-neutral-50 px-5 py-5">
                {[
                  "We've received your order and are preparing it.",
                  order.payment_method === "cod"
                    ? "Payment is collected when your order arrives."
                    : "Your payment is being confirmed. You'll receive a confirmation once it clears.",
                  "Track your order anytime from your account.",
                ].map((step, index) => (
                  <li key={step} className="flex items-start gap-3 text-[13px] leading-relaxed text-neutral-700">
                    <span className="mt-px font-display text-sm font-light text-neutral-400" aria-hidden>
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="border border-neutral-200 bg-neutral-50 px-5 py-4 text-[13px] leading-relaxed text-neutral-700">
              We couldn&apos;t load this order&apos;s details, but your reference number above is saved.
            </p>
          )}
        </div>

        <Link
          href="/shop"
          className="btn-press mt-10 inline-flex h-12 items-center gap-2 bg-foreground px-7 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
        >
          Continue shopping <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex justify-center py-28">
          <div className="skeleton h-6 w-40" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
