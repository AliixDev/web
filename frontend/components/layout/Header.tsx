// frontend/components/layout/Header.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useCallback, type FormEvent } from "react";
import { Globe, LogOut, Menu, Package, Search, ShoppingBag, User, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { getSupabase } from "@/lib/supabaseClient";
import type { Category } from "@/lib/types";
import CartDrawer from "@/components/cart/CartDrawer";
import AuthModal from "@/components/auth/AuthModal";
import { cn } from "@/lib/utils";

interface HeaderProps {
  categories: Category[];
}

export default function Header({ categories }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const currency = useStore((s) => s.currency);
  const setCurrency = useStore((s) => s.setCurrency);
  const cartCount = useStore((s) => s.cartCount());

  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => setMobileOpen(false), [pathname]);

  const handleSearch = useCallback((e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setMobileOpen(false);
    setSearchExpanded(false);
    router.push(`/shop?q=${encodeURIComponent(q)}`);
  }, [query, router]);

  const toggleSearch = useCallback(() => {
    setSearchExpanded((v) => !v);
    if (!searchExpanded) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchExpanded]);

  async function handleSignOut() {
    try {
      await getSupabase().auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setAccountOpen(false);
  }

  const navLinks = [
    { label: "Shop all", href: "/shop" },
    ...categories.map((c) => ({ label: c.name, href: `/shop?category=${c.slug}` })),
  ];

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300 ease-premium",
          scrolled
            ? "border-b border-border/60 bg-background/95 backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            : "border-b border-transparent bg-background",
        )}
      >
        <div className="container flex h-[60px] items-center justify-between gap-4 lg:h-[68px]">
          {/* Left: mobile menu + brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="-ml-1 flex h-11 w-11 items-center justify-center text-foreground transition-colors hover:bg-neutral-100 lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
            </button>
            <Link
              href="/"
              className="font-display text-[22px] font-medium tracking-tight transition-opacity hover:opacity-70 lg:text-[24px]"
            >
              Sitara<span className="font-light opacity-50">Souq</span>
            </Link>
          </div>

          {/* Center: desktop nav */}
          <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => {
              const isActive =
                (pathname === "/shop" && link.href === "/shop") ||
                (link.href.includes("?category=") && pathname === "/shop" && decodeURIComponent(window?.location?.search).includes(link.href.split("?category=")[1]));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative py-1 text-[13px] font-medium tracking-wide transition-colors duration-200",
                    pathname === link.href
                      ? "text-foreground"
                      : "text-neutral-500 hover:text-foreground",
                  )}
                >
                  {link.label}
                  {pathname === link.href && (
                    <span className="absolute -bottom-[1px] left-0 right-0 h-px bg-foreground" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: search + currency + account + cart */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Desktop search */}
            <form onSubmit={handleSearch} role="search" className="relative hidden md:block">
              <div
                className={cn(
                  "flex items-center overflow-hidden transition-all duration-300 ease-premium",
                  searchExpanded
                    ? "w-64 border border-neutral-200 bg-neutral-50/80"
                    : "w-10 border border-transparent bg-transparent hover:bg-neutral-100",
                )}
              >
                <button
                  type={searchExpanded ? "submit" : "button"}
                  onClick={searchExpanded ? undefined : toggleSearch}
                  className="flex h-10 w-10 shrink-0 items-center justify-center text-neutral-500 transition-colors hover:text-foreground"
                  aria-label={searchExpanded ? "Search" : "Open search"}
                >
                  <Search className="h-[16px] w-[16px]" strokeWidth={1.75} aria-hidden />
                </button>
                {searchExpanded && (
                  <>
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search products…"
                      aria-label="Search products"
                      className="h-10 w-full bg-transparent pr-3 text-[13px] placeholder:text-neutral-400 focus:outline-none"
                      onBlur={() => {
                        if (!query) setSearchExpanded(false);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setSearchExpanded(false);
                      }}
                      className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center text-neutral-400 hover:text-foreground"
                      aria-label="Close search"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </>
                )}
              </div>
            </form>

            {/* Currency toggle */}
            <button
              type="button"
              onClick={() => setCurrency(currency === "USD" ? "PKR" : "USD")}
              className="hidden h-10 items-center gap-1.5 rounded px-2 text-[12px] font-semibold tracking-wider text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-foreground sm:flex"
              aria-label={`Switch currency, currently ${currency}`}
            >
              <Globe className="h-[15px] w-[15px]" strokeWidth={1.5} aria-hidden />
              {currency}
            </button>

            {/* Account */}
            <div className="relative" ref={accountRef}>
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={() => setAccountOpen((v) => !v)}
                    aria-label="Account menu"
                    aria-expanded={accountOpen}
                    className="flex h-10 w-10 items-center justify-center rounded text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-foreground"
                  >
                    <User className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
                  </button>
                  {accountOpen && (
                    <div className="animate-scale-in absolute right-0 top-[calc(100%+4px)] z-50 w-64 border border-border bg-background py-1.5 shadow-panel">
                      <p className="truncate px-4 py-2.5 text-[13px] text-neutral-400 border-b border-border mb-1">{user.email}</p>
                      <Link
                        href="/account"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-neutral-50"
                      >
                        <Package className="h-4 w-4 text-neutral-400" strokeWidth={1.5} aria-hidden /> My orders
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-neutral-50"
                      >
                        <LogOut className="h-4 w-4 text-neutral-400" strokeWidth={1.5} aria-hidden /> Sign out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-foreground"
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
              className="relative flex h-10 w-10 items-center justify-center rounded text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-foreground"
              aria-label={`Open cart, ${cartCount} items`}
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
              {cartCount > 0 && (
                <span
                  key={cartCount}
                  className="animate-scale-in absolute right-0 top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-foreground px-1 text-[9px] font-bold tabular-nums text-background leading-none"
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
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="animate-fade-in absolute inset-0 cursor-default bg-black/30 backdrop-blur-[2px]"
          />
          <div className="animate-slide-in-right absolute inset-y-0 right-0 flex w-[85%] max-w-[360px] flex-col bg-background shadow-panel">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <span className="font-display text-lg font-medium tracking-tight">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-foreground"
              >
                <X className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
              </button>
            </div>

            {/* Mobile search */}
            <form onSubmit={handleSearch} role="search" className="border-b border-border px-6 py-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products"
                  aria-label="Search products"
                  className="h-11 w-full border border-neutral-200 bg-neutral-50 pl-9 pr-3 text-[13px] placeholder:text-neutral-400 focus:border-foreground focus:outline-none focus:ring-0"
                />
              </div>
            </form>

            {/* Nav links */}
            <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
              <ul className="space-y-0.5">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center justify-between rounded px-3 py-3.5 text-[15px] font-medium transition-colors",
                        pathname === link.href
                          ? "bg-neutral-100 text-foreground"
                          : "text-neutral-600 hover:bg-neutral-50 hover:text-foreground",
                      )}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="my-5 border-t border-border" />

              <button
                type="button"
                onClick={() => setCurrency(currency === "USD" ? "PKR" : "USD")}
                className="flex w-full items-center gap-2.5 rounded px-3 py-3.5 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-foreground"
              >
                <Globe className="h-4 w-4 text-neutral-400" strokeWidth={1.5} aria-hidden />
                Currency: <span className="text-foreground">{currency}</span>
              </button>

              {user ? (
                <div className="space-y-0.5">
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 rounded px-3 py-3.5 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-foreground"
                  >
                    <Package className="h-4 w-4 text-neutral-400" strokeWidth={1.5} aria-hidden /> My orders
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      handleSignOut();
                    }}
                    className="flex w-full items-center gap-2.5 rounded px-3 py-3.5 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-foreground"
                  >
                    <LogOut className="h-4 w-4 text-neutral-400" strokeWidth={1.5} aria-hidden /> Sign out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setAuthOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded px-3 py-3.5 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-foreground"
                >
                  <User className="h-4 w-4 text-neutral-400" strokeWidth={1.5} aria-hidden /> Sign in
                </button>
              )}
            </nav>

            {/* Mobile cart CTA */}
            <div className="border-t border-border px-6 py-5">
              <Link
                href="/cart"
                onClick={() => setMobileOpen(false)}
                className="flex h-12 items-center justify-center bg-foreground text-[13px] font-medium text-background transition-opacity hover:opacity-90"
              >
                View cart {cartCount > 0 && `(${cartCount})`}
              </Link>
            </div>
          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} context="signin" />
    </>
  );
}
