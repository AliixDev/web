// frontend/app/refund-policy/page.tsx

import type { Metadata } from "next";
import PolicyLayout, { PolicySection } from "@/components/layout/PolicyLayout";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "How refunds work at SDBBUY. Learn about refund eligibility, processing times, and methods.",
  openGraph: {
    title: "Refund Policy · SDBBUY",
    description: "SDBBUY refund policy — eligibility, processing times, and refund methods.",
    type: "website",
  },
};

export default function RefundPolicyPage() {
  return (
    <PolicyLayout eyebrow="Legal" title="Refund Policy">
      <p className="text-[13px] text-neutral-400">
        Last updated: [DATE]
      </p>

      <PolicySection title="1. When a refund is issued">
        <p>Refunds may be issued in the following situations:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li>An order is cancelled before shipment.</li>
          <li>A returned item is received and approved after inspection.</li>
          <li>A product is damaged, defective, or incorrect and a replacement is not desired.</li>
          <li>An order could not be fulfilled due to stock unavailability.</li>
        </ul>
      </PolicySection>

      <PolicySection title="2. Refund eligibility">
        <p>
          To be eligible for a refund, the returned item must meet the conditions outlined in
          our{" "}
          <a href="/return-policy" className="underline underline-offset-2 transition-colors hover:text-foreground">
            Return Policy
          </a>.
        </p>
        <p>
          Items that do not meet these conditions may not be eligible for a full refund.
        </p>
      </PolicySection>

      <PolicySection title="3. Refund processing time">
        <p>
          Once your return is received and inspected, we will notify you of the refund decision.
          Approved refunds are processed within [REFUND PROCESSING TIME — BUSINESS TO CONFIRM].
        </p>
        <p>
          Please note that your bank or card issuer may require additional time to reflect the
          refund in your account.
        </p>
      </PolicySection>

      <PolicySection title="4. Refund methods">
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>Credit / Debit Card (Stripe):</strong> refunds are issued to the original
            payment card.
          </li>
          <li>
            <strong>Cash on Delivery:</strong> refunds for COD orders are issued via [COD REFUND
            METHOD — BUSINESS TO CONFIRM].
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="5. Partial refunds">
        <p>
          Partial refunds may be issued in cases where an item is returned in a condition that
          does not meet the full return requirements (e.g., missing tags, minor wear, or missing
          original packaging).
        </p>
      </PolicySection>

      <PolicySection title="6. Late or missing refunds">
        <p>
          If you haven&apos;t received a refund within the expected timeframe:
        </p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li>Check your bank or card statement again.</li>
          <li>Contact your bank or card issuer — processing times vary.</li>
          <li>If you&apos;ve done both and still haven&apos;t received your refund, contact us at [PRIVACY EMAIL].</li>
        </ul>
      </PolicySection>

      <PolicySection title="7. Contact">
        <p>
          For refund-related questions, contact us at [PRIVACY EMAIL].
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
