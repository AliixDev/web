// frontend/app/about/page.tsx

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PolicyLayout from "@/components/layout/PolicyLayout";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about SDBBUY — a brand rooted in 2017, specializing in leather garments, motorbike riding gear, boxing gear, and gym wear.",
  openGraph: {
    title: "About SDBBUY",
    description:
      "SDBBUY traces its roots to 2017, beginning with leather garments and jackets and expanding into motorbike gear, boxing equipment, and lifestyle products.",
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
              Crafted with purpose.<br />
              Built to last.
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.75] text-neutral-600">
              SDBBUY traces its roots to 2017, beginning with leather garments and jackets. Over
              the years, the brand expanded its focus into motorbike riding gear and a broader
              range of products for modern lifestyles.
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
                From leather to lifestyle
              </h2>
            </Reveal>
            <Reveal delay={60}>
              <p className="mt-5 text-[14px] leading-[1.8] text-neutral-600">
                What started as a focus on handcrafted leather garments and jackets grew into a
                broader vision — motorbike riding gear, boxing equipment, working and gym
                clothing, and accessories for people who value quality and function.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-4 text-[14px] leading-[1.8] text-neutral-600">
                Every product in the SDBBUY collection reflects this evolution: durable materials,
                thoughtful construction, and a clean aesthetic that works across contexts — from the
                gym to the street to the workshop.
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
                { label: "Leather Garments", desc: "Jackets, coats, and leather outerwear built to endure." },
                { label: "Motorbike Gear", desc: "Helmets, riding jackets, gloves, and protective gear for riders." },
                { label: "Boxing Gear", desc: "Gloves, wraps, and accessories for training and competition." },
                { label: "Gym & Fitness Wear", desc: "Working clothing and gym wear for performance and durability." },
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
                SDBBUY operates with a straightforward approach: source quality materials, build
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
                See what SDBBUY has to offer
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
