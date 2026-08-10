// frontend/components/layout/Footer.tsx

import Link from "next/link";
import type { Category } from "@/lib/types";

export default function Footer({ categories }: { categories: Category[] }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container grid gap-12 py-16 md:grid-cols-12">
        {/* Brand */}
        <div className="md:col-span-5">
          <Link href="/" className="font-display text-2xl font-medium tracking-tight">
            Sitara<span className="font-light opacity-60">Souq</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-neutral-500">
            A global storefront for goods made in Pakistan — handcrafted apparel,
            home textiles, and everyday electronics. Cash on delivery across
            Pakistan, secure card checkout everywhere else.
          </p>
        </div>

        {/* Shop */}
        <nav aria-label="Shop" className="md:col-span-3">
          <h2 className="eyebrow text-neutral-400">Shop</h2>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <Link href="/shop" className="transition-opacity hover:opacity-60">
                All products
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/shop?category=${category.slug}`}
                  className="transition-opacity hover:opacity-60"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Service */}
        <div className="md:col-span-4">
          <h2 className="eyebrow text-neutral-400">Service</h2>
          <ul className="mt-5 space-y-3 text-sm text-neutral-600">
            <li>Cash on Delivery — Pakistan only</li>
            <li>International card checkout via Stripe</li>
            <li>Prices verified at checkout, in USD or PKR</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container flex flex-col gap-2 py-6 text-xs text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} SitaraSouq. All rights reserved.</p>
          <p>Built with Next.js &amp; Supabase.</p>
        </div>
      </div>
    </footer>
  );
}
