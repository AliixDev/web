// frontend/app/order-tracking/page.tsx

"use client";

import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import PolicyLayout from "@/components/layout/PolicyLayout";
import Reveal from "@/components/Reveal";

export default function OrderTrackingPage() {
  return (
    <PolicyLayout eyebrow="Help" title="Track your order">
      <p>
        You can track your order status and shipping details from your account. Sign in to view
        your order history, current orders, and tracking information.
      </p>

      {/* CTA */}
      <Reveal>
        <div className="mt-8 border border-neutral-100 p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center bg-neutral-100">
                <Package className="h-5 w-5 text-neutral-600" strokeWidth={1.25} aria-hidden />
              </span>
              <div>
                <p className="text-[13px] font-medium">View your orders</p>
                <p className="mt-0.5 text-[12px] text-neutral-500">
                  Sign in to see order status and tracking details.
                </p>
              </div>
            </div>
            <Link
              href="/account"
              className="btn-press inline-flex h-10 items-center gap-2 bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
            >
              My orders <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <section className="mt-10">
          <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
            How tracking works
          </h2>
          <div className="mt-3 space-y-3 text-[13px] leading-[1.7] text-neutral-600">
            <p>
              <strong>1. Order placed</strong> — you&apos;ll receive an order confirmation email with
              your order details.
            </p>
            <p>
              <strong>2. Order processed</strong> — we prepare your items for shipment. You&apos;ll
              receive a notification once dispatched.
            </p>
            <p>
              <strong>3. In transit</strong> — your order is on its way. Tracking details (where
              available) are included in your shipping confirmation.
            </p>
            <p>
              <strong>4. Delivered</strong> — your order has arrived. For Cash on Delivery orders,
              have your payment ready.
            </p>
          </div>
        </section>
      </Reveal>

      <Reveal delay={100}>
        <section className="mt-10">
          <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
            Didn&apos;t receive your order?
          </h2>
          <p className="mt-3 text-[13px] leading-[1.7] text-neutral-600">
            If your order appears delayed or you haven&apos;t received a shipping confirmation,
            contact us with your order number and we&apos;ll look into it right away.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Contact support <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </section>
      </Reveal>
    </PolicyLayout>
  );
}
