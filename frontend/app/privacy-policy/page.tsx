// frontend/app/privacy-policy/page.tsx

import type { Metadata } from "next";
import PolicyLayout, { PolicySection } from "@/components/layout/PolicyLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How SDB WEAR collects, uses, and protects your personal information. Learn about your privacy rights and our data practices.",
  openGraph: {
    title: "Privacy Policy · SDB WEAR",
    description:
      "SDB WEAR privacy policy — how we handle your data, cookies, payments, and account information.",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyLayout eyebrow="Legal" title="Privacy Policy">
      <p className="text-[13px] text-neutral-400">
        Last updated: [DATE]
      </p>

      <PolicySection title="1. Introduction">
        <p>
          SDB WEAR (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy. This Privacy Policy explains how we
          collect, use, disclose, and safeguard your information when you visit our website and
          purchase our products.
        </p>
        <p>
          By using our website, you agree to the collection and use of information in accordance
          with this policy. If you do not agree, please discontinue use of the site.
        </p>
      </PolicySection>

      <PolicySection title="2. Information we collect">
        <p>We collect information you provide directly and information collected automatically.</p>

        <h3 className="mt-4 text-[13px] font-semibold text-foreground">Information you provide</h3>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li><strong>Account information:</strong> email address, full name, and phone number when you create an account.</li>
          <li><strong>Contact information:</strong> details you submit through our contact forms or customer support.</li>
          <li><strong>Shipping information:</strong> delivery address, city, and postal details required to fulfil your order.</li>
          <li><strong>Order information:</strong> products you purchase, quantities, and order history.</li>
          <li><strong>Payment information:</strong> payment is processed through Stripe. We do not store your card details on our servers.</li>
        </ul>

        <h3 className="mt-4 text-[13px] font-semibold text-foreground">Information collected automatically</h3>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li><strong>Device/browser information:</strong> browser type, operating system, and device characteristics.</li>
          <li><strong>Usage data:</strong> pages visited, time spent on pages, and navigation patterns on our site.</li>
          <li><strong>IP address:</strong> approximate location derived from your IP address for fraud prevention and service delivery.</li>
        </ul>
      </PolicySection>

      <PolicySection title="3. How we use your information">
        <p>We use collected information for the following purposes:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li>Processing and fulfilling your orders, including payment processing and delivery.</li>
          <li>Creating and managing your customer account.</li>
          <li>Providing customer support and responding to your inquiries.</li>
          <li>Preventing fraud and maintaining the security of our website and transactions.</li>
          <li>Improving our website, products, and services.</li>
          <li>Communicating with you about orders, account updates, and (with your consent) marketing.</li>
        </ul>
      </PolicySection>

      <PolicySection title="4. Third-party services">
        <p>We use the following third-party services in connection with our operations:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li><strong>Supabase:</strong> backend infrastructure for database, authentication, and server-side logic.</li>
          <li><strong>Stripe:</strong> payment processing for international card transactions (USD). Stripe&apos;s own privacy policy governs how they handle payment data.</li>
          <li><strong>GitHub Pages:</strong> static website hosting.</li>
        </ul>
        <p>
          These services may collect data as part of their operation. We encourage you to review
          their respective privacy policies.
        </p>
      </PolicySection>

      <PolicySection title="5. Cookies">
        <p>
          Our website uses essential cookies and local storage for core functionality — including
          authentication sessions, shopping cart state, and currency preferences. We do not use
          third-party advertising cookies or analytics tracking scripts.
        </p>
        <p>
          For full details, see our{" "}
          <a href="/cookie-policy" className="underline underline-offset-2 transition-colors hover:text-foreground">
            Cookie Policy
          </a>.
        </p>
      </PolicySection>

      <PolicySection title="6. Data retention">
        <p>
          We retain your account and order information for as long as your account is active or
          as needed to provide you services. Order records are retained for [DATA RETENTION PERIOD —
          BUSINESS TO CONFIRM] to comply with legal, tax, and accounting obligations.
        </p>
        <p>
          You may request deletion of your account data by contacting us at [PRIVACY EMAIL].
        </p>
      </PolicySection>

      <PolicySection title="7. Data security">
        <p>
          We implement commercially reasonable security measures to protect your personal
          information. However, no method of transmission over the Internet or electronic storage
          is 100% secure, and we cannot guarantee absolute security.
        </p>
      </PolicySection>

      <PolicySection title="8. Your rights">
        <p>Depending on your location, you may have the right to:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li>Access the personal information we hold about you.</li>
          <li>Request correction of inaccurate data.</li>
          <li>Request deletion of your personal data.</li>
          <li>Opt out of marketing communications at any time.</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at [PRIVACY EMAIL].
        </p>
      </PolicySection>

      <PolicySection title="9. Children&apos;s privacy">
        <p>
          Our website is not intended for children under the age of 13 (or the applicable age of
          digital consent in your jurisdiction). We do not knowingly collect personal information
          from children.
        </p>
      </PolicySection>

      <PolicySection title="10. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. Changes will be posted on this page
          with an updated &quot;Last updated&quot; date. Your continued use of the site after changes
          are posted constitutes acceptance of the updated policy.
        </p>
      </PolicySection>

      <PolicySection title="11. Contact us">
        <p>
          For questions about this Privacy Policy or our data practices, contact us at:
        </p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li>Email: [PRIVACY EMAIL]</li>
          <li>Address: [BUSINESS ADDRESS]</li>
        </ul>
      </PolicySection>
    </PolicyLayout>
  );
}
