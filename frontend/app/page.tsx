// frontend/app/page.tsx

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Banknote, Globe2, Package, ShieldCheck } from "lucide-react";
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
      {/* Hero                                                        */}
      {/* ------------------------------------------------------------ */}
      <section className="border-b border-border">
        <div className="container grid items-center gap-12 py-16 md:py-24 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow animate-fade-up text-neutral-400" style={{ animationDelay: "0ms" }}>
              Global storefront · Made in Pakistan
            </p>
            <h1
              className="animate-fade-up mt-5 text-5xl font-light leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl"
              style={{ animationDelay: "80ms" }}
            >
              Crafted in Pakistan.
              <br />
              <span className="text-neutral-400">Delivered worldwide.</span>
            </h1>
            <p
              className="animate-fade-up mt-6 max-w-md text-base leading-relaxed text-neutral-600"
              style={{ animationDelay: "160ms" }}
            >
              Hand-finished apparel, home textiles, and everyday electronics.
              Pay in cash across Pakistan, or with your card anywhere in the world.
            </p>
            <div className="animate-fade-up mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "240ms" }}>
              <Link
                href="/shop"
                className="inline-flex h-12 items-center gap-2 bg-foreground px-7 text-sm font-medium text-background transition-opacity hover:opacity-85"
              >
                Shop the collection <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/shop?category=apparel"
                className="inline-flex h-12 items-center border border-foreground/20 px-7 text-sm font-medium transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
              >
                Explore apparel
              </Link>
            </div>
          </div>

          <div className="animate-fade-up relative" style={{ animationDelay: "200ms" }}>
            <div className="absolute -left-4 -top-4 hidden h-24 w-24 border-l border-t border-neutral-200 lg:block" aria-hidden />
            <div className="absolute -bottom-4 -right-4 hidden h-24 w-24 border-b border-r border-neutral-200 lg:block" aria-hidden />
            <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
              {heroProduct?.image_url ? (
                <ProductImage
                  src={heroProduct.image_url}
                  alt={heroProduct.name}
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-neutral-300">
                  <span className="font-display text-6xl font-light">S</span>
                  <span className="eyebrow">SitaraSouq</span>
                </div>
              )}
            </div>
            {heroProduct && (
              <Link
                href={`/products/${heroProduct.slug}`}
                className="group absolute bottom-5 left-5 flex items-center gap-3 bg-background/95 px-4 py-3 shadow-lift backdrop-blur transition-colors hover:bg-foreground hover:text-background"
              >
                <span className="text-sm font-medium">Featured — {heroProduct.name}</span>
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Black editorial strip                                       */}
      {/* ------------------------------------------------------------ */}
      <section aria-hidden className="bg-foreground py-3.5 text-background">
        <div className="container flex flex-wrap items-center justify-center gap-x-10 gap-y-1 text-[11px] font-medium uppercase tracking-[0.22em] text-background/85">
          <span>Cash on delivery — Pakistan</span>
          <span className="hidden text-background/40 sm:inline">✦</span>
          <span>Stripe · USD worldwide</span>
          <span className="hidden text-background/40 sm:inline">✦</span>
          <span>Authentic crafts</span>
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Categories                                                  */}
      {/* ------------------------------------------------------------ */}
      {categories.length > 0 && (
        <section className="border-b border-border">
          <div className="container py-16 md:py-20">
            <Reveal>
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="eyebrow text-neutral-400">Curated</p>
                  <h2 className="mt-3 text-4xl font-light tracking-tight md:text-5xl">
                    Shop by category
                  </h2>
                </div>
              </div>
            </Reveal>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
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
                        imgClassName="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-neutral-100" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" aria-hidden />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                      <div>
                        <p className="text-lg font-medium tracking-tight text-white">{category.name}</p>
                        <p className="mt-0.5 text-xs uppercase tracking-[0.18em] text-white/70">
                          {category.product_count} {category.product_count === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-white transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------ */}
      {/* Featured products                                            */}
      {/* ------------------------------------------------------------ */}
      <section className="border-b border-border">
        <div className="container py-16 md:py-20">
          <Reveal>
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="eyebrow text-neutral-400">The edit</p>
                <h2 className="mt-3 text-4xl font-light tracking-tight md:text-5xl">Featured products</h2>
              </div>
              <Link
                href="/shop"
                className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium underline decoration-neutral-300 underline-offset-8 transition-colors hover:text-neutral-500"
              >
                View all
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
          </Reveal>

          {featured.length > 0 ? (
            <div className="mt-10">
              <ProductGrid products={featured} />
            </div>
          ) : (
            <Reveal className="mt-10">
              <div className="flex flex-col items-center gap-4 border border-dashed border-border py-20 text-center">
                <p className="text-neutral-500">The collection is being prepared.</p>
                <p className="max-w-sm text-sm text-neutral-400">
                  Products will appear here once the store catalog is connected via Supabase.
                </p>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Promo band                                                   */}
      {/* ------------------------------------------------------------ */}
      <section className="border-b border-border bg-background">
        <Reveal>
          <div className="bg-foreground px-6 py-20 text-center text-background md:py-28">
            <p className="eyebrow text-background/50">Honest pricing</p>
            <h2 className="mx-auto mt-5 max-w-2xl text-4xl font-light leading-tight tracking-tight md:text-5xl">
              Every price is verified at checkout — in the currency you choose.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-background/70">
              No hidden conversions, no surprises. Prices are confirmed server-side
              before your order is placed, in USD for international orders and PKR
              for cash on delivery.
            </p>
            <Link
              href="/shop"
              className="mt-9 inline-flex h-12 items-center gap-2 border border-background/40 px-7 text-sm font-medium transition-colors hover:bg-background hover:text-foreground"
            >
              Browse the shop <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ------------------------------------------------------------ */}
      {/* Trust                                                       */}
      {/* ------------------------------------------------------------ */}
      <section>
        <div className="container py-16 md:py-20">
          <Reveal>
            <p className="eyebrow text-neutral-400">Why shop with us</p>
          </Reveal>
          <div className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
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
                title: "Handcrafted goods",
                body: "Apparel, textiles, and electronics made in Pakistan.",
              },
              {
                icon: Globe2,
                title: "Ship anywhere",
                body: "Order in USD or PKR — the storefront delivers globally.",
              },
            ].map((item, index) => (
              <Reveal key={item.title} delay={index * 90}>
                <div className="border-t border-border pt-6">
                  <item.icon className="h-6 w-6 text-neutral-400" strokeWidth={1.5} aria-hidden />
                  <h3 className="mt-4 font-display text-lg font-medium tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-500">{item.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
