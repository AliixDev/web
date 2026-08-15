// frontend/app/page.tsx

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Globe2,
  Package,
  ShieldCheck,
} from "lucide-react";
import { getCategoryCards, getProducts } from "@/lib/data";
import ProductGrid from "@/components/product/ProductGrid";
import ProductImage from "@/components/product/ProductImage";
import Reveal from "@/components/Reveal";

export default async function HomePage() {
  const products = await getProducts();
  const categories = await getCategoryCards(products);
  const featured = products.slice(0, 8);
  const heroProduct = products.find((p) => p.image_url) ?? products[0];

  return (
    <>
      {/* ------------------------------------------------------------ */}
      {/* Hero                                                          */}
      {/* ------------------------------------------------------------ */}
      <section className="border-b border-border">
        <div className="container grid items-center gap-12 py-14 md:py-20 lg:grid-cols-12 lg:gap-10 lg:py-24">
          {/* Copy */}
          <div className="lg:col-span-6 xl:col-span-6">
            <p className="eyebrow animate-fade-up" style={{ animationDelay: "0ms" }}>
              Made in Pakistan · Shipped worldwide
            </p>
            <h1
              className="animate-fade-up mt-5 text-[44px] font-light leading-[1.02] tracking-tighter sm:text-6xl xl:text-[72px]"
              style={{ animationDelay: "80ms" }}
            >
              Crafted in Pakistan.
              <br />
              <em className="font-normal text-neutral-400">Delivered</em>{" "}
              <em className="font-normal">worldwide.</em>
            </h1>
            <p
              className="animate-fade-up mt-6 max-w-md text-[15px] leading-[1.75] text-neutral-600"
              style={{ animationDelay: "160ms" }}
            >
              Leather jackets, fashion apparel, boxing gear, and gym wear — priced in the
              currency you choose, verified server-side before any order is placed.
            </p>
            <div
              className="animate-fade-up mt-9 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "240ms" }}
            >
              <Link
                href="/shop"
                className="btn-press inline-flex h-12 items-center gap-2 bg-foreground px-8 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
              >
                Shop the collection <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </Link>
              <Link
                href="#categories"
                className="btn-press inline-flex h-12 items-center gap-2 border border-neutral-200 px-8 text-[13px] font-medium transition-all duration-200 hover:border-foreground hover:bg-foreground hover:text-background"
              >
                Browse categories <ArrowDown className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </Link>
            </div>

            {/* Real business facts, computed from the live catalog */}
            {products.length > 0 && (
              <dl
                className="animate-fade-up mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-neutral-200 pt-6"
                style={{ animationDelay: "320ms" }}
              >
                <div>
                  <dt className="sr-only">Products in the collection</dt>
                  <dd className="font-display text-2xl font-light tabular-nums">{products.length}</dd>
                  <dd className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    Pieces
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">Supported currencies</dt>
                  <dd className="font-display text-2xl font-light">8 currencies</dd>
                  <dd className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    Currencies
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">Payment options</dt>
                  <dd className="font-display text-2xl font-light">COD + Card</dd>
                  <dd className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    Ways to pay
                  </dd>
                </div>
              </dl>
            )}
          </div>

          {/* Imagery */}
          <div className="animate-fade-up lg:col-span-6 xl:col-span-6" style={{ animationDelay: "200ms" }}>
            <div className="relative">
              {/* Decorative corner marks */}
              <div className="absolute -left-5 -top-5 hidden h-20 w-20 border-l border-t border-neutral-200 lg:block" aria-hidden />
              <div className="absolute -bottom-5 -right-5 hidden h-20 w-20 border-b border-r border-neutral-200 lg:block" aria-hidden />

              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                {heroProduct?.image_url ? (
                  <ProductImage
                    src={heroProduct.image_url}
                    alt={heroProduct.name}
                    priority
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    imgClassName="img-zoom"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-neutral-200">
                    <span className="font-display text-8xl font-light">S</span>
                    <span className="eyebrow text-neutral-300">SDBBUY</span>
                  </div>
                )}
              </div>

              {/* Featured product overlay */}
              {heroProduct && (
                <Link
                  href={`/products/${heroProduct.slug}`}
                  className="group absolute bottom-5 left-5 flex items-center gap-3 bg-background/95 px-4 py-3 shadow-lift backdrop-blur-sm transition-colors duration-200 hover:bg-foreground hover:text-background"
                >
                  <span className="text-[13px] font-medium">Featured — {heroProduct.name}</span>
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden
                  />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Editorial strip                                               */}
      {/* ------------------------------------------------------------ */}
      <section aria-hidden className="bg-foreground py-3 text-background">
        <div className="container flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-background/70 sm:gap-x-12">
          <span>Multiple payment options</span>
          <span className="hidden text-background/25 sm:inline">·</span>
          <span>Secure checkout worldwide</span>
          <span className="hidden text-background/25 sm:inline">·</span>
          <span>Server-verified pricing</span>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Categories                                                     */}
      {/* ------------------------------------------------------------ */}
      {categories.length > 0 && (
        <section id="categories" className="scroll-mt-24 border-b border-border">
          <div className="container py-16 md:py-24">
            <Reveal>
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="eyebrow">Curated</p>
                  <h2 className="mt-3 text-4xl font-light tracking-tight md:text-5xl">Shop by category</h2>
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

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category, index) => (
                <Reveal key={category.id} delay={index * 90}>
                  <Link
                    href={`/shop?category=${category.slug}`}
                    className="group relative block aspect-[4/5] overflow-hidden bg-neutral-100"
                  >
                    {category.image_url ? (
                      <ProductImage
                        src={category.image_url}
                        alt={category.name}
                        sizes="(min-width: 640px) 33vw, 100vw"
                        imgClassName="img-zoom"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-neutral-100" />
                    )}
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent transition-opacity duration-300 group-hover:from-black/70"
                      aria-hidden
                    />
                    {/* Index number */}
                    <span
                      className="absolute left-5 top-5 font-display text-sm font-light tracking-[0.2em] text-white/80"
                      aria-hidden
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                      <div>
                        <p className="font-display text-2xl font-light tracking-tight text-white">
                          {category.name}
                        </p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
                          {category.product_count} {category.product_count === 1 ? "piece" : "pieces"}
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
      {/* Featured products                                              */}
      {/* ------------------------------------------------------------ */}
      <section className="border-b border-border">
        <div className="container py-16 md:py-24">
          <Reveal>
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="eyebrow">The edit</p>
                <h2 className="mt-3 text-4xl font-light tracking-tight md:text-5xl">Featured products</h2>
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

          {featured.length > 0 ? (
            <div className="mt-12">
              <ProductGrid products={featured} />
            </div>
          ) : (
            <Reveal className="mt-12">
              <div className="flex flex-col items-center gap-4 border border-dashed border-neutral-200 py-20 text-center">
                <p className="font-display text-xl font-medium tracking-tight text-neutral-700">
                  The collection is being prepared.
                </p>
                <p className="max-w-sm text-[13px] leading-relaxed text-neutral-500">
                  Products will appear here once the store catalog is connected via Supabase.
                </p>
              </div>
            </Reveal>
          )}

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

      {/* ------------------------------------------------------------ */}
      {/* Editorial promo                                                */}
      {/* ------------------------------------------------------------ */}
      <section className="border-b border-border">
        <Reveal>
          <div className="bg-foreground px-6 py-20 text-center text-background md:py-28">
            <p className="eyebrow text-background/40">Honest pricing</p>
            <h2 className="mx-auto mt-6 max-w-2xl font-display text-[32px] font-light leading-[1.15] tracking-tight md:text-5xl">
              Every price is verified at checkout — in the currency you choose.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[14px] leading-[1.8] text-background/60">
              No hidden conversions, no surprises. Prices are confirmed server-side before your
              order is placed — in the currency you select at checkout.
            </p>
            <Link
              href="/shop"
              className="btn-press mt-9 inline-flex h-12 items-center gap-2 border border-background/30 px-8 text-[13px] font-medium transition-all duration-200 hover:bg-background hover:text-foreground"
            >
              Browse the shop <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Trust                                                          */}
      {/* ------------------------------------------------------------ */}
      <section>
        <div className="container py-16 md:py-24">
          <Reveal>
            <p className="eyebrow">Why shop with us</p>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Banknote,
                title: "Cash on delivery",
                body: "Pay in cash when your order arrives — available across Pakistan.",
              },
              {
                icon: ShieldCheck,
                title: "Secure checkout",
                body: "International card payments processed by Stripe, worldwide.",
              },
              {
                icon: Package,
                title: "Made in Pakistan",
                body: "Leather, apparel, and performance gear from local makers.",
              },
              {
                icon: Globe2,
                title: "Global checkout",
                body: "Pay in your preferred currency — multiple payment methods worldwide.",
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
