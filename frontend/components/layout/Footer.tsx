// frontend/components/layout/Footer.tsx
"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import type { Category } from "@/lib/types";

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
    <footer className="border-t border-border bg-background">
      {/* Newsletter section */}
      <div className="border-b border-border">
        <div className="container flex flex-col items-center gap-5 py-14 text-center md:py-16">
          <p className="eyebrow">Stay in the loop</p>
          <h2 className="font-display text-2xl font-light tracking-tight md:text-3xl">
            New arrivals &amp; exclusive offers
          </h2>
          <p className="max-w-md text-[13px] leading-[1.7] text-neutral-600">
            Be the first to know about new collections, limited drops, and seasonal promotions.
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
              className="h-12 min-w-0 flex-1 border border-neutral-200 bg-neutral-50 px-4 text-[13px] placeholder:text-neutral-400 focus:border-foreground focus:outline-none focus:ring-0"
            />
            <button
              type="submit"
              className="flex h-12 shrink-0 items-center justify-center gap-2 border border-foreground bg-foreground px-6 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
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
        <div className="md:col-span-5">
          <Link href="/" className="font-display text-xl font-medium tracking-tight">
            Sitara<span className="font-light text-neutral-400">Souq</span>
          </Link>
          <p className="mt-4 max-w-sm text-[13px] leading-[1.7] text-neutral-600">
            Handcrafted apparel, home textiles, and everyday electronics from Pakistan. Cash on
            delivery across Pakistan, secure card checkout worldwide.
          </p>
          <p className="mt-6 text-[12px] leading-[1.7] text-neutral-400">
            Prices are verified server-side at checkout in USD or PKR — no hidden conversions.
          </p>
        </div>

        {/* Shop links */}
        <nav aria-label="Shop" className="md:col-span-3">
          <h2 className="eyebrow">Shop</h2>
          <ul className="mt-5 space-y-2.5 text-[13px]">
            <li>
              <Link href="/shop" className="text-neutral-700 transition-colors hover:text-foreground">
                All products
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/shop?category=${category.slug}`}
                  className="text-neutral-700 transition-colors hover:text-foreground"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Help links */}
        <div className="md:col-span-2">
          <h2 className="eyebrow">Help</h2>
          <ul className="mt-5 space-y-2.5 text-[13px]">
            <li className="text-neutral-600">Delivery information</li>
            <li className="text-neutral-600">Returns &amp; exchanges</li>
            <li className="text-neutral-600">FAQ</li>
            <li className="text-neutral-600">Contact us</li>
            <li className="pt-1">
              <Link href="/seller/login" className="inline-flex items-center gap-1 text-neutral-700 transition-colors hover:text-foreground">
                Seller login
              </Link>
            </li>
          </ul>
        </div>

        {/* Payment methods */}
        <div className="md:col-span-2">
          <h2 className="eyebrow">Payment</h2>
          <ul className="mt-5 space-y-2.5 text-[13px]">
            <li className="text-neutral-600">Cash on Delivery</li>
            <li className="text-neutral-600">Credit / Debit Card</li>
            <li className="text-neutral-600">Stripe (USD)</li>
            <li className="text-neutral-600">JazzCash</li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="container flex flex-col gap-2 py-5 text-[11px] text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} SitaraSouq. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="cursor-default transition-colors hover:text-foreground/60">Privacy</span>
            <span className="text-neutral-200">·</span>
            <span className="cursor-default transition-colors hover:text-foreground/60">Terms</span>
            <span className="text-neutral-200">·</span>
            <span>Built with Next.js &amp; Supabase</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
