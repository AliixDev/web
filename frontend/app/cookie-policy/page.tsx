// frontend/app/cookie-policy/page.tsx

import type { Metadata } from "next";
import PolicyLayout, { PolicySection } from "@/components/layout/PolicyLayout";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How SDBBUY uses cookies and local storage. Learn about essential cookies, session management, and your choices.",
  openGraph: {
    title: "Cookie Policy · SDBBUY",
    description:
      "SDBBUY cookie policy — essential cookies, authentication, cart, and local storage usage.",
    type: "website",
  },
};

export default function CookiePolicyPage() {
  return (
    <PolicyLayout eyebrow="Legal" title="Cookie Policy">
      <p className="text-[13px] text-neutral-400">
        Last updated: [DATE]
      </p>

      <PolicySection title="1. Overview">
        <p>
          This policy explains how SDBBUY uses cookies, local storage, and similar technologies
          when you visit our website. We use these technologies to provide essential site
          functionality — not for advertising or third-party analytics tracking.
        </p>
      </PolicySection>

      <PolicySection title="2. Essential cookies and storage">
        <p>Our website uses the following essential cookies and local storage mechanisms:</p>

        <h3 className="mt-4 text-[13px] font-semibold text-foreground">Authentication (Supabase Auth)</h3>
        <p className="mt-1">
          When you sign in, Supabase stores session tokens as cookies to maintain your
          authenticated state. These cookies are strictly necessary for login functionality and
          expire according to Supabase&apos;s session configuration.
        </p>

        <h3 className="mt-4 text-[13px] font-semibold text-foreground">Shopping cart (localStorage)</h3>
        <p className="mt-1">
          Your cart contents and currency preference are stored in your browser&apos;s local storage
          under the key <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[12px]">storefront-cart-v1</code>. This
          is used to persist your cart across page reloads and is not sent to any third party.
        </p>

        <h3 className="mt-4 text-[13px] font-semibold text-foreground">Currency preference (Zustand persist)</h3>
        <p className="mt-1">
          Your selected currency (USD or PKR) is stored in local storage as part of the cart
          state, ensuring your preference is remembered across visits.
        </p>

        <h3 className="mt-4 text-[13px] font-semibold text-foreground">Recent searches (localStorage)</h3>
        <p className="mt-1">
          Your recent search terms are stored in local storage to improve your search experience.
          This data stays in your browser and is never transmitted externally.
        </p>
      </PolicySection>

      <PolicySection title="3. What we do not use">
        <p>We do not currently use:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1.5">
          <li>Google Analytics or any third-party analytics cookies.</li>
          <li>Meta Pixel or advertising tracking cookies.</li>
          <li>Social media tracking scripts.</li>
          <li>Retargeting or remarketing cookies.</li>
          <li>Any third-party advertising cookies.</li>
        </ul>
      </PolicySection>

      <PolicySection title="4. Third-party cookies">
        <p>
          <strong>Stripe:</strong> when you make a payment via Stripe, Stripe may set its own
          cookies as part of the payment process. These are governed by Stripe&apos;s privacy policy.
        </p>
        <p>
          No other third-party cookies are set by our website.
        </p>
      </PolicySection>

      <PolicySection title="5. Managing cookies">
        <p>
          You can control or delete cookies through your browser settings. Most browsers allow
          you to block or delete cookies. However, disabling essential cookies may impair site
          functionality — including login, cart, and currency preferences.
        </p>
        <p>
          For instructions, consult your browser&apos;s help documentation.
        </p>
      </PolicySection>

      <PolicySection title="6. Changes to this policy">
        <p>
          We may update this Cookie Policy as our cookie usage changes. Changes will be posted
          on this page with an updated &quot;Last updated&quot; date.
        </p>
      </PolicySection>

      <PolicySection title="7. Contact">
        <p>
          For questions about our cookie practices, contact us at [PRIVACY EMAIL].
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
