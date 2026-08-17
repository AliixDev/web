// frontend/components/b2b/B2BShell.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Package, ShieldCheck, Users, Zap } from "lucide-react";
import Reveal from "@/components/Reveal";

function B2BHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-xl">
      <div className="container flex h-[60px] items-center justify-between">
        <Link href="/b2b" className="font-display text-[21px] font-medium tracking-tight">
          SDB<span className="font-light text-neutral-400">WEAR</span>
          <span className="ml-2 align-middle border border-neutral-300 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Wholesale
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <a
            href="https://sdbbuy.com"
            className="text-[13px] text-neutral-600 transition-colors hover:text-foreground"
          >
            Main store
          </a>
          <a
            href="#inquiry"
            className="btn-press inline-flex h-10 items-center gap-2 bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
          >
            Request access <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </div>
    </header>
  );
}

function B2BFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container py-8 text-center text-[12px] text-neutral-400">
        <p>© {new Date().getFullYear()} SDB WEAR. Wholesale &amp; B2B inquiries.</p>
        <p className="mt-1">
          <a href="https://sdbbuy.com" className="underline underline-offset-2 transition-colors hover:text-foreground">
            Visit the main store
          </a>
        </p>
      </div>
    </footer>
  );
}

const WHOLESALE_CATEGORIES = [
  { name: "Moto Suits", desc: "One-piece and two-piece protective riding suits." },
  { name: "Moto Gloves", desc: "Racing, touring, and premium leather riding gloves." },
  { name: "Moto Shoes", desc: "Protective riding shoes and boots for the road." },
  { name: "Leather Jackets", desc: "Biker, casual, heritage, and racing-inspired styles." },
  { name: "Handcrafted Gloves", desc: "Stitched leather, riding, driving, and work gloves." },
  { name: "Biker Fashion", desc: "Vests and leather apparel with a fashion edge." },
];

export default function B2BShell() {
  const [isSubdomain, setIsSubdomain] = useState(false);

  useEffect(() => {
    setIsSubdomain(window.location.hostname === "b2b.sdbbuy.com");
  }, []);

  return (
    <>
      {isSubdomain && <B2BHeader />}

      {/* Hero */}
      <section className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="eyebrow">Wholesale &amp; B2B</p>
            <h1 className="mt-3 text-[32px] font-light leading-[1.08] tracking-tight md:text-[42px]">
              SDB WEAR Wholesale
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.75] text-neutral-600">
              We supply premium motorcycle protection and leather gear — moto suits, moto gloves,
              moto shoes, leather jackets, and handcrafted stitched gloves — for retailers and
              businesses. If you&apos;re interested in wholesale purchasing, we&apos;d like to hear from you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#inquiry"
                className="btn-press inline-flex h-12 items-center gap-2 bg-foreground px-8 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
              >
                Request wholesale access <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <a
                href="/contact"
                className="btn-press inline-flex h-12 items-center gap-2 border border-neutral-200 px-8 text-[13px] font-medium transition-all duration-200 hover:border-foreground hover:bg-foreground hover:text-background"
              >
                Contact wholesale team
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Wholesale categories */}
      <section className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 className="font-display text-2xl font-light tracking-tight md:text-3xl">
                Product categories
              </h2>
              <p className="mt-3 text-[13px] leading-[1.7] text-neutral-600">
                Our wholesale catalog spans the full SDB WEAR product range.
              </p>
            </Reveal>
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {WHOLESALE_CATEGORIES.map((cat, i) => (
                <Reveal key={cat.name} delay={i * 60}>
                  <div className="border border-neutral-100 p-5 transition-colors hover:border-neutral-300">
                    <p className="text-[13px] font-medium">{cat.name}</p>
                    <p className="mt-1 text-[12px] leading-[1.6] text-neutral-500">{cat.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 className="font-display text-2xl font-light tracking-tight md:text-3xl">
                Why wholesale with SDB WEAR
              </h2>
            </Reveal>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
              {[
                {
                  icon: Package,
                  title: "Wholesale purchasing",
                  body: "Access our full catalog for bulk orders at wholesale terms.",
                },
                {
                  icon: Users,
                  title: "Business account support",
                  body: "Dedicated account assistance for wholesale customers.",
                },
                {
                  icon: Zap,
                  title: "Bulk ordering",
                  body: "Place orders at scale with streamlined processing.",
                },
                {
                  icon: ShieldCheck,
                  title: "Quality assurance",
                  body: "All products meet SDB WEAR quality standards.",
                },
              ].map((item, i) => (
                <Reveal key={item.title} delay={i * 60}>
                  <div className="border-t border-neutral-200 pt-6">
                    <item.icon className="h-6 w-6 text-neutral-400" strokeWidth={1.25} aria-hidden />
                    <h3 className="mt-4 font-display text-lg font-medium tracking-tight">{item.title}</h3>
                    <p className="mt-2 text-[13px] leading-[1.7] text-neutral-600">{item.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Inquiry form */}
      <section id="inquiry" className="scroll-mt-24">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 className="font-display text-2xl font-light tracking-tight md:text-3xl">
                Wholesale inquiry
              </h2>
              <p className="mt-3 text-[13px] leading-[1.7] text-neutral-600">
                Tell us about your business and what you&apos;re looking for. Our team will review
                your inquiry and get back to you.
              </p>
            </Reveal>

            <Reveal delay={60}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // Presentational — no backend wired for B2B inquiries yet.
                  alert("Thank you — your inquiry has been noted. We will be in touch.");
                }}
                className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
              >
                {[
                  { id: "b2b-name", label: "Full name", type: "text", required: true, colSpan: false },
                  { id: "b2b-company", label: "Company name", type: "text", required: true, colSpan: false },
                  { id: "b2b-email", label: "Business email", type: "email", required: true, colSpan: false },
                  { id: "b2b-phone", label: "Phone", type: "tel", required: false, colSpan: false },
                  { id: "b2b-country", label: "Country", type: "text", required: true, colSpan: false },
                  { id: "b2b-city", label: "City", type: "text", required: false, colSpan: false },
                  { id: "b2b-type", label: "Business type", type: "text", required: true, placeholder: "Retailer, distributor, etc.", colSpan: false },
                  { id: "b2b-products", label: "Products interested in", type: "text", required: true, placeholder: "Leather jackets, moto gear, gloves, etc.", colSpan: false },
                  { id: "b2b-volume", label: "Estimated order volume", type: "text", required: false, placeholder: "e.g., 50–100 units", colSpan: false },
                ].map((field) => (
                  <div
                    key={field.id}
                    className={field.colSpan ? "sm:col-span-2" : ""}
                  >
                    <label htmlFor={field.id} className="mb-1.5 block text-[13px] font-medium text-neutral-700">
                      {field.label}
                    </label>
                    <input
                      id={field.id}
                      type={field.type}
                      required={field.required}
                      placeholder={"placeholder" in field ? field.placeholder : undefined}
                      className="h-11 w-full border border-neutral-200 bg-background px-3.5 text-[13px] placeholder:text-neutral-400 focus:border-foreground focus:outline-none focus:ring-0"
                    />
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <label htmlFor="b2b-message" className="mb-1.5 block text-[13px] font-medium text-neutral-700">
                    Message
                  </label>
                  <textarea
                    id="b2b-message"
                    rows={4}
                    placeholder="Tell us about your business and requirements..."
                    className="w-full border border-neutral-200 bg-background px-3.5 py-3 text-[13px] placeholder:text-neutral-400 focus:border-foreground focus:outline-none focus:ring-0"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="btn-press inline-flex h-11 items-center gap-2 bg-foreground px-6 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
                  >
                    Submit inquiry <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </form>
            </Reveal>
          </div>
        </div>
      </section>

      {isSubdomain && <B2BFooter />}
    </>
  );
}
