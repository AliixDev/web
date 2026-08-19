// frontend/components/layout/Footer.tsx
"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import LanguageSelector from "@/components/layout/LanguageSelector";
import type { Category } from "@/lib/types";

const NAV_LABELS: Record<string, string> = {
  "motorbike-gear": "Motorbike Gear",
  "leather-jackets-biker-fashion": "Leather Jackets",
  "handcrafted-gloves": "Handcrafted Gloves",
};

export default function Footer({ categories }: { categories: Category[] }) {
  const year = new Date().getFullYear();
  const [subscribed, setSubscribed] = useState(false);

  // NOTE: the newsletter form is intentionally presentational for now —
  // there is no email backend wired up yet. Wire one (e.g. Resend) before
  // claiming signups are stored.
  function handleSubscribe(e: FormEvent) {
    e.preventDefault();
    setSubscribed(true);
  }

  return (
    <footer className="border-t border-neutral-800 bg-[#080808]">
      {/* Newsletter section */}
      <div className="border-b border-neutral-800">
        <div className="container flex flex-col items-center gap-5 py-14 text-center md:py-16">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600">Built for the ride</p>
          <h2 className="font-display text-2xl font-light tracking-tight text-white md:text-3xl">
            New arrivals &amp; limited drops
          </h2>
          <p className="max-w-md text-[13px] leading-[1.7] text-neutral-500">
            Be the first to know about new collections, protection gear, and leather releases from
            SDB WEAR.
          </p>
          <form onSubmit={handleSubscribe} className="mt-1 flex w-full max-w-md">
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-email"
              type="email"
              required
              placeholder="your@email.com"
              className="h-12 min-w-0 flex-1 border border-neutral-700 bg-neutral-900 px-4 text-[13px] text-white placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none focus:ring-0"
            />
            <button
              type="submit"
              className="flex h-12 shrink-0 items-center justify-center gap-2 border border-white/20 bg-white/5 px-6 text-[12px] font-medium uppercase tracking-[0.1em] text-white transition-opacity hover:bg-white/10"
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
      </div>

      {/* Main footer content */}
      <div className="container grid gap-10 py-14 md:grid-cols-12 md:gap-8 md:py-16">
        {/* Brand column */}
        <div className="md:col-span-4">
          <Link href="/" className="font-display text-xl font-medium tracking-tight text-white">
            SDB<span className="font-light text-neutral-500">WEAR</span>
          </Link>
          <p className="mt-4 max-w-sm text-[13px] leading-[1.7] text-neutral-500">
            Premium motorcycle protection and leather gear. Moto suits, moto gloves, moto shoes,
            leather jackets and handcrafted stitched gloves — designed for riders who demand more.
          </p>
          <p className="mt-6 text-[12px] leading-[1.7] text-neutral-600">
            Prices are verified server-side at checkout — no hidden conversions.
          </p>
        </div>

        {/* Shop links */}
        <nav aria-label="Shop" className="md:col-span-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600">Shop</h2>
          <ul className="mt-5 space-y-2.5 text-[13px]">
            <li>
              <Link href="/shop" className="text-neutral-500 transition-colors hover:text-white">
                All products
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/shop?category=${category.slug}`}
                  className="text-neutral-500 transition-colors hover:text-white"
                >
                  {NAV_LABELS[category.slug] ?? category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Help links */}
        <nav aria-label="Help" className="md:col-span-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600">Help</h2>
          <ul className="mt-5 space-y-2.5 text-[13px]">
            <li>
              <Link href="/faq" className="text-neutral-500 transition-colors hover:text-white">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/contact" className="text-neutral-500 transition-colors hover:text-white">
                Contact us
              </Link>
            </li>
            <li>
              <Link href="/shipping-policy" className="text-neutral-500 transition-colors hover:text-white">
                Shipping
              </Link>
            </li>
            <li>
              <Link href="/return-policy" className="text-neutral-500 transition-colors hover:text-white">
                Returns &amp; exchanges
              </Link>
            </li>
            <li>
              <Link href="/size-guide" className="text-neutral-500 transition-colors hover:text-white">
                Size guide
              </Link>
            </li>
            <li>
              <Link href="/order-tracking" className="text-neutral-500 transition-colors hover:text-white">
                Track order
              </Link>
            </li>
            <li className="pt-1">
              <Link
                href="/seller/login"
                className="inline-flex items-center gap-1 text-neutral-500 transition-colors hover:text-white"
              >
                Seller login
              </Link>
            </li>
          </ul>
        </nav>

        {/* Company links */}
        <nav aria-label="Company" className="md:col-span-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600">Company</h2>
          <ul className="mt-5 space-y-2.5 text-[13px]">
            <li>
              <Link href="/about" className="text-neutral-500 transition-colors hover:text-white">
                About SDB WEAR
              </Link>
            </li>
            <li>
              <Link href="/payment-information" className="text-neutral-500 transition-colors hover:text-white">
                Payment methods
              </Link>
            </li>
            <li>
              <a
                href="https://b2b.sdbbuy.com"
                className="text-neutral-500 transition-colors hover:text-white"
              >
                Wholesale / B2B
              </a>
            </li>
            <li className="text-neutral-600">Stripe (international)</li>
            <li className="text-neutral-600">JazzCash</li>
          </ul>
        </nav>

        {/* Legal links */}
        <nav aria-label="Legal" className="md:col-span-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600">Legal</h2>
          <ul className="mt-5 space-y-2.5 text-[13px]">
            <li>
              <Link href="/privacy-policy" className="text-neutral-500 transition-colors hover:text-white">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-neutral-500 transition-colors hover:text-white">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/cookie-policy" className="text-neutral-500 transition-colors hover:text-white">
                Cookie policy
              </Link>
            </li>
            <li>
              <Link href="/cancellation-policy" className="text-neutral-500 transition-colors hover:text-white">
                Cancellations
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-800">
        <div className="container flex flex-col gap-3 py-5 text-[11px] text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} SDB WEAR. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href="/about" className="transition-colors hover:text-white/60">About</Link>
            <Link href="/privacy-policy" className="transition-colors hover:text-white/60">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-white/60">Terms</Link>
            <Link href="/return-policy" className="transition-colors hover:text-white/60">Returns</Link>
            <Link href="/shipping-policy" className="transition-colors hover:text-white/60">Shipping</Link>
            <Link href="/cancellation-policy" className="transition-colors hover:text-white/60">Cancellations</Link>
            <Link href="/cookie-policy" className="transition-colors hover:text-white/60">Cookies</Link>
            <a href="https://b2b.sdbbuy.com" className="transition-colors hover:text-white/60">Wholesale B2B</a>
            <span aria-hidden className="hidden text-neutral-700 sm:inline">·</span>
            <LanguageSelector />
          </div>
        </div>
      </div>
    </footer>
  );
}
