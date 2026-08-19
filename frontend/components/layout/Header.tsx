// frontend/components/layout/Header.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback, type FormEvent } from "react";
import {
  ArrowRight,
  ChevronDown,
  Clock3,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabaseClient";
import { addRecentSearch, clearRecentSearches, getRecentSearches } from "@/lib/recentSearch";
import { useDialog } from "@/lib/useDialog";
import type { Category } from "@/lib/types";
import CartDrawer from "@/components/cart/CartDrawer";
import AuthModal from "@/components/auth/AuthModal";
import CurrencySelector from "@/components/layout/CurrencySelector";
import { cn } from "@/lib/utils";

interface HeaderProps {
  categories: Category[];
}

export default function Header({ categories }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const cartCount = useStore((s) => s.cartCount());

  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [mounted, setMounted] = useState(false);

  const accountRef = useRef<HTMLDivElement | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Static export: window is unavailable during render, so we read the
  // query string after mount to compute nav active states.
  useEffect(() => setMounted(true), []);
  const searchString = mounted ? window.location.search : "";
  const isHomePage = pathname === "/";

  const mobileRef = useDialog(mobileOpen, () => setMobileOpen(false));

  // Track scroll position for header styling
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Track auth state
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      const supabase = getSupabase();
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user?.email) setUser({ email: data.session.user.email });
      });
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user?.email ? { email: session.user.email } : null);
      });
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      // Supabase not configured
    }
    return () => unsubscribe?.();
  }, []);

  // Close account dropdown on outside click
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Collapse the search dropdown when clicking elsewhere
  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowRecent(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Close the mobile menu when the route changes
  useEffect(() => setMobileOpen(false), [pathname]);

  // Short nav labels for the three SDB WEAR product families. The full
  // category names (Motorbike Gear, Leather Jackets & Biker Fashion,
  // Handcrafted Gloves) remain in the shop filters and category pages.
  const NAV_LABELS: Record<string, string> = {
    "motorbike-gear": "Motorbike",
    "leather-jackets-biker-fashion": "Leather",
    "handcrafted-gloves": "Gloves",
  };

  const topLevelCategories = categories.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, Category[]>();
  for (const category of categories) {
    if (!category.parent_id) continue;
    const siblings = childrenByParent.get(category.parent_id) ?? [];
    siblings.push(category);
    childrenByParent.set(category.parent_id, siblings);
  }

  const navLinks = [
    { label: "Shop all", href: "/shop", family: null as Category | null },
    ...topLevelCategories.map((c) => ({
      label: NAV_LABELS[c.slug] ?? c.name,
      href: `/shop?category=${c.slug}`,
      family: c,
    })),
    { label: "About", href: "/about", family: null },
    { label: "Contact", href: "/contact", family: null },
  ];

  function isNavActive(href: string): boolean {
    if (href === "/shop") {
      return pathname === "/shop" && !new URLSearchParams(searchString).get("category");
    }
    const slug = href.split("?category=")[1];
    return pathname === "/shop" && new URLSearchParams(searchString).get("category") === slug;
  }

  function refreshRecent() {
    setRecent(getRecentSearches());
  }

  const runSearch = useCallback(
    (term: string) => {
      const q = term.trim();
      if (!q) return;
      addRecentSearch(q);
      refreshRecent();
      setQuery("");
      setSearchExpanded(false);
      setShowRecent(false);
      setMobileOpen(false);
      router.push(`/shop?q=${encodeURIComponent(q)}`);
    },
    [router],
  );

  const handleSearchSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      runSearch(query);
    },
    [query, runSearch],
  );

  const toggleSearch = useCallback(() => {
    setSearchExpanded((v) => {
      const next = !v;
      if (next) {
        refreshRecent();
        setShowRecent(true);
        window.setTimeout(() => searchInputRef.current?.focus(), 120);
      } else {
        setShowRecent(false);
      }
      return next;
    });
  }, []);

  async function handleSignOut() {
    try {
      await getSupabase().auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setAccountOpen(false);
  }

  const accountInitial = user?.email?.charAt(0).toUpperCase() ?? "";

  // Dark theme for homepage, light for all other pages
  const headerBg = isHomePage
    ? (scrolled ? "border-b border-neutral-800 bg-[#080808]/95 backdrop-blur-xl" : "border-b border-transparent bg-transparent")
    : (scrolled ? "border-b border-border bg-background/95 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-xl" : "border-b border-transparent bg-background");
  const headerText = isHomePage ? "text-white" : "text-foreground";
  const headerMuted = isHomePage ? "text-neutral-400 hover:text-white" : "text-neutral-600 hover:text-foreground";
  const headerHover = isHomePage ? "hover:bg-white/5" : "hover:bg-neutral-100";
  const headerLogo = isHomePage
    ? ("font-display text-[21px] font-medium tracking-tight transition-opacity hover:opacity-70 lg:text-[24px] text-white")
    : ("font-display text-[21px] font-medium tracking-tight transition-opacity hover:opacity-70 lg:text-[24px]");
  const headerLogoAccent = isHomePage ? "font-light text-neutral-500" : "font-light text-neutral-400";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300 ease-premium",
          headerBg,
        )}
      >
        <div className="container flex h-[60px] items-center justify-between gap-4 lg:h-[68px]">
          {/* Left: mobile menu + brand */}
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className={cn("-ml-1 flex h-11 w-11 shrink-0 items-center justify-center transition-colors lg:hidden", headerText, headerHover)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
            </button>
            <Link
              href="/"
              className={headerLogo}
            >
              SDB<span className={headerLogoAccent}>WEAR</span>
            </Link>
          </div>

          {/* Center: desktop nav with family dropdowns */}
          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => {
              const isActive = isNavActive(link.href);
              const children = link.family ? (childrenByParent.get(link.family.id) ?? []) : [];
              const linkClass = cn(
                "link-underline relative py-1 text-[13px] font-medium tracking-wide transition-colors duration-200",
                isActive ? headerText : headerMuted,
              );

              if (children.length === 0) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={linkClass}
                  >
                    {link.label}
                  </Link>
                );
              }

              return (
                <div key={link.href} className="group relative">
                  <Link
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    aria-haspopup="menu"
                    className={cn(linkClass, "inline-flex items-center gap-1")}
                  >
                    {link.label}
                    <ChevronDown
                      className="h-3 w-3 text-neutral-400 transition-transform duration-200 group-hover:rotate-180"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </Link>
                  <div
                    role="menu"
                    aria-label={`${link.label} subcategories`}
                    className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 ease-premium group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                  >
                    <div className={cn("min-w-[230px] border py-2 shadow-panel-sm", isHomePage ? "border-neutral-700 bg-[#111]" : "border-border bg-background")}>
                      {children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/shop?category=${child.slug}`}
                          role="menuitem"
                          className={cn("block px-4 py-2.5 text-[13px] transition-colors", isHomePage ? "text-neutral-400 hover:bg-white/5 hover:text-white" : "text-neutral-600 hover:bg-neutral-50 hover:text-foreground")}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Right: search + currency + account + cart */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Desktop search with recent searches */}
            <div ref={searchBoxRef} className="relative hidden md:block">
              <form onSubmit={handleSearchSubmit} role="search" aria-label="Search products">
                <div
                  className={cn(
                    "flex items-center overflow-hidden transition-all duration-300 ease-premium",
                    searchExpanded
                      ? (isHomePage ? "w-72 border border-neutral-700 bg-[#111] shadow-panel-sm" : "w-72 border border-neutral-200 bg-background shadow-panel-sm")
                      : "w-10 border border-transparent",
                  )}
                >
                  <button
                    type={searchExpanded ? "submit" : "button"}
                    onClick={searchExpanded ? undefined : toggleSearch}
                    className={cn("flex h-10 w-10 shrink-0 items-center justify-center transition-colors", headerMuted)}
                    aria-label={searchExpanded ? "Search" : "Open search"}
                  >
                    <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </button>
                  {searchExpanded && (
                    <>
                      <input
                        ref={searchInputRef}
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => {
                          refreshRecent();
                          setShowRecent(true);
                        }}
                        placeholder="Search the collection…"
                        aria-label="Search products"
                        className={cn("h-10 w-full min-w-0 bg-transparent pr-1 text-[13px] focus:outline-none", isHomePage ? "placeholder:text-neutral-600 text-white" : "placeholder:text-neutral-400 text-foreground")}
                      />
                      {query && (
                        <button
                          type="button"
                          onClick={() => setQuery("")}
                          className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center text-neutral-400 transition-colors hover:text-foreground"
                          aria-label="Clear search"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </form>

              {searchExpanded && showRecent && recent.length > 0 && (
                <div className={cn("absolute right-0 top-[calc(100%+6px)] w-72 border shadow-panel", isHomePage ? "border-neutral-700 bg-[#111]" : "border-border bg-background")}>
                  <div className="flex items-center justify-between px-4 pb-1 pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                      Recent searches
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        clearRecentSearches();
                        refreshRecent();
                      }}
                      className="flex h-6 w-6 items-center justify-center text-neutral-500 transition-colors hover:text-red-500"
                      aria-label="Clear recent searches"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                    </button>
                  </div>
                  <ul className="pb-2">
                    {recent.map((term) => (
                      <li key={term}>
                        <button
                          type="button"
                          onClick={() => runSearch(term)}
                          className={cn("flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors", isHomePage ? "text-neutral-400 hover:bg-white/5 hover:text-white" : "text-neutral-700 hover:bg-neutral-50 hover:text-foreground")}
                        >
                          <Clock3 className="h-3.5 w-3.5 shrink-0 text-neutral-500" strokeWidth={1.5} aria-hidden />
                          <span className="truncate">{term}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Currency selector */}
            <div className="hidden items-center sm:flex">
              <CurrencySelector dark={isHomePage} />
            </div>

            {/* Account */}
            <div className="relative" ref={accountRef}>
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setAccountOpen((v) => !v)}
                    aria-label="Account menu"
                    aria-expanded={accountOpen}
                    aria-haspopup="menu"
                    className={cn("flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold transition-colors", isHomePage ? "border border-neutral-600 bg-neutral-800 text-neutral-300 hover:border-white/40 hover:text-white" : "border border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-foreground hover:text-foreground")}
                  >
                    {accountInitial}
                  </button>
                  {accountOpen && (
                    <div
                      role="menu"
                      aria-label="Account"
                      className={cn("animate-scale-in absolute right-0 top-[calc(100%+6px)] z-50 w-64 border py-1.5 shadow-panel", isHomePage ? "border-neutral-700 bg-[#111]" : "border-border bg-background")}
                    >
                      <p className={cn("mb-1 truncate px-4 py-2.5 text-[12px]", isHomePage ? "border-b border-neutral-700 text-neutral-500" : "border-b border-border text-neutral-400")}>
                        {user.email}
                      </p>
                      <Link
                        href="/account"
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                        className={cn("flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors", isHomePage ? "text-neutral-400 hover:bg-white/5 hover:text-white" : "hover:bg-neutral-50")}
                      >
                        <Package className="h-4 w-4 text-neutral-500" strokeWidth={1.5} aria-hidden /> My orders
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleSignOut}
                        className={cn("flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors", isHomePage ? "text-neutral-400 hover:bg-white/5 hover:text-white" : "hover:bg-neutral-50")}
                      >
                        <LogOut className="h-4 w-4 text-neutral-500" strokeWidth={1.5} aria-hidden /> Sign out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className={cn("flex h-10 w-10 items-center justify-center transition-colors", headerMuted, headerHover)}
                  aria-label="Sign in"
                >
                  <User className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
                </button>
              )}
            </div>

            {/* Cart */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className={cn("relative flex h-10 w-10 items-center justify-center transition-colors", headerMuted, headerHover)}
              aria-label={`Open cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
              {cartCount > 0 && (
                <span
                  key={cartCount}
                  className={cn("animate-scale-in absolute right-0 top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold tabular-nums leading-none", isHomePage ? "bg-white text-black" : "bg-foreground text-background")}
                  aria-live="polite"
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          ref={mobileRef}
          className="fixed inset-0 z-[60] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="animate-fade-in absolute inset-0 cursor-default bg-black/30 backdrop-blur-[2px]"
          />
          <div className={cn("animate-slide-in-right absolute inset-y-0 right-0 flex w-[86%] max-w-[380px] flex-col shadow-panel", isHomePage ? "bg-[#0a0a0a]" : "bg-background")}>
            {/* Header */}
            <div className={cn("flex items-center justify-between border-b px-5 py-4", isHomePage ? "border-neutral-800" : "border-border")}>
              <span className="font-display text-lg font-medium tracking-tight text-white">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center text-neutral-500 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
              </button>
            </div>

            {/* Mobile search */}
            <form onSubmit={handleSearchSubmit} role="search" className={cn("border-b px-5 py-4", isHomePage ? "border-neutral-800" : "border-border")}>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500"
                  aria-hidden
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the collection"
                  aria-label="Search products"
                  className={cn("h-11 w-full pl-9 pr-3 text-[13px] placeholder:text-neutral-500 focus:outline-none focus:ring-0", isHomePage ? "border border-neutral-700 bg-neutral-900 text-white focus:border-neutral-500" : "border border-neutral-200 bg-neutral-50 focus:border-foreground")}
                />
              </div>
            </form>

            {/* Nav links */}
            <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
              <ul className="space-y-0.5">
                {navLinks.map((link, index) => {
                  const isActive = isNavActive(link.href);
                  return (
                    <li key={link.href} className="animate-fade-up" style={{ animationDelay: `${index * 45}ms` }}>
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center justify-between rounded px-3 py-3.5 text-[15px] font-medium transition-colors",
                          isHomePage
                            ? (isActive ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white")
                            : (isActive ? "bg-neutral-100 text-foreground" : "text-neutral-700 hover:bg-neutral-50 hover:text-foreground"),
                        )}
                      >
                        {link.label}
                        <ArrowRight
                          className={cn("h-4 w-4 transition-colors", isActive ? "text-foreground" : "text-neutral-300")}
                          aria-hidden
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className={cn("my-4 border-t", isHomePage ? "border-neutral-800" : "border-border")} />

              <div className="space-y-0.5">
                {/* Mobile currency */}
                <div className="flex items-center gap-1 px-3 py-2">
                  <CurrencySelector dark={isHomePage} />
                </div>

                {user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 rounded px-3 py-3.5 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-foreground"
                    >
                      <Package className="h-4 w-4 text-neutral-400" strokeWidth={1.5} aria-hidden /> My orders
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        handleSignOut();
                      }}
                      className="flex w-full items-center gap-2.5 rounded px-3 py-3.5 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-foreground"
                    >
                      <LogOut className="h-4 w-4 text-neutral-400" strokeWidth={1.5} aria-hidden /> Sign out
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setAuthOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded px-3 py-3.5 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-foreground"
                  >
                    <User className="h-4 w-4 text-neutral-400" strokeWidth={1.5} aria-hidden /> Sign in
                  </button>
                )}
              </div>
            </nav>

            {/* Mobile cart CTA */}
            <div className={cn("border-t px-5 py-4", isHomePage ? "border-neutral-800" : "border-border")}>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setCartOpen(true);
                }}
                className={cn("flex h-12 w-full items-center justify-center gap-2 text-[13px] font-medium transition-opacity hover:opacity-90", isHomePage ? "bg-white text-black" : "bg-foreground text-background")}
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                View cart {cartCount > 0 && `(${cartCount})`}
              </button>
            </div>
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} context="signin" />
    </>
  );
}
