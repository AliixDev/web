// frontend/app/order-confirmation/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

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
    supabase
      .from("orders")
      .select("id, status, payment_method, payment_status, total_minor, currency")
      .eq("id", orderId)
      .single()
      .then(({ data }) => {
        setOrder(data as OrderSummary | null);
        setLoading(false);
      });
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">No order reference found.</p>
        <Button asChild className="mt-4">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-12 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
      <h1 className="text-2xl font-bold">Thank you for your order!</h1>
      <p className="text-muted-foreground">
        Order reference: <span className="font-mono text-foreground">{orderId}</span>
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading order details...</p>
      ) : order ? (
        <div className="rounded-lg border border-border p-4 text-left text-sm">
          <p>
            <span className="text-muted-foreground">Status:</span> {order.status}
          </p>
          <p>
            <span className="text-muted-foreground">Payment method:</span> {order.payment_method}
          </p>
          <p>
            <span className="text-muted-foreground">Payment status:</span> {order.payment_status}
          </p>
        </div>
      ) : isCod ? (
        <p className="text-sm text-muted-foreground">
          Your Cash on Delivery order has been placed. Pay in cash when it arrives.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load this order&apos;s details, but your reference number above is saved.
        </p>
      )}

      <Button asChild size="lg">
        <Link href="/">Continue shopping</Link>
      </Button>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-muted-foreground">Loading...</div>}>
      <OrderConfirmationContent />
    </Suspense>
  );
}
