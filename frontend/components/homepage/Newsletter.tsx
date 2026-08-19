// frontend/components/homepage/Newsletter.tsx
"use client";

import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import Reveal from "@/components/Reveal";

export default function Newsletter() {
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: FormEvent) {
    e.preventDefault();
    setSubscribed(true);
  }

  return (
    <section className="border-b border-neutral-800 bg-[#080808]">
      <div className="container flex flex-col items-center gap-5 py-16 text-center md:py-20">
        <Reveal>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600">
            Stay informed
          </p>
          <h2 className="mt-3 font-display text-[24px] font-light tracking-tight text-white sm:text-[28px] md:text-[32px]">
            New Arrivals &amp; Limited Drops
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[13px] leading-[1.7] text-neutral-500">
            Be the first to know about new collections, protection gear, and leather releases from
            SDB WEAR.
          </p>
        </Reveal>

        <form onSubmit={handleSubscribe} className="mt-2 flex w-full max-w-md">
          <label htmlFor="hero-newsletter-email" className="sr-only">
            Email address
          </label>
          <input
            id="hero-newsletter-email"
            type="email"
            required
            placeholder="your@email.com"
            className="h-12 min-w-0 flex-1 border border-neutral-700 bg-neutral-900 px-4 text-[13px] text-white placeholder:text-neutral-600 focus:border-white/30 focus:outline-none focus:ring-0"
          />
          <button
            type="submit"
            className="flex h-12 shrink-0 items-center justify-center gap-2 border border-white/20 bg-white/5 px-6 text-[12px] font-medium uppercase tracking-[0.1em] text-white transition-all duration-300 hover:border-white/40 hover:bg-white/10"
          >
            {subscribed ? (
              <>
                <Check className="h-4 w-4" aria-hidden /> Subscribed
              </>
            ) : (
              "Subscribe"
            )}
          </button>
        </form>

        {subscribed && (
          <p className="text-[12px] text-neutral-500" role="status">
            Thanks — we&apos;ll be in touch when the newsletter launches.
          </p>
        )}
      </div>
    </section>
  );
}
