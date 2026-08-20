// frontend/app/page.tsx

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCategories, getProducts } from "@/lib/data";
import type { Category, Product } from "@/lib/types";
import CinematicHero from "@/components/hero/CinematicHero";
import CategoryGrid from "@/components/homepage/CategoryGrid";
import FeaturedProducts from "@/components/homepage/FeaturedProducts";
import PromoBanner from "@/components/homepage/PromoBanner";
import Benefits from "@/components/homepage/Benefits";
import Reveal from "@/components/Reveal";

/** Products in a category including its subcategories. */
function productsIn(
  category: Category | undefined,
  categories: Category[],
  products: Product[],
): Product[] {
  if (!category) return [];
  const ids = new Set([
    category.id,
    ...categories.filter((c) => c.parent_id === category.id).map((c) => c.id),
  ]);
  return products.filter((p) => p.category_id && ids.has(p.category_id));
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));

  const featured = products.slice(0, 4);

  // Leather section data
  const leatherCat = catBySlug.get("leather-jackets-biker-fashion");
  const leather = productsIn(leatherCat, categories, products);
  const leatherImage = leather.find((p) => p.image_url)?.image_url ?? null;

  return (
    <>
      {/* ── Cinematic Hero ──────────────────────────────────────── */}
      <CinematicHero />

      {/* ── Editorial strip ─────────────────────────────────────── */}
      <section aria-hidden className="border-y border-white/[0.06] bg-[#030303] py-4">
        <div className="container flex flex-wrap items-center justify-center gap-x-10 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600">
          <span>Protection</span>
          <span className="text-neutral-700">·</span>
          <span>Craftsmanship</span>
          <span className="text-neutral-700">·</span>
          <span>Durability</span>
          <span className="text-neutral-700">·</span>
          <span>Motorcycle culture</span>
        </div>
      </section>

      {/* ── Shop by Category ────────────────────────────────────── */}
      <CategoryGrid categories={categories} products={products} />

      {/* ── Featured Products ────────────────────────────────────── */}
      <FeaturedProducts products={featured} />

      {/* ── Leather Craft Section ───────────────────────────────── */}
      {leather.length > 0 && (
        <section className="border-b border-white/[0.06] bg-[#060606]">
          <div className="container grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2 lg:gap-16">
            <Reveal className="order-2 lg:order-1">
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-950">
                {leatherImage ? (
                  <img
                    src={leatherImage}
                    alt="RACEVOR leather jackets"
                    className="h-full w-full object-cover opacity-80 transition-all duration-700 hover:scale-105 hover:opacity-90"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-950 to-black">
                    <span className="font-display text-[48px] font-light text-neutral-800">01</span>
                  </div>
                )}
              </div>
            </Reveal>
            <Reveal className="order-1 lg:order-2" delay={80}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600">
                Leather craft
              </p>
              <h2 className="mt-3 font-display text-[32px] font-light tracking-tight text-white sm:text-4xl md:text-5xl">
                Leather that earns its place.
              </h2>
              <p className="mt-6 max-w-md text-[13px] leading-[1.8] text-neutral-500">
                Full-grain construction, reinforced stitching, and hardware built to be used every
                day. From racing suits to classic silhouettes — leather made for the road and beyond.
              </p>
              <ul className="mt-8 space-y-3 text-[13px]">
                {[
                  { name: "Motorbike gear", slug: "motorbike-gear" },
                  { name: "Leather jackets", slug: "leather-jackets-biker-fashion" },
                  { name: "Handcrafted gloves", slug: "handcrafted-gloves" },
                ].map((link) => (
                  <li key={link.slug}>
                    <Link
                      href={`/shop?category=${link.slug}`}
                      className="group inline-flex items-center gap-2 border-b border-neutral-800 pb-1 font-medium text-neutral-400 transition-colors hover:border-white/30 hover:text-white"
                    >
                      {link.name}
                      <ArrowRight
                        className="h-3.5 w-3.5 text-neutral-600 transition-transform duration-200 group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── Brand Statement ─────────────────────────────────────── */}
      <section className="border-b border-white/[0.06] bg-[#030303]">
        <Reveal>
          <div className="px-6 py-24 text-center md:py-32">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600">
              RACEVOR
            </p>
            <h2 className="mx-auto mt-6 max-w-3xl font-display text-[32px] font-light leading-[1.1] tracking-tight text-white sm:text-4xl md:text-[48px]">
              Protection engineered.
              <br />
              <span className="text-neutral-500">Built around the rider.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[13px] leading-[1.8] text-neutral-500">
              Since 2017, every RACEVOR piece is built around a simple idea: gear that protects,
              leather that ages well, and construction you can trust ride after ride.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── Promo Banner ────────────────────────────────────────── */}
      <PromoBanner />

      {/* ── Benefits ────────────────────────────────────────────── */}
      <Benefits />

      {/* ── Final CTA ──────────────────────────────────────────── */}
      <section className="bg-[#050505]">
        <div className="px-6 py-20 text-center md:py-28">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600">
            RACEVOR
          </p>
          <h2 className="mx-auto mt-6 max-w-2xl font-display text-[28px] font-light leading-[1.12] tracking-tight text-white sm:text-4xl md:text-5xl">
            Ride with RACEVOR.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[13px] leading-[1.8] text-neutral-500">
            Motorcycle protection, racing suits, and premium gear — priced in the currency you
            choose and verified server-side before any order is placed.
          </p>
          <Link
            href="/shop"
            className="btn-press mt-9 inline-flex h-12 items-center gap-2 border border-white/20 bg-white/5 px-8 text-[12px] font-medium uppercase tracking-[0.12em] text-white transition-all duration-300 hover:border-white/40 hover:bg-white/10"
          >
            Shop the collection <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
