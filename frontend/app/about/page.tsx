// frontend/app/about/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PolicyLayout from "@/components/layout/PolicyLayout";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About SDB WEAR",
  description:
    "Learn about SDB WEAR — a premium motorcycle protection & leather gear brand rooted in 2017, specializing in moto suits, moto gloves, moto shoes, leather jackets and handcrafted stitched gloves.",
  openGraph: {
    title: "About SDB WEAR",
    description:
      "SDB WEAR traces its roots to 2017, beginning with leather garments and jackets and growing into premium motorcycle protection and handcrafted gear.",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="eyebrow">Our story</p>
            <h1 className="mt-3 text-[32px] font-light leading-[1.08] tracking-tight md:text-[42px]">
              Built for the ride.<br />
              Made to last.
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.75] text-neutral-600">
              SDB WEAR traces its roots to 2017, beginning with leather garments and jackets.
              Today the brand is built around one idea: premium motorcycle protection and leather
              gear that riders can trust ride after ride.
            </p>
          </div>
        </div>
      </section>

      {/* Brand story */}
      <section className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 className="font-display text-2xl font-light tracking-tight md:text-3xl">
                From leather to the road
              </h2>
            </Reveal>
            <Reveal delay={60}>
              <p className="mt-5 text-[14px] leading-[1.8] text-neutral-600">
                What started as a focus on handcrafted leather garments and jackets grew into a
                broader purpose — protective gear for riders. Moto suits, moto gloves, moto shoes,
                leather jackets, and stitched gloves built around protection, craftsmanship, and
                durability.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-4 text-[14px] leading-[1.8] text-neutral-600">
                Every piece in the SDB WEAR collection reflects this evolution: full-grain
                materials, reinforced construction, and a clean black-and-white aesthetic that
                works from the garage to the street.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Focus areas */}
      <section className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 className="font-display text-2xl font-light tracking-tight md:text-3xl">
                What we focus on
              </h2>
            </Reveal>
            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
              {[
                { label: "Motorbike Protection", desc: "Moto suits, gloves, and shoes engineered for the demands of the ride." },
                { label: "Leather Jackets", desc: "Biker, casual, heritage, and racing-inspired jackets in full-grain leather." },
                { label: "Handcrafted Gloves", desc: "Stitched gloves — leather, riding, driving, work, and custom — built for the hand." },
                { label: "Honest Construction", desc: "Reinforced stitching, functional design, and materials chosen to hold up." },
              ].map((item, i) => (
                <Reveal key={item.label} delay={i * 60}>
                  <div className="border-t border-neutral-200 pt-5">
                    <p className="text-[13px] font-medium">{item.label}</p>
                    <p className="mt-1.5 text-[13px] leading-[1.7] text-neutral-600">{item.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 className="font-display text-2xl font-light tracking-tight md:text-3xl">
                How we work
              </h2>
            </Reveal>
            <Reveal delay={60}>
              <p className="mt-5 text-[14px] leading-[1.8] text-neutral-600">
                SDB WEAR operates with a straightforward approach: source quality materials, build
                products that hold up, and price them honestly. No inflated markups, no misleading
                claims.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-4 text-[14px] leading-[1.8] text-neutral-600">
                Prices are verified server-side before any order is placed. You see the real cost
                in your chosen currency — whether PKR for cash on delivery across Pakistan or USD
                for international card checkout.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <p className="eyebrow">Explore the collection</p>
              <h2 className="mt-3 font-display text-2xl font-light tracking-tight md:text-3xl">
                Ride with SDB WEAR
              </h2>
              <Link
                href="/shop"
                className="btn-press mt-8 inline-flex h-12 items-center gap-2 bg-foreground px-8 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
              >
                Shop the collection <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
