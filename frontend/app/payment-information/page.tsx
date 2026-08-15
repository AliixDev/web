// frontend/app/payment-information/page.tsx

import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import PolicyLayout, { PolicySection } from "@/components/layout/PolicyLayout";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Payment Information",
  description:
    "SDBBUY payment options — Cash on Delivery, Stripe card payments, JazzCash, and payment security details.",
  openGraph: {
    title: "Payment Information · SDBBUY",
    description: "Accepted payment methods and security information for SDBBUY orders.",
    type: "website",
  },
};

const PAYMENT_METHODS = [
  {
    name: "Cash on Delivery (COD)",
    description: "Pay in cash when your order arrives. Available for delivery addresses within Pakistan.",
    availability: "Pakistan",
  },
  {
    name: "Credit / Debit Card via Stripe",
    description: "Pay securely with Visa, Mastercard, or other major cards. Processed by Stripe in USD.",
    availability: "Worldwide",
  },
  {
    name: "JazzCash",
    description: "Pay via JazzCash mobile wallet for select transactions.",
    availability: "Pakistan",
  },
];

export default function PaymentInformationPage() {
  return (
    <PolicyLayout eyebrow="Help" title="Payment information">
      <PolicySection title="Accepted payment methods">
        <div className="mt-2 space-y-4">
          {PAYMENT_METHODS.map((method) => (
            <Reveal key={method.name}>
              <div className="border border-neutral-100 p-5 transition-colors hover:border-neutral-300">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium">{method.name}</p>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    {method.availability}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-[1.7] text-neutral-600">{method.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </PolicySection>

      <PolicySection title="Payment security">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" strokeWidth={1.25} aria-hidden />
          <div>
            <p className="text-[13px] font-medium">Stripe-secured card payments</p>
            <p className="mt-1 text-[13px] leading-[1.7] text-neutral-600">
              All card payments are processed by Stripe, a PCI-DSS Level 1 certified payment
              processor. Your card details are handled entirely by Stripe and are never stored on
              our servers.
            </p>
          </div>
        </div>
      </PolicySection>

      <PolicySection title="Pricing">
        <p>
          All prices displayed on the site are verified server-side at checkout. Prices are
          shown in USD or PKR based on your selected currency. The final amount charged matches
          the price confirmed at checkout — no hidden conversions or fees.
        </p>
      </PolicySection>

      <PolicySection title="Currency">
        <p>
          You can switch between USD and PKR using the currency toggle in the header. The
          storefront serves customers globally, and pricing is adjusted accordingly.
        </p>
      </PolicySection>

      <PolicySection title="Contact">
        <p>
          Payment-related questions?{" "}
          <a href="/contact" className="underline underline-offset-2 transition-colors hover:text-foreground">
            Contact us
          </a>{" "}
          and we&apos;ll assist you.
        </p>
      </PolicySection>
    </PolicyLayout>
  );
}
