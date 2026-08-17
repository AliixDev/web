// frontend/app/cancellation-policy/page.tsx

import type { Metadata } from "next";
import PolicyLayout, { PolicySection } from "@/components/layout/PolicyLayout";

export const metadata: Metadata = {
  title: "Cancellation Policy",
  description:
    "How to cancel an order at SDB WEAR. Learn about cancellation eligibility, process, and refund handling.",
  openGraph: {
    title: "Cancellation Policy · SDB WEAR",
    description:
      "SDB WEAR cancellation policy — how and when you can cancel an order.",
    type: "website",
  },
};

export default function CancellationPolicyPage() {
  return (
    <PolicyLayout eyebrow="Legal" title="Cancellation Policy">
      <p className="text-[13px] text-neutral-400">
        Last updated: [DATE]
      </p>

      <PolicySection title="1. When you can cancel">
        <p>
          You may cancel your order if it has not yet been dispatched for shipping. Orders can
          typically be cancelled within [CANCELLATION WINDOW — BUSINESS TO CONFIRM] of placing
          the order.
        </p>
      </PolicySection>

      <PolicySection title="2. How to request a cancellation">
        <p>
          To cancel an order, contact us as soon as possible using one of the following methods:
        </p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li>
            Email us at [PRIVACY EMAIL] with your order number and a request to cancel.
          </li>
          <li>
            Use our{" "}
            <a href="/contact" className="underline underline-offset-2 transition-colors hover:text-foreground">
              contact page
            </a>{" "}
            to submit a cancellation request.
          </li>
        </ul>
        <p>
          We will confirm whether the order can be cancelled based on its current status.
        </p>
      </PolicySection>

      <PolicySection title="3. Orders already shipped">
        <p>
          If your order has already been dispatched, it cannot be cancelled. In this case, you
          may return the item(s) once delivered in accordance with our{" "}
          <a href="/return-policy" className="underline underline-offset-2 transition-colors hover:text-foreground">
            Return Policy
          </a>.
        </p>
      </PolicySection>

      <PolicySection title="4. Custom or personalized orders">
        <p>
          [CUSTOM ORDER CANCELLATION TERMS — BUSINESS TO CONFIRM: whether custom/personalized
          orders can be cancelled and under what conditions.]
        </p>
      </PolicySection>

      <PolicySection title="5. Refund for cancelled orders">
        <p>
          If your cancellation is approved, a full refund will be issued to your original payment
          method within [REFUND PROCESSING TIME — BUSINESS TO CONFIRM].
        </p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li>
            <strong>Credit / Debit Card:</strong> refund issued to the original card.
          </li>
          <li>
            <strong>Cash on Delivery:</strong> [COD CANCELLATION REFUND METHOD — BUSINESS TO CONFIRM].
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="6. Contact">
        <p>
          For cancellation requests or questions, contact us at [PRIVACY EMAIL].
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
