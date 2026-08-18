// frontend/app/terms/page.tsx

import type { Metadata } from "next";
import PolicyLayout, { PolicySection } from "@/components/layout/PolicyLayout";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms and conditions governing your use of the SDB WEAR website, purchases, and services.",
  openGraph: {
    title: "Terms & Conditions · SDB WEAR",
    description:
      "Read the terms and conditions for using SDB WEAR, placing orders, and accessing our services.",
    type: "website",
  },
};

export default function TermsPage() {
  return (
    <PolicyLayout eyebrow="Legal" title="Terms & Conditions">
      <p className="text-[13px] text-neutral-400">
        Last updated: [DATE]
      </p>

      <PolicySection title="1. Acceptance of terms">
        <p>
          By accessing or using the SDB WEAR website (&quot;the site&quot;), you agree to be bound by these
          Terms &amp; Conditions. If you do not agree to these terms, please do not use the site.
        </p>
      </PolicySection>

      <PolicySection title="2. Account registration">
        <p>
          You may be required to create an account to place orders. You are responsible for
          maintaining the confidentiality of your account credentials and for all activities
          that occur under your account. You agree to provide accurate and complete information
          when creating your account.
        </p>
      </PolicySection>

      <PolicySection title="3. Products and pricing">
        <p>
          All product descriptions, images, and specifications are provided as accurately as
          possible. However, we do not warrant that product descriptions or pricing on the site
          are error-free, complete, or current.
        </p>
        <p>
          Prices displayed on the site are verified server-side at the time of checkout. Prices
          are shown in USD or PKR depending on your selected currency. We reserve the right to
          modify prices at any time without prior notice.
        </p>
        <p>
          In the event of a pricing error, we reserve the right to cancel any orders placed at
          the incorrect price and issue a full refund.
        </p>
      </PolicySection>

      <PolicySection title="4. Orders and acceptance">
        <p>
          Placing an order on the site constitutes an offer to purchase. All orders are subject
          to acceptance and availability. We reserve the right to refuse or cancel any order for
          any reason, including but not limited to product availability, pricing errors, or
          suspected fraudulent activity.
        </p>
        <p>
          An order is considered accepted when we send you an order confirmation. Until then, we
          may cancel the order without liability.
        </p>
      </PolicySection>

      <PolicySection title="5. Payment">
        <p>We accept the following payment methods:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li><strong>Credit / Debit Card via Stripe:</strong> available for international orders (USD).</li>
          <li><strong>JazzCash:</strong> available for select transactions.</li>
        </ul>
        <p>
          Payment is processed at the time of order placement. Card information is handled
          entirely by Stripe and is never stored on our servers.
        </p>
      </PolicySection>

      <PolicySection title="6. Shipping and delivery">
        <p>
          Shipping terms, estimated delivery times, and shipping charges are described in our{" "}
          <a href="/shipping-policy" className="underline underline-offset-2 transition-colors hover:text-foreground">
            Shipping Policy
          </a>.
        </p>
        <p>
          We are not responsible for delays caused by shipping carriers, customs processing, or
          events outside our control. Risk of loss and title for items pass to you upon delivery
          to the carrier.
        </p>
      </PolicySection>

      <PolicySection title="7. Returns and refunds">
        <p>
          Our return and refund policies are described in our{" "}
          <a href="/return-policy" className="underline underline-offset-2 transition-colors hover:text-foreground">
            Return Policy
          </a>{" "}
          and{" "}
          <a href="/refund-policy" className="underline underline-offset-2 transition-colors hover:text-foreground">
            Refund Policy
          </a>.
        </p>
      </PolicySection>

      <PolicySection title="8. Cancellations">
        <p>
          Order cancellation terms are described in our{" "}
          <a href="/cancellation-policy" className="underline underline-offset-2 transition-colors hover:text-foreground">
            Cancellation Policy
          </a>.
        </p>
      </PolicySection>

      <PolicySection title="9. Intellectual property">
        <p>
          All content on this site — including text, graphics, logos, images, product descriptions,
          and software — is the property of SDB WEAR or its content suppliers and is protected by
          applicable intellectual property laws. You may not reproduce, distribute, modify, or
          create derivative works from any content on this site without our prior written consent.
        </p>
      </PolicySection>

      <PolicySection title="10. Prohibited use">
        <p>You agree not to:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li>Use the site for any unlawful purpose.</li>
          <li>Attempt to gain unauthorized access to any part of the site or its systems.</li>
          <li>Interfere with or disrupt the site&apos;s operation.</li>
          <li>Use automated systems to access the site without our written permission.</li>
          <li>Resell or commercially exploit any content from the site.</li>
        </ul>
      </PolicySection>

      <PolicySection title="11. Limitation of liability">
        <p>
          To the fullest extent permitted by law, SDB WEAR shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages arising from your use of the
          site or purchase of products. Our total liability for any claim shall not exceed the
          amount you paid for the product giving rise to the claim.
        </p>
      </PolicySection>

      <PolicySection title="12. Third-party services">
        <p>
          Our site integrates with third-party services (Supabase, Stripe, GitHub Pages) for
          functionality such as authentication, payment processing, and hosting. We are not
          responsible for the practices of these third parties. Their use is governed by their
          own terms and policies.
        </p>
      </PolicySection>

      <PolicySection title="13. Changes to these terms">
        <p>
          We reserve the right to update these Terms &amp; Conditions at any time. Changes will
          be effective upon posting to this page. Your continued use of the site after changes
          are posted constitutes acceptance of the revised terms.
        </p>
      </PolicySection>

      <PolicySection title="14. Contact">
        <p>
          If you have questions about these Terms &amp; Conditions, contact us at:
        </p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li>Email: [PRIVACY EMAIL]</li>
          <li>Address: [BUSINESS ADDRESS]</li>
        </ul>
      </PolicySection>
    </PolicyLayout>
  );
}
