// frontend/components/shop/ShopClient.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import ProductGrid from "@/components/product/ProductGrid";
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

  const urlQuery = searchParams.get("q") ?? "";
  const urlCategory = searchParams.get("category") ?? "";
  const urlSort = (searchParams.get("sort") as SortKey | null) ?? "featured";

  const [query, setQuery] = useState(urlQuery);
  const [sort, setSort] = useState<SortKey>(urlSort);

  // Keep local state in sync when the URL changes (back/forward, nav links)
  useEffect(() => {
    setQuery(urlQuery);
    setSort(urlSort);
  }, [urlQuery, urlSort]);

  function updateParams(next: { q?: string; category?: string; sort?: SortKey }) {
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
  }

  const activeCategory =
    categories.find((c) => c.slug === urlCategory) ?? null;

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    let list = products.filter((product) => {
      if (activeCategory && product.category_id !== activeCategory.id) return false;
      if (!term) return true;
      return (
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)
      );
    });

    switch (sort) {
      case "price-asc":
        list = [...list].sort((a, b) => a.price_usd_cents - b.price_usd_cents);
        break;
      case "price-desc":
        list = [...list].sort((a, b) => b.price_usd_cents - a.price_usd_cents);
        break;
      case "name":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return list;
  }, [products, query, activeCategory, sort]);

  const hasFilters = Boolean(urlQuery) || Boolean(activeCategory);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    updateParams({ q: query.trim() });
  }

  return (
    <div className="container py-10 md:py-14">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-400">
        <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" aria-hidden />
        <span className="text-foreground">Shop</span>
        {activeCategory && (
          <>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <span className="text-foreground">{activeCategory.name}</span>
          </>
        )}
      </nav>

      {/* Title row */}
      <div className="mt-6 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="eyebrow text-neutral-400">Collection</p>
          <h1 className="mt-2 text-4xl font-light tracking-tight md:text-5xl">
            {activeCategory ? activeCategory.name : "All products"}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {results.length} {results.length === 1 ? "product" : "products"}
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  updateParams({ q: "", category: "" });
                }}
                className="ml-3 inline-flex items-center gap-1 text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-500"
              >
                Clear filters <X className="h-3 w-3" aria-hidden />
              </button>
            )}
          </p>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-3">
          <label htmlFor="sort" className="sr-only">Sort products</label>
          <SlidersHorizontal className="h-4 w-4 text-neutral-400" aria-hidden />
          <select
            id="sort"
            value={sort}
            onChange={(e) => {
              const value = e.target.value as SortKey;
              setSort(value);
              updateParams({ sort: value });
            }}
            className="h-10 cursor-pointer rounded-sm border border-border bg-background px-3 pr-8 text-sm text-foreground transition-colors hover:border-foreground/40 focus:border-foreground focus:outline-none focus:ring-0"
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category chips */}
      <div className="no-scrollbar mt-7 flex gap-2 overflow-x-auto pb-1">
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

      {/* Search */}
      <form onSubmit={handleSearch} role="search" className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the collection…"
          aria-label="Search the collection"
          className="h-11 w-full rounded-sm border border-border bg-background pl-10 pr-3 text-sm transition-colors placeholder:text-neutral-400 hover:border-foreground/40 focus:border-foreground focus:outline-none focus:ring-0"
        />
      </form>

      {/* Results */}
      <div className="mt-10">
        {results.length > 0 ? (
          <ProductGrid products={results} />
        ) : (
          <div className="flex flex-col items-center gap-5 border border-dashed border-border py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-50">
              <Search className="h-5 w-5 text-neutral-400" strokeWidth={1.5} aria-hidden />
            </div>
            <div>
              <p className="font-display text-xl font-medium tracking-tight">No products found</p>
              <p className="mx-auto mt-1.5 max-w-xs text-sm text-neutral-500">
                {hasFilters
                  ? "Try adjusting your search or filters."
                  : "New products are added regularly — check back soon."}
              </p>
            </div>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  updateParams({ q: "", category: "" });
                }}
                className="inline-flex h-11 items-center justify-center bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-85"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
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
        "h-9 shrink-0 rounded-full border px-4 text-[13px] font-medium transition-all duration-200",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-neutral-600 hover:border-foreground/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export default function ShopClient({ products, categories }: { products: Product[]; categories: Category[] }) {
  return (
    <Suspense fallback={<div className="container py-24 text-center text-sm text-neutral-400">Loading shop…</div>}>
      <ShopContent products={products} categories={categories} />
    </Suspense>
  );
}
