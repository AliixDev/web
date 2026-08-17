// frontend/app/shipping-policy/page.tsx

import type { Metadata } from "next";
import PolicyLayout, { PolicySection } from "@/components/layout/PolicyLayout";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description:
    "SDB WEAR shipping policy — methods, processing times, delivery estimates, and shipping information.",
  openGraph: {
    title: "Shipping Policy · SDB WEAR",
    description: "SDB WEAR shipping policy — methods, processing, delivery, and tracking information.",
    type: "website",
  },
};

export default function ShippingPolicyPage() {
  return (
    <PolicyLayout eyebrow="Legal" title="Shipping Policy">
      <p className="text-[13px] text-neutral-400">
        Last updated: [DATE]
      </p>

      <PolicySection title="1. Shipping methods">
        <p>We offer the following shipping options:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li>
            <strong>Cash on Delivery (COD):</strong> available for delivery addresses within
            Pakistan. Payment is collected upon delivery.
          </li>
          <li>
            <strong>Standard / Express shipping (international):</strong> available for orders
            placed with credit or debit card via Stripe (USD).
          </li>
        </ul>
        <p>
          Available shipping methods and rates are displayed at checkout based on your delivery
          address.
        </p>
      </PolicySection>

      <PolicySection title="2. Processing time">
        <p>
          Orders are typically processed within [PROCESSING TIME — BUSINESS TO CONFIRM] business
          days. Processing times may be longer during peak seasons or promotional periods.
        </p>
        <p>
          You will receive an order confirmation email once your order is placed and a shipping
          confirmation once it has been dispatched.
        </p>
      </PolicySection>

      <PolicySection title="3. Estimated delivery">
        <p>
          [ESTIMATED DELIVERY TIMES — BUSINESS TO CONFIRM, e.g., domestic Pakistan: X–Y business
          days; international: X–Y business days.]
        </p>
        <p>
          These are estimates only and are not guaranteed. Delivery times may vary depending on
          your location, carrier, and customs processing.
        </p>
      </PolicySection>

      <PolicySection title="4. Domestic shipping (Pakistan)">
        <p>
          Cash on Delivery is available across Pakistan. Standard delivery within major cities
          typically takes [DOMESTIC DELIVERY TIME — BUSINESS TO CONFIRM] business days.
        </p>
      </PolicySection>

      <PolicySection title="5. International shipping">
        <p>
          We ship internationally to [SHIPPING REGIONS — BUSINESS TO CONFIRM]. International
          orders are processed and shipped via our logistics partners.
        </p>
      </PolicySection>

      <PolicySection title="6. Shipping charges">
        <p>
          Shipping charges are calculated at checkout based on your delivery address, order
          weight, and selected shipping method. Exact shipping costs are displayed before you
          confirm your order.
        </p>
      </PolicySection>

      <PolicySection title="7. Order tracking">
        <p>
          Once your order has been shipped, you will receive a shipping confirmation with
          tracking details (where available). You can also check your order status through your
          account or by contacting us.
        </p>
        <p>
          For more details, visit our{" "}
          <a href="/order-tracking" className="underline underline-offset-2 transition-colors hover:text-foreground">
            order tracking
          </a>{" "}
          page.
        </p>
      </PolicySection>

      <PolicySection title="8. Delayed shipments">
        <p>
          If your order is significantly delayed beyond the estimated delivery window, please
          contact us at [PRIVACY EMAIL] so we can investigate with the shipping carrier.
        </p>
      </PolicySection>

      <PolicySection title="9. Lost or damaged shipments">
        <p>
          If your package appears to be lost or arrives damaged, please contact us within{" "}
          [CLAIM WINDOW — BUSINESS TO CONFIRM] of the expected delivery date. Include your
          order number and any relevant details. We will work with the carrier to resolve the
          issue.
        </p>
      </PolicySection>

      <PolicySection title="10. Incorrect shipping addresses">
        <p>
          It is your responsibility to ensure the shipping address is correct at the time of
          order. We are not responsible for orders shipped to incorrectly provided addresses.
          If you need to change your shipping address, contact us immediately before the order
          is dispatched.
        </p>
      </PolicySection>

      <PolicySection title="11. Customs and import duties">
        <p>
          For international orders, your shipment may be subject to customs duties, taxes, or
          fees imposed by your country. These charges are your responsibility and are not
          included in the product price or shipping cost. We recommend checking with your local
          customs office for more information.
        </p>
      </PolicySection>

      <PolicySection title="12. Contact">
        <p>
          For shipping questions, contact us at [PRIVACY EMAIL].
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
