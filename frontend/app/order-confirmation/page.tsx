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
  const isCod = searchParams.get("cod") === "1";

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
        <p className="text-neutral-500">No order reference was found.</p>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-85"
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
        <h1 className="mt-7 font-display text-4xl font-light tracking-tight">
          Thank you for your order
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500">
          Your order reference is{" "}
          <span className="font-mono text-[13px] text-foreground">{orderId}</span>
        </p>

        <div className="mt-10 space-y-4 text-left">
          {loading ? (
            <div className="space-y-3" aria-label="Loading order details">
              <div className="h-10 animate-pulse bg-neutral-100" />
              <div className="h-10 animate-pulse bg-neutral-100" />
              <div className="h-10 animate-pulse bg-neutral-100" />
            </div>
          ) : order ? (
            <dl className="divide-y divide-border border-y border-border text-sm">
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-neutral-500">Status</dt>
                <dd className="font-medium capitalize">{order.status.replace("_", " ")}</dd>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-neutral-500">Payment method</dt>
                <dd className="font-medium capitalize">{order.payment_method}</dd>
              </div>
              <div className="flex items-center justify-between py-3.5">
                <dt className="text-neutral-500">Payment status</dt>
                <dd className="font-medium capitalize">{order.payment_status.replace("_", " ")}</dd>
              </div>
            </dl>
          ) : isCod ? (
            <p className="rounded-sm border border-border bg-neutral-50 px-5 py-4 text-sm leading-relaxed text-neutral-600">
              Your Cash on Delivery order has been placed — pay in cash when it arrives.
            </p>
          ) : (
            <p className="rounded-sm border border-border bg-neutral-50 px-5 py-4 text-sm leading-relaxed text-neutral-600">
              We couldn&apos;t load this order&apos;s details, but your reference number above is saved.
            </p>
          )}
        </div>

        <Link
          href="/shop"
          className="mt-10 inline-flex h-12 items-center gap-2 bg-foreground px-7 text-sm font-medium text-background transition-opacity hover:opacity-85"
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
          <div className="h-6 w-40 animate-pulse bg-neutral-100" />
        </div>
      }
    >
      <OrderConfirmationContent />
    </Suspense>
  );
}
