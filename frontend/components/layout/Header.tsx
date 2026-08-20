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
  const [navVisible, setNavVisible] = useState(false);

  const accountRef = useRef<HTMLDivElement | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setMounted(true), []);
  const searchString = mounted ? window.location.search : "";
  const isHomePage = pathname === "/";

  const mobileRef = useDialog(mobileOpen, () => setMobileOpen(false));

  // Track scroll position for header styling
  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setScrolled(y > 8);
      // On homepage, fade in nav after small scroll (cinematic feel)
      if (isHomePage) {
        setNavVisible(y > 40);
      } else {
        setNavVisible(true);
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHomePage]);

  // On homepage, show nav after loading screen
  useEffect(() => {
    if (!isHomePage) return;
    const timer = window.setTimeout(() => setNavVisible(true), 2500);
    return () => clearTimeout(timer);
  }, [isHomePage]);

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

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowRecent(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const NAV_LABELS: Record<string, string> = {
    "motorbike-gear": "Moto Suits",
    "leather-jackets-biker-fashion": "Jackets",
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
    { label: "Shop All", href: "/shop", family: null as Category | null },
    ...topLevelCategories.map((c) => ({
      label: NAV_LABELS[c.slug] ?? c.name,
      href: `/shop?category=${c.slug}`,
      family: c,
    })),
    { label: "About", href: "/about", family: null },
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

  // Always dark theme
  const headerBg = scrolled
    ? "border-b border-white/[0.06] bg-black/90 backdrop-blur-xl"
    : "border-b border-transparent bg-transparent";
  const headerText = "text-white";
  const headerMuted = "text-neutral-400 hover:text-white";
  const headerHover = "hover:bg-white/5";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-500 ease-premium",
          headerBg,
          isHomePage && !navVisible && "opacity-0 pointer-events-none",
          isHomePage && navVisible && "opacity-100",
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
              className="font-display text-[21px] font-medium tracking-tight transition-opacity hover:opacity-70 lg:text-[24px] text-white"
            >
              RACE<span className="font-light text-neutral-500">VOR</span>
            </Link>
          </div>

          {/* Center: desktop nav */}
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
                      className="h-3 w-3 text-neutral-500 transition-transform duration-200 group-hover:rotate-180"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </Link>
                  <div
                    role="menu"
                    aria-label={`${link.label} subcategories`}
                    className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 ease-premium group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
                  >
                    <div className="min-w-[230px] border border-white/[0.06] bg-[#0a0a0a] py-2 shadow-panel-sm">
                      {children.map((child) => (
                        <Link
                          key={child.id}
                          href={`/shop?category=${child.slug}`}
                          role="menuitem"
                          className="block px-4 py-2.5 text-[13px] text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
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
            {/* Desktop search */}
            <div ref={searchBoxRef} className="relative hidden md:block">
              <form onSubmit={handleSearchSubmit} role="search" aria-label="Search products">
                <div
                  className={cn(
                    "flex items-center overflow-hidden transition-all duration-300 ease-premium",
                    searchExpanded
                      ? "w-72 border border-white/[0.08] bg-[#0a0a0a] shadow-panel-sm"
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
                        className="h-10 w-full min-w-0 bg-transparent pr-1 text-[13px] text-white placeholder:text-neutral-600 focus:outline-none"
                      />
                      {query && (
                        <button
                          type="button"
                          onClick={() => setQuery("")}
                          className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center text-neutral-400 transition-colors hover:text-white"
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
                <div className="absolute right-0 top-[calc(100%+6px)] w-72 border border-white/[0.06] bg-[#0a0a0a] shadow-panel">
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
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13px] text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
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
              <CurrencySelector dark />
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
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold border border-neutral-600 bg-neutral-800 text-neutral-300 transition-colors hover:border-white/40 hover:text-white"
                  >
                    {accountInitial}
                  </button>
                  {accountOpen && (
                    <div
                      role="menu"
                      aria-label="Account"
                      className="animate-scale-in absolute right-0 top-[calc(100%+6px)] z-50 w-64 border border-white/[0.06] bg-[#0a0a0a] py-1.5 shadow-panel"
                    >
                      <p className="mb-1 truncate px-4 py-2.5 text-[12px] border-b border-white/[0.06] text-neutral-500">
                        {user.email}
                      </p>
                      <Link
                        href="/account"
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <Package className="h-4 w-4 text-neutral-500" strokeWidth={1.5} aria-hidden /> My orders
                      </Link>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
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
                  className="animate-scale-in absolute right-0 top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold tabular-nums leading-none text-black"
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
            className="animate-fade-in absolute inset-0 cursor-default bg-black/40 backdrop-blur-[2px]"
          />
          <div className="animate-slide-in-right absolute inset-y-0 right-0 flex w-[86%] max-w-[380px] flex-col bg-[#050505] shadow-panel">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
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
            <form onSubmit={handleSearchSubmit} role="search" className="border-b border-white/[0.06] px-5 py-4">
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
                  className="h-11 w-full border border-white/[0.08] bg-neutral-900 pl-9 pr-3 text-[13px] text-white placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none focus:ring-0"
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
                          isActive ? "bg-white/10 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        {link.label}
                        <ArrowRight
                          className={cn("h-4 w-4 transition-colors", isActive ? "text-white" : "text-neutral-600")}
                          aria-hidden
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <div className="my-4 border-t border-white/[0.06]" />

              <div className="space-y-0.5">
                <div className="flex items-center gap-1 px-3 py-2">
                  <CurrencySelector dark />
                </div>

                {user ? (
                  <>
                    <Link
                      href="/account"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 rounded px-3 py-3.5 text-[13px] font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <Package className="h-4 w-4 text-neutral-500" strokeWidth={1.5} aria-hidden /> My orders
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        handleSignOut();
                      }}
                      className="flex w-full items-center gap-2.5 rounded px-3 py-3.5 text-[13px] font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <LogOut className="h-4 w-4 text-neutral-500" strokeWidth={1.5} aria-hidden /> Sign out
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setAuthOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded px-3 py-3.5 text-[13px] font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <User className="h-4 w-4 text-neutral-500" strokeWidth={1.5} aria-hidden /> Sign in
                  </button>
                )}
              </div>
            </nav>

            {/* Mobile cart CTA */}
            <div className="border-t border-white/[0.06] px-5 py-4">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setCartOpen(true);
                }}
                className="flex h-12 w-full items-center justify-center gap-2 bg-white text-[13px] font-medium text-black transition-opacity hover:opacity-90"
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
