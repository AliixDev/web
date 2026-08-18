// frontend/app/return-policy/page.tsx

import type { Metadata } from "next";
import PolicyLayout, { PolicySection } from "@/components/layout/PolicyLayout";

export const metadata: Metadata = {
  title: "Return Policy",
  description:
    "How to return products purchased from SDB WEAR. Learn about eligibility, process, and conditions for returns.",
  openGraph: {
    title: "Return Policy · SDB WEAR",
    description: "SDB WEAR return policy — eligibility, process, and conditions for returning products.",
    type: "website",
  },
};

export default function ReturnPolicyPage() {
  return (
    <PolicyLayout eyebrow="Legal" title="Return Policy">
      <p className="text-[13px] text-neutral-400">
        Last updated: [DATE]
      </p>

      <PolicySection title="1. Eligibility for returns">
        <p>
          You may be eligible to return a product if it meets the following conditions:
        </p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li>The item is in its original, unused, and unworn condition.</li>
          <li>All original tags, labels, and packaging are intact.</li>
          <li>The return request is made within [RETURN WINDOW — BUSINESS TO CONFIRM] of delivery.</li>
          <li>The item is not listed as a non-returnable product (see Section 6).</li>
        </ul>
      </PolicySection>

      <PolicySection title="2. How to request a return">
        <p>
          To initiate a return, contact us at [PRIVACY EMAIL] or through our{" "}
          <a href="/contact" className="underline underline-offset-2 transition-colors hover:text-foreground">
            contact page
          </a>{" "}
          with the following information:
        </p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li>Your order number.</li>
          <li>The item(s) you wish to return.</li>
          <li>The reason for the return.</li>
        </ul>
        <p>
          We will provide a return authorization and instructions on how to send the item back.
          Please do not send items back without a return authorization.
        </p>
      </PolicySection>

      <PolicySection title="3. Return shipping">
        <p>
          [RETURN SHIPPING RESPONSIBILITY — BUSINESS TO CONFIRM: who pays for return shipping
          in different scenarios, e.g., damaged items vs. change of mind.]
        </p>
        <p>
          We recommend using a trackable shipping method. We are not responsible for return
          packages that are lost or damaged in transit.
        </p>
      </PolicySection>

      <PolicySection title="4. Damaged, defective, or incorrect products">
        <p>
          If you receive a damaged, defective, or incorrect item, contact us within{" "}
          [REPORTING WINDOW — BUSINESS TO CONFIRM] of delivery. Please include:
        </p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li>Your order number.</li>
          <li>Photos of the damage, defect, or incorrect item.</li>
          <li>A description of the issue.</li>
        </ul>
        <p>
          We will arrange a replacement or full refund at no additional cost to you.
        </p>
      </PolicySection>

      <PolicySection title="5. Refund processing">
        <p>
          Once we receive and inspect your returned item, we will notify you of the refund
          decision. Approved refunds are processed within [REFUND PROCESSING TIME — BUSINESS TO
          CONFIRM] to the original payment method.
        </p>

      </PolicySection>

      <PolicySection title="6. Non-returnable items">
        <p>The following items may not be eligible for return:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li>Items that have been worn, washed, altered, or damaged by the customer.</li>
          <li>Items without original tags or packaging.</li>
          <li>[NON-RETURNABLE CATEGORIES — BUSINESS TO CONFIRM, e.g., personalized items, underwear, sale items].</li>
        </ul>
      </PolicySection>

      <PolicySection title="7. Exchanges">
        <p>
          [EXCHANGE POLICY — BUSINESS TO CONFIRM: whether exchanges are supported, and the
          process for requesting one.]
        </p>
      </PolicySection>

      <PolicySection title="8. Contact">
        <p>
          For return-related questions, contact us at:
        </p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li>Email: [PRIVACY EMAIL]</li>
          <li>Contact page: <a href="/contact" className="underline underline-offset-2 transition-colors hover:text-foreground">/contact</a></li>
        </ul>
      </PolicySection>
    </PolicyLayout>
  );
}
