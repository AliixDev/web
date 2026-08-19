// frontend/components/homepage/PromoBanner.tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";

export default function PromoBanner() {
  return (
    <section className="relative overflow-hidden border-b border-neutral-800 bg-[#0a0a0a]">
      {/* Subtle gradient accent */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#111] via-transparent to-[#111]"
        aria-hidden
      />

      <div className="container relative py-16 md:py-20">
        <Reveal>
          <div className="flex flex-col items-center gap-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-600">
              Limited Time
            </p>
            <h2 className="max-w-lg font-display text-[32px] font-light leading-[1.1] tracking-tight text-white sm:text-[40px] md:text-[48px]">
              Ride More.
              <br />
              <span className="text-neutral-400">Save More.</span>
            </h2>
            <p className="max-w-md text-[13px] leading-[1.7] text-neutral-500">
              Get up to 20% off selected gear. Premium protection at the best prices of the year.
            </p>
            <Link
              href="/shop"
              className="inline-flex h-12 items-center gap-2 border border-white/20 bg-white/5 px-8 text-[12px] font-medium uppercase tracking-[0.12em] text-white backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/10"
            >
              Shop the Sale <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
