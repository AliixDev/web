// frontend/app/faq/page.tsx

"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Reveal from "@/components/Reveal";

const FAQ_CATEGORIES = [
  {
    title: "Orders",
    items: [
      {
        q: "How do I place an order?",
        a: "Browse our shop, add products to your cart, and proceed to checkout. You can pay via Cash on Delivery (Pakistan) or credit/debit card via Stripe (worldwide).",
      },
      {
        q: "Can I change or cancel my order?",
        a: "Orders can be cancelled before they are dispatched. Contact us as soon as possible with your order number. See our Cancellation Policy for details.",
      },
      {
        q: "How do I check my order status?",
        a: "Sign in to your account and visit the My Orders page. You can also track your order from the order confirmation email.",
      },
    ],
  },
  {
    title: "Payments",
    items: [
      {
        q: "What payment methods do you accept?",
        a: "We accept Cash on Delivery (Pakistan), credit/debit cards via Stripe (USD, worldwide), and JazzCash.",
      },
      {
        q: "Is my payment information secure?",
        a: "Card payments are processed entirely by Stripe. We never store your card details on our servers.",
      },
      {
        q: "What currency will I be charged in?",
        a: "You can view prices in USD or PKR. Your selected currency is used for display, and the final charge is processed in the appropriate currency at checkout.",
      },
    ],
  },
  {
    title: "Shipping",
    items: [
      {
        q: "How long does shipping take?",
        a: "Processing and delivery times vary by location and shipping method. Domestic orders within Pakistan are typically delivered within [DOMESTIC DELIVERY TIME — BUSINESS TO CONFIRM]. International orders vary by destination.",
      },
      {
        q: "Do you ship internationally?",
        a: "Yes. We ship to [SHIPPING REGIONS — BUSINESS TO CONFIRM]. International orders are shipped via our logistics partners.",
      },
      {
        q: "How do I track my shipment?",
        a: "Once your order is dispatched, you will receive a shipping confirmation with tracking details where available. You can also check your order status in your account.",
      },
    ],
  },
  {
    title: "Returns & Refunds",
    items: [
      {
        q: "How do I return a product?",
        a: "Contact us within [RETURN WINDOW — BUSINESS TO CONFIRM] of delivery with your order number and reason for return. We will provide return instructions.",
      },
      {
        q: "When will I receive my refund?",
        a: "Refunds are processed within [REFUND PROCESSING TIME — BUSINESS TO CONFIRM] after we receive and inspect the returned item. The refund is issued to your original payment method.",
      },
      {
        q: "Can I exchange an item?",
        a: "Exchanges are handled on a case-by-case basis. Contact us to discuss available options.",
      },
    ],
  },
  {
    title: "Products & Sizing",
    items: [
      {
        q: "Where can I find sizing information?",
        a: "Visit our Size Guide for detailed measurements and sizing recommendations.",
      },
      {
        q: "Are your products authentic?",
        a: "Yes. All SDB WEAR products are designed and sourced by our team. We do not sell counterfeit or third-party branded goods.",
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        q: "Do I need an account to place an order?",
        a: "Yes. An account is required to place orders, track shipments, and view order history.",
      },
      {
        q: "How do I sign in?",
        a: "Click the sign-in icon in the header. We use email-based sign-in — you will receive a secure link to sign in without a password.",
      },
      {
        q: "How do I change my password or email?",
        a: "Sign in to your account and visit Settings to update your details.",
      },
    ],
  },
  {
    title: "Wholesale & B2B",
    items: [
      {
        q: "Do you offer wholesale or bulk pricing?",
        a: "We offer wholesale purchasing for businesses. Visit our B2B page or contact us for details.",
      },
      {
        q: "How do I apply for a wholesale account?",
        a: "Visit b2b.sdbbuy.com and submit a wholesale inquiry form. Our team will review your application.",
      },
    ],
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-neutral-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-[13px] font-medium transition-colors hover:text-foreground"
        aria-expanded={open}
      >
        {question}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open && (
        <p className="pb-4 text-[13px] leading-[1.7] text-neutral-600">{answer}</p>
      )}
    </div>
  );
}

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState(FAQ_CATEGORIES[0].title);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="eyebrow">Help center</p>
            <h1 className="mt-3 text-[32px] font-light leading-[1.08] tracking-tight md:text-[42px]">
              Frequently asked questions
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.75] text-neutral-600">
              Find answers to common questions about orders, payments, shipping, returns, and more.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            {/* Category tabs */}
            <Reveal>
              <div className="flex flex-wrap gap-2">
                {FAQ_CATEGORIES.map((cat) => (
                  <button
                    key={cat.title}
                    type="button"
                    onClick={() => setActiveCategory(cat.title)}
                    className={cn(
                      "border px-4 py-2 text-[12px] font-medium transition-all duration-200",
                      activeCategory === cat.title
                        ? "border-foreground bg-foreground text-background"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-400",
                    )}
                  >
                    {cat.title}
                  </button>
                ))}
              </div>
            </Reveal>

            {/* FAQ items */}
            <div className="mt-8">
              {FAQ_CATEGORIES.filter((c) => c.title === activeCategory).map((cat) => (
                <div key={cat.title}>
                  {cat.items.map((item) => (
                    <FaqItem key={item.q} question={item.q} answer={item.a} />
                  ))}
                </div>
              ))}
            </div>

            {/* Still need help */}
            <Reveal delay={100}>
              <div className="mt-12 border-t border-neutral-200 pt-8 text-center">
                <p className="text-[13px] text-neutral-600">
                  Still have questions?{" "}
                  <a
                    href="/contact"
                    className="font-medium underline underline-offset-2 transition-colors hover:text-foreground"
                  >
                    Contact us
                  </a>{" "}
                  and we&apos;ll help you out.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
