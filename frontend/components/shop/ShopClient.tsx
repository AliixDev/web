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

type SortKey = "newest" | "price-asc" | "price-desc" | "name";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name: A–Z",
};

/** Editorial one-liners shown under each category header. */
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "motorbike-gear":
    "Protection and performance gear built around the demands of the ride.",
  "moto-suits": "Professional riding suits — one-piece and two-piece, built for the track and the road.",
  "moto-gloves": "Protective riding gloves engineered for grip, control, and confidence.",
  "moto-shoes": "Protective riding footwear that looks as good off the bike as it works on it.",
  "leather-jackets-biker-fashion":
    "Timeless leather built for the road and beyond.",
  "biker-leather-jackets": "Classic biker cuts in full-grain leather, made to age well.",
  "casual-leather-jackets": "Clean, minimal leather for everyday wear.",
  "heritage-leather": "Heritage silhouettes with racing lineage and modern construction.",
  "racing-inspired-jackets": "Racing-inspired paneling and perforation, tuned for the street.",
  "biker-fashion": "Leather with a fashion-forward edge — vests and jackets with attitude.",
  "handcrafted-gloves":
    "Stitched construction. Serious feel. Built for the hand.",
  "leather-gloves": "Everyday stitched leather gloves with workshop-built construction.",
  "riding-gloves": "Stitched riding gloves for the hand that holds the bars.",
  "driving-gloves": "Classic stitched driving gloves with a ventilated backhand.",
  "work-gloves": "Reinforced stitched gloves for the workshop and the worksite.",
  "fashion-gloves": "Slim-profile stitched gloves designed to be seen.",
  "mechanic-gloves": "Grippy, snug stitched gloves for the mechanic.",
  "tactical-gloves": "Tactical-style stitched gloves with a precise, tailored feel.",
  "custom-gloves": "Stitched gloves made to your measurements — choose the leather and the fit.",
};

function ShopContent({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currency = useStore((s) => s.currency);

  const urlQuery = searchParams.get("q") ?? "";
  const urlCategory = searchParams.get("category") ?? "";
  const urlSort = (searchParams.get("sort") as SortKey | null) ?? "newest";

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
      if (next.sort !== undefined && next.sort !== "newest") params.set("sort", next.sort);
      else if (next.sort === "newest") params.delete("sort");
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const activeCategory = categories.find((c) => c.slug === urlCategory) ?? null;

  // Subcategory support: categories may be nested (parent_id). The nav and
  // filter lists show top-level categories; when a top-level category is
  // active, its subcategories are revealed beneath it. Selecting a parent
  // matches products from itself and all of its children.
  const categoryNameById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );
  const topLevelCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const activeTopLevel =
    activeCategory && activeCategory.parent_id
      ? (categories.find((c) => c.id === activeCategory!.parent_id) ?? null)
      : activeCategory;
  const subcategoriesOf = useCallback(
    (category: Category | null) =>
      category ? categories.filter((c) => c.parent_id === category.id) : [],
    [categories],
  );
  const filterCategoryIds = useMemo(() => {
    if (!activeCategory) return null;
    if (activeCategory.parent_id) return [activeCategory.id];
    return [activeCategory.id, ...subcategoriesOf(activeCategory).map((c) => c.id)];
  }, [activeCategory, subcategoriesOf]);

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
      if (filterCategoryIds && (product.category_id === null || !filterCategoryIds.includes(product.category_id))) {
        return false;
      }
      if (term) {
        const haystack = `${product.name} ${product.description} ${categoryNameById.get(
          product.category_id ?? "",
        ) ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      const price = priceForCurrency(currency, product.price_usd_cents, product.price_pkr_paisa);
      if (price < minMinor || price > maxMinor) return false;
      return true;
    });

    switch (sort) {
      case "newest":
        list = [...list].sort((a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
        );
        break;
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
  }, [products, query, filterCategoryIds, sort, currency, priceMin, priceMax, categoryNameById]);

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

  // Currency symbol for price inputs — derived from the selected currency
  const priceCurrencyLabel = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency + " ";

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
          {topLevelCategories.map((category) => {
            const children = subcategoriesOf(category);
            const isActiveTop = activeTopLevel?.id === category.id;
            return (
              <li key={category.id}>
                <FilterRow
                  active={isActiveTop}
                  onClick={() => updateParams({ category: category.slug })}
                >
                  {category.name}
                </FilterRow>
                {isActiveTop && children.length > 0 && (
                  <ul className="ml-3 border-l border-neutral-200 pl-3">
                    {children.map((child) => (
                      <li key={child.id}>
                        <FilterRow
                          active={activeCategory?.id === child.id}
                          onClick={() => updateParams({ category: child.slug })}
                        >
                          {child.name}
                        </FilterRow>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
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
        {activeTopLevel && (
          <>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <span className="font-medium text-foreground">{activeTopLevel.name}</span>
          </>
        )}
        {activeCategory && activeCategory.parent_id && (
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
          {(CATEGORY_DESCRIPTIONS[activeCategory?.slug ?? ""] ??
            CATEGORY_DESCRIPTIONS[activeTopLevel?.slug ?? ""]) && (
            <p className="mt-3 max-w-lg text-[13px] leading-[1.7] text-neutral-600">
              {CATEGORY_DESCRIPTIONS[activeCategory?.slug ?? ""] ??
                CATEGORY_DESCRIPTIONS[activeTopLevel?.slug ?? ""]}
            </p>
          )}
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
          <div className="mt-4 lg:hidden">
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              <CategoryChip active={!activeCategory} onClick={() => updateParams({ category: "" })}>
                All
              </CategoryChip>
              {topLevelCategories.map((category) => (
                <CategoryChip
                  key={category.id}
                  active={activeTopLevel?.id === category.id}
                  onClick={() => updateParams({ category: category.slug })}
                >
                  {category.name}
                </CategoryChip>
              ))}
            </div>
            {activeTopLevel && subcategoriesOf(activeTopLevel).length > 0 && (
              <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
                {subcategoriesOf(activeTopLevel).map((child) => (
                  <CategoryChip
                    key={child.id}
                    active={activeCategory?.id === child.id}
                    onClick={() => updateParams({ category: child.slug })}
                  >
                    {child.name}
                  </CategoryChip>
                ))}
              </div>
            )}
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
