// frontend/app/page.tsx

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Globe2,
  ShieldCheck,
} from "lucide-react";
import { getCategories, getProducts } from "@/lib/data";
import type { Category, Product } from "@/lib/types";
import ProductGrid from "@/components/product/ProductGrid";
import ProductImage from "@/components/product/ProductImage";
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

function leadImage(items: Product[]): string | null {
  return items.find((p) => p.image_url)?.image_url ?? null;
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));

  const motorbikeGear = productsIn(catBySlug.get("motorbike-gear"), categories, products);
  const leather = productsIn(catBySlug.get("leather-jackets-biker-fashion"), categories, products);
  const gloves = productsIn(catBySlug.get("handcrafted-gloves"), categories, products);

  const motoSuits = productsIn(catBySlug.get("moto-suits"), categories, products);
  const motoGloves = productsIn(catBySlug.get("moto-gloves"), categories, products);
  const motoShoes = productsIn(catBySlug.get("moto-shoes"), categories, products);

  const featured = products.slice(0, 4);
  const heroImage = leadImage(motorbikeGear);
  const leatherImage = leadImage(leather);
  const glovesImage = leadImage(gloves);

  const protectionCards = [
    { name: "Moto Suits", slug: "moto-suits", items: motoSuits },
    { name: "Moto Gloves", slug: "moto-gloves", items: motoGloves },
    { name: "Moto Shoes", slug: "moto-shoes", items: motoShoes },
  ];

  return (
    <>
      {/* ------------------------------------------------------------ */}
      {/* Hero — BUILT FOR THE RIDE.                                    */}
      {/* ------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-foreground text-background">
        {heroImage && (
          <div className="absolute inset-0" aria-hidden>
            <ProductImage
              src={heroImage}
              alt=""
              sizes="100vw"
              imgClassName="object-cover grayscale opacity-30"
            />
          </div>
        )}
        <div
          className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/45"
          aria-hidden
        />
        <div className="container relative py-24 md:py-36">
          <p className="eyebrow animate-fade-up text-background/60" style={{ animationDelay: "0ms" }}>
            SDB WEAR — Premium motorcycle protection &amp; leather gear
          </p>
          <h1
            className="animate-fade-up mt-6 max-w-3xl font-display text-[56px] font-light leading-[0.98] tracking-tighter sm:text-7xl xl:text-[96px]"
            style={{ animationDelay: "90ms" }}
          >
            BUILT FOR
            <br />
            <span className="text-neutral-400">THE RIDE.</span>
          </h1>
          <p
            className="animate-fade-up mt-7 max-w-md text-[15px] leading-[1.75] text-background/70"
            style={{ animationDelay: "180ms" }}
          >
            Premium motorcycle protection, performance gear and leather craftsmanship designed for
            riders who demand more.
          </p>
          <div
            className="animate-fade-up mt-10 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "270ms" }}
          >
            <Link
              href="/shop?category=motorbike-gear"
              className="btn-press inline-flex h-12 items-center gap-2 bg-background px-8 text-[13px] font-medium text-foreground transition-opacity hover:opacity-85"
            >
              Shop motorbike gear <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </Link>
            <Link
              href="/shop?category=leather-jackets-biker-fashion"
              className="btn-press inline-flex h-12 items-center gap-2 border border-background/30 px-8 text-[13px] font-medium transition-all duration-200 hover:border-background hover:bg-background hover:text-foreground"
            >
              Explore leather
            </Link>
          </div>

          {/* Real business facts from the live catalog */}
          <dl
            className="animate-fade-up mt-14 flex flex-wrap gap-x-12 gap-y-4 border-t border-background/15 pt-7"
            style={{ animationDelay: "360ms" }}
          >
            <div>
              <dt className="sr-only">Products in the collection</dt>
              <dd className="font-display text-2xl font-light tabular-nums">{products.length}</dd>
              <dd className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-background/45">
                Products
              </dd>
            </div>
            <div>
              <dt className="sr-only">Product families</dt>
              <dd className="font-display text-2xl font-light tabular-nums">3</dd>
              <dd className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-background/45">
                Families
              </dd>
            </div>
            <div>
              <dt className="sr-only">Established</dt>
              <dd className="font-display text-2xl font-light tabular-nums">2017</dd>
              <dd className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-background/45">
                Established
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Editorial strip                                               */}
      {/* ------------------------------------------------------------ */}
      <section aria-hidden className="border-y border-border bg-background py-4">
        <div className="container flex flex-wrap items-center justify-center gap-x-10 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
          <span>Protection</span>
          <span className="text-neutral-300">·</span>
          <span>Craftsmanship</span>
          <span className="text-neutral-300">·</span>
          <span>Durability</span>
          <span className="text-neutral-300">·</span>
          <span>Motorcycle culture</span>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Motorbike protection                                          */}
      {/* ------------------------------------------------------------ */}
      {protectionCards.some((card) => card.items.length > 0) && (
        <section className="border-b border-border">
          <div className="container py-16 md:py-24">
            <Reveal>
              <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                <div>
                  <p className="eyebrow">Motorbike protection</p>
                  <h2 className="mt-3 max-w-xl text-4xl font-light tracking-tight md:text-5xl">
                    Protection without compromise.
                  </h2>
                </div>
                <Link
                  href="/shop?category=motorbike-gear"
                  className="group inline-flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-neutral-600 transition-colors hover:text-foreground"
                >
                  All motorbike gear
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </div>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {protectionCards.map((card, index) => (
                <Reveal key={card.slug} delay={index * 90}>
                  <Link
                    href={`/shop?category=${card.slug}`}
                    className="group relative block aspect-[4/5] overflow-hidden bg-neutral-100"
                  >
                    <ProductImage
                      src={leadImage(card.items)}
                      alt={card.name}
                      sizes="(min-width: 640px) 33vw, 100vw"
                      imgClassName="img-zoom"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent transition-opacity duration-300 group-hover:from-black/75"
                      aria-hidden
                    />
                    <span
                      className="absolute left-5 top-5 font-display text-sm font-light tracking-[0.2em] text-white/80"
                      aria-hidden
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                      <div>
                        <p className="font-display text-2xl font-light tracking-tight text-white">{card.name}</p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
                          {card.items.length} {card.items.length === 1 ? "piece" : "pieces"}
                        </p>
                      </div>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-all duration-300 group-hover:rotate-45 group-hover:border-white">
                        <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ */}
      {/* Leather craft                                                */}
      {/* ------------------------------------------------------------ */}
      {leather.length > 0 && (
        <section className="border-b border-border">
          <div className="container grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2 lg:gap-16">
            <Reveal className="order-2 lg:order-1">
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                <ProductImage
                  src={leatherImage}
                  alt="SDB WEAR leather jackets"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  imgClassName="img-zoom"
                />
              </div>
            </Reveal>
            <Reveal className="order-1 lg:order-2" delay={80}>
              <p className="eyebrow">Leather craft</p>
              <h2 className="mt-3 text-4xl font-light tracking-tight md:text-5xl">
                Leather that earns its place.
              </h2>
              <p className="mt-6 max-w-md text-[14px] leading-[1.8] text-neutral-600">
                Full-grain construction, reinforced stitching, and hardware built to be used every
                day. From classic biker cuts to heritage and racing-inspired silhouettes — leather
                made for the road and beyond.
              </p>
              <ul className="mt-8 space-y-3 text-[13px]">
                {[
                  { name: "Biker leather jackets", slug: "biker-leather-jackets" },
                  { name: "Casual leather jackets", slug: "casual-leather-jackets" },
                  { name: "Heritage leather", slug: "heritage-leather" },
                ].map((link) => (
                  <li key={link.slug}>
                    <Link
                      href={`/shop?category=${link.slug}`}
                      className="group inline-flex items-center gap-2 border-b border-neutral-200 pb-1 font-medium transition-colors hover:border-foreground"
                    >
                      {link.name}
                      <ArrowRight
                        className="h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 group-hover:translate-x-0.5"
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

      {/* ------------------------------------------------------------ */}
      {/* Stitched gloves                                               */}
      {/* ------------------------------------------------------------ */}
      {gloves.length > 0 && (
        <section className="border-b border-border bg-foreground text-background">
          <div className="container grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <p className="eyebrow text-background/50">Handcrafted gloves</p>
              <h2 className="mt-3 text-4xl font-light tracking-tight md:text-5xl">
                Stitched for the hand.
              </h2>
              <p className="mt-6 max-w-md text-[14px] leading-[1.8] text-background/70">
                Stitched construction. Reinforced seams. Materials chosen to grip, protect, and
                last. From driving and riding gloves to work, mechanic, and custom-made — built
                around the hand, not the machine.
              </p>
              <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-background/40">
                Stitched. Built. Made to last.
              </p>
              <Link
                href="/shop?category=handcrafted-gloves"
                className="btn-press mt-9 inline-flex h-12 items-center gap-2 bg-background px-8 text-[13px] font-medium text-foreground transition-opacity hover:opacity-85"
              >
                Explore gloves <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Reveal>
            <Reveal delay={100}>
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-900">
                <ProductImage
                  src={glovesImage}
                  alt="SDB WEAR handcrafted gloves"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="bg-neutral-900"
                  imgClassName="grayscale opacity-90"
                />
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ */}
      {/* Featured products                                             */}
      {/* ------------------------------------------------------------ */}
      {featured.length > 0 && (
        <section className="border-b border-border">
          <div className="container py-16 md:py-24">
            <Reveal>
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="eyebrow">The edit</p>
                  <h2 className="mt-3 text-4xl font-light tracking-tight md:text-5xl">Featured pieces</h2>
                </div>
                <Link
                  href="/shop"
                  className="group hidden shrink-0 items-center gap-1.5 text-[13px] font-medium text-neutral-600 transition-colors hover:text-foreground sm:inline-flex"
                >
                  View all
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </div>
            </Reveal>
            <div className="mt-12">
              <ProductGrid products={featured} />
            </div>
            <div className="mt-10 text-center sm:hidden">
              <Link
                href="/shop"
                className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-600 transition-colors hover:text-foreground"
              >
                View all products
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ */}
      {/* Brand statement                                               */}
      {/* ------------------------------------------------------------ */}
      <section className="border-b border-border">
        <Reveal>
          <div className="px-6 py-24 text-center md:py-32">
            <p className="eyebrow">SDB WEAR</p>
            <h2 className="mx-auto mt-6 max-w-3xl font-display text-[36px] font-light leading-[1.1] tracking-tight md:text-6xl">
              Made for the road.
              <br />
              <span className="text-neutral-400">Designed to last.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[14px] leading-[1.8] text-neutral-600">
              Every piece is built around a simple idea: gear that protects, leather that ages
              well, and construction you can trust ride after ride.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Category experience                                           */}
      {/* ------------------------------------------------------------ */}
      <section className="border-b border-border">
        <div className="container py-16 md:py-24">
          <Reveal>
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="eyebrow">The collection</p>
                <h2 className="mt-3 text-4xl font-light tracking-tight md:text-5xl">Shop by family</h2>
              </div>
            </div>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { name: "Motorbike", slug: "motorbike-gear", items: motorbikeGear, tag: "Protection" },
              { name: "Leather", slug: "leather-jackets-biker-fashion", items: leather, tag: "Craft" },
              { name: "Gloves", slug: "handcrafted-gloves", items: gloves, tag: "Stitched" },
            ].map((block, index) => (
              <Reveal key={block.slug} delay={index * 90}>
                <Link
                  href={`/shop?category=${block.slug}`}
                  className="group relative block aspect-[4/5] overflow-hidden bg-neutral-100"
                >
                  <ProductImage
                    src={leadImage(block.items)}
                    alt={block.name}
                    sizes="(min-width: 768px) 33vw, 100vw"
                    imgClassName="img-zoom"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent transition-opacity duration-300 group-hover:from-black/75"
                    aria-hidden
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
                        {block.tag}
                      </p>
                      <p className="mt-1 font-display text-2xl font-light tracking-tight text-white">
                        {block.name}
                      </p>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
                        {block.items.length} {block.items.length === 1 ? "piece" : "pieces"}
                      </p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-white transition-all duration-300 group-hover:rotate-45 group-hover:border-white">
                      <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Final CTA                                                     */}
      {/* ------------------------------------------------------------ */}
      <section>
        <div className="bg-foreground px-6 py-20 text-center text-background md:py-28">
          <p className="eyebrow text-background/40">SDB WEAR</p>
          <h2 className="mx-auto mt-6 max-w-2xl font-display text-[32px] font-light leading-[1.12] tracking-tight md:text-5xl">
            Ride with SDB WEAR.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[14px] leading-[1.8] text-background/60">
            Protective gear, leather jackets, and stitched gloves — priced in the currency you
            choose and verified server-side before any order is placed.
          </p>
          <Link
            href="/shop"
            className="btn-press mt-9 inline-flex h-12 items-center gap-2 bg-background px-8 text-[13px] font-medium text-foreground transition-opacity hover:opacity-85"
          >
            Shop the collection <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Trust                                                          */}
      {/* ------------------------------------------------------------ */}
      <section className="border-t border-border">
        <div className="container py-14 md:py-16">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
            {[
            {
              icon: BadgeCheck,
              title: "Verified pricing",
              body: "Every price is recomputed server-side at checkout — no hidden conversions.",
            },
            {
              icon: ShieldCheck,
                title: "Secure checkout",
                body: "International card payments processed by Stripe, worldwide.",
              },
              {
                icon: Globe2,
                title: "Global checkout",
                body: "Pay in your preferred currency — verified server-side at checkout.",
              },
            ].map((item, index) => (
              <Reveal key={item.title} delay={index * 90}>
                <div className="border-t border-neutral-200 pt-6">
                  <item.icon className="h-6 w-6 text-neutral-400" strokeWidth={1.25} aria-hidden />
                  <h3 className="mt-4 font-display text-lg font-medium tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-[13px] leading-[1.7] text-neutral-600">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
