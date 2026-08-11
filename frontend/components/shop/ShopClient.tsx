// frontend/components/shop/ShopClient.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import ProductGrid from "@/components/product/ProductGrid";
import { useDialog } from "@/lib/useDialog";
import { priceForCurrency } from "@/lib/currency";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type SortKey = "featured" | "price-asc" | "price-desc" | "name";

const SORT_LABELS: Record<SortKey, string> = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name: A–Z",
};

function ShopContent({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currency = useStore((s) => s.currency);

  const urlQuery = searchParams.get("q") ?? "";
  const urlCategory = searchParams.get("category") ?? "";
  const urlSort = (searchParams.get("sort") as SortKey | null) ?? "featured";

  const [query, setQuery] = useState(urlQuery);
  const [sort, setSort] = useState<SortKey>(urlSort);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtersRef = useDialog(filtersOpen, () => setFiltersOpen(false));

  useEffect(() => {
    setQuery(urlQuery);
    setSort(urlSort);
  }, [urlQuery, urlSort]);

  const updateParams = useCallback(
    (next: { q?: string; category?: string; sort?: SortKey }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.q !== undefined) {
        if (next.q) params.set("q", next.q);
        else params.delete("q");
      }
      if (next.category !== undefined) {
        if (next.category) params.set("category", next.category);
        else params.delete("category");
      }
      if (next.sort !== undefined && next.sort !== "featured") params.set("sort", next.sort);
      else if (next.sort === "featured") params.delete("sort");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const activeCategory = categories.find((c) => c.slug === urlCategory) ?? null;

  // Real price bounds from the live catalog, in the active currency.
  const priceBounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 };
    const prices = products.map((p) =>
      priceForCurrency(currency, p.price_usd_cents, p.price_pkr_paisa),
    );
    const min = Math.floor(Math.min(...prices) / 100);
    const max = Math.ceil(Math.max(...prices) / 100);
    return { min, max };
  }, [products, currency]);

  const [priceMin, setPriceMin] = useState<number>(priceBounds.min);
  const [priceMax, setPriceMax] = useState<number>(priceBounds.max);

  useEffect(() => {
    setPriceMin(priceBounds.min);
    setPriceMax(priceBounds.max);
  }, [priceBounds.min, priceBounds.max]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const minMinor = priceMin * 100;
    const maxMinor = priceMax * 100;

    let list = products.filter((product) => {
      if (activeCategory && product.category_id !== activeCategory.id) return false;
      if (term) {
        const haystack = `${product.name} ${product.description}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      const price = priceForCurrency(currency, product.price_usd_cents, product.price_pkr_paisa);
      if (price < minMinor || price > maxMinor) return false;
      return true;
    });

    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => {
          const pa = priceForCurrency(currency, a.price_usd_cents, a.price_pkr_paisa);
          const pb = priceForCurrency(currency, b.price_usd_cents, b.price_pkr_paisa);
          return pa - pb;
        });
        break;
      case "price-desc":
        list = [...list].sort((a, b) => {
          const pa = priceForCurrency(currency, a.price_usd_cents, a.price_pkr_paisa);
          const pb = priceForCurrency(currency, b.price_usd_cents, b.price_pkr_paisa);
          return pb - pa;
        });
        break;
      case "name":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return list;
  }, [products, query, activeCategory, sort, currency, priceMin, priceMax]);

  const hasFilters = Boolean(urlQuery) || Boolean(activeCategory) || priceMin > priceBounds.min || priceMax < priceBounds.max;

  function clearFilters() {
    setQuery("");
    setPriceMin(priceBounds.min);
    setPriceMax(priceBounds.max);
    updateParams({ q: "", category: "" });
  }

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    updateParams({ q: query.trim() });
  }

  const priceCurrencyLabel = currency === "USD" ? "$" : "Rs";

  const filterControls = (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="eyebrow">Category</h3>
        <ul className="mt-4 space-y-1">
          <li>
            <FilterRow active={!activeCategory} onClick={() => updateParams({ category: "" })}>
              All products
            </FilterRow>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <FilterRow
                active={activeCategory?.id === category.id}
                onClick={() => updateParams({ category: category.slug })}
              >
                {category.name}
              </FilterRow>
            </li>
          ))}
        </ul>
      </div>

      {/* Price */}
      {priceBounds.max > priceBounds.min && (
        <div>
          <h3 className="eyebrow">Price ({currency})</h3>
          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-neutral-400">
                {priceCurrencyLabel}
              </span>
              <input
                type="number"
                min={priceBounds.min}
                max={priceMax}
                value={Number.isFinite(priceMin) ? priceMin : priceBounds.min}
                onChange={(e) => setPriceMin(Math.max(priceBounds.min, Number(e.target.value) || 0))}
                aria-label={`Minimum price in ${currency}`}
                className="h-10 w-full border border-neutral-200 bg-background pl-8 pr-2 text-[13px] tabular-nums transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
              />
            </div>
            <span className="text-neutral-400" aria-hidden>—</span>
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-neutral-400">
                {priceCurrencyLabel}
              </span>
              <input
                type="number"
                min={priceMin}
                max={priceBounds.max}
                value={Number.isFinite(priceMax) ? priceMax : priceBounds.max}
                onChange={(e) =>
                  setPriceMax(Math.min(priceBounds.max, Number(e.target.value) || priceBounds.max))
                }
                aria-label={`Maximum price in ${currency}`}
                className="h-10 w-full border border-neutral-200 bg-background pl-8 pr-2 text-[13px] tabular-nums transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
              />
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={clearFilters}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-500 underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        Clear all filters <X className="h-3 w-3" aria-hidden />
      </button>
    </div>
  );

  return (
    <div className="container py-10 md:py-14">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] text-neutral-400">
        <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" aria-hidden />
        <span className="font-medium text-foreground">Shop</span>
        {activeCategory && (
          <>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <span className="font-medium text-foreground">{activeCategory.name}</span>
          </>
        )}
      </nav>

      {/* Title row */}
      <div className="mt-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow">Collection</p>
          <h1 className="mt-2 text-4xl font-light tracking-tight md:text-5xl">
            {activeCategory ? activeCategory.name : "All products"}
          </h1>
          <p className="mt-2 text-[13px] text-neutral-600">
            {results.length} {results.length === 1 ? "product" : "products"}
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-3 inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-neutral-500"
              >
                Clear filters <X className="h-3 w-3" aria-hidden />
              </button>
            )}
          </p>
        </div>

        {/* Sort (desktop) */}
        <div className="hidden items-center gap-2 md:flex">
          <label htmlFor="sort" className="sr-only">Sort products</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => {
              const value = e.target.value as SortKey;
              setSort(value);
              updateParams({ sort: value });
            }}
            className="h-10 cursor-pointer border border-neutral-200 bg-background px-3 pr-8 text-[13px] text-foreground transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 grid gap-12 lg:grid-cols-[220px_1fr] lg:gap-14">
        {/* Filter sidebar (desktop) */}
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="lg:sticky lg:top-28">
            <h2 className="eyebrow">Refine</h2>
            <div className="mt-6">{filterControls}</div>
          </div>
        </aside>

        {/* Main column */}
        <div className="min-w-0">
          {/* Mobile toolbar */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="flex h-10 items-center gap-2 border border-neutral-200 px-4 text-[13px] font-medium transition-colors hover:border-neutral-400"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
              Filter{hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden />}
            </button>
            <label htmlFor="sort-mobile" className="sr-only">Sort products</label>
            <select
              id="sort-mobile"
              value={sort}
              onChange={(e) => {
                const value = e.target.value as SortKey;
                setSort(value);
                updateParams({ sort: value });
              }}
              className="h-10 flex-1 cursor-pointer border border-neutral-200 bg-background px-3 text-[13px] text-foreground transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
            >
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} role="search" className="relative mt-4 max-w-md lg:mt-0">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the collection…"
              aria-label="Search the collection"
              className="h-11 w-full border border-neutral-200 bg-background pl-10 pr-3 text-[13px] transition-colors placeholder:text-neutral-400 hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
            />
          </form>

          {/* Category chips (mobile convenience) */}
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            <CategoryChip active={!activeCategory} onClick={() => updateParams({ category: "" })}>
              All
            </CategoryChip>
            {categories.map((category) => (
              <CategoryChip
                key={category.id}
                active={activeCategory?.id === category.id}
                onClick={() => updateParams({ category: category.slug })}
              >
                {category.name}
              </CategoryChip>
            ))}
          </div>

          {/* Results */}
          <div className="mt-8">
            {results.length > 0 ? (
              <ProductGrid products={results} />
            ) : (
              <div className="flex flex-col items-center gap-5 border border-dashed border-neutral-200 py-24 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-50">
                  <Search className="h-5 w-5 text-neutral-300" strokeWidth={1.25} aria-hidden />
                </div>
                <div>
                  <p className="font-display text-xl font-medium tracking-tight">No products found</p>
                  <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-neutral-600">
                    {hasFilters
                      ? "Try adjusting your search, category, or price range."
                      : "New products are added regularly — check back soon."}
                  </p>
                </div>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn-press inline-flex h-11 items-center justify-center bg-foreground px-6 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      {filtersOpen && (
        <div
          ref={filtersRef}
          className="fixed inset-0 z-[65] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
            className="animate-fade-in absolute inset-0 cursor-default bg-black/30 backdrop-blur-[2px]"
          />
          <div className="animate-slide-up absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto bg-background shadow-panel custom-scrollbar">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-lg font-medium tracking-tight">Filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                className="flex h-9 w-9 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-foreground"
              >
                <X className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
              </button>
            </div>
            <div className="px-5 py-6">{filterControls}</div>
            <div className="sticky bottom-0 border-t border-border bg-background px-5 py-4">
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex h-12 w-full items-center justify-center bg-foreground text-[13px] font-medium text-background transition-opacity hover:opacity-90"
              >
                Show {results.length} {results.length === 1 ? "product" : "products"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterRow({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center justify-between py-2 text-left text-[13px] transition-colors duration-200",
        active ? "font-medium text-foreground" : "text-neutral-600 hover:text-foreground",
      )}
    >
      {children}
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full transition-colors duration-200",
          active ? "bg-foreground" : "bg-neutral-200",
        )}
        aria-hidden
      />
    </button>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 shrink-0 border px-4 text-[12px] font-medium tracking-wide transition-all duration-200",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-neutral-200 bg-background text-neutral-600 hover:border-neutral-400 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export default function ShopClient({ products, categories }: { products: Product[]; categories: Category[] }) {
  return (
    <Suspense
      fallback={
        <div className="container py-14">
          <div className="skeleton h-4 w-32" />
          <div className="mt-6 skeleton h-12 w-64" />
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="skeleton aspect-[4/5]" />
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <ShopContent products={products} categories={categories} />
    </Suspense>
  );
}
