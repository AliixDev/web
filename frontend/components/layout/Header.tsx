// frontend/components/layout/Header.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
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
  const accountRef = useRef<HTMLDivElement | null>(null);

  // Track auth state (runtime only — safe for static export)
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
      // Supabase not configured — header renders without auth
    }
    return () => unsubscribe?.();
  }, []);

  // Close the account dropdown on outside click
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

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setMobileOpen(false);
    router.push(`/shop?q=${encodeURIComponent(q)}`);
  }

  async function handleSignOut() {
    try {
      await getSupabase().auth.signOut();
    } catch {
      // ignore — state resets below regardless
    }
    setUser(null);
    setAccountOpen(false);
  }

  const navLinks = [{ label: "Shop all", href: "/shop" }, ...categories.map((c) => ({ label: c.name, href: `/shop?category=${c.slug}` }))];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-4">
          {/* Left: mobile menu + brand */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="-ml-2 flex h-10 w-10 items-center justify-center text-foreground transition-colors hover:bg-accent lg:hidden"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
            <Link href="/" className="font-display text-[22px] font-medium tracking-tight">
              Sitara<span className="font-light opacity-60">Souq</span>
            </Link>
          </div>

          {/* Center: desktop nav */}
          <nav aria-label="Primary" className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-[13px] font-medium tracking-wide transition-colors hover:text-foreground/60",
                  pathname === "/shop" && link.href === "/shop" ? "text-foreground underline decoration-foreground/40 underline-offset-8" : "text-foreground/70",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: search + currency + account + cart */}
          <div className="flex items-center gap-1 sm:gap-2">
            <form onSubmit={handleSearch} role="search" className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
                aria-label="Search products"
                className="h-10 w-44 rounded-sm border border-transparent bg-transparent pl-9 pr-3 text-sm transition-all duration-300 placeholder:text-neutral-400 hover:border-border focus:w-60 focus:border-foreground focus:outline-none focus:ring-0 lg:w-52"
              />
            </form>

            <button
              type="button"
              onClick={() => setCurrency(currency === "USD" ? "PKR" : "USD")}
              className="hidden h-10 items-center gap-1.5 rounded-sm px-2.5 text-[13px] font-medium text-foreground/80 transition-colors hover:bg-accent sm:flex"
              aria-label={`Switch currency, currently ${currency}`}
            >
              <Globe className="h-4 w-4" aria-hidden />
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
                    className="flex h-10 w-10 items-center justify-center rounded-sm transition-colors hover:bg-accent"
                  >
                    <User className="h-[18px] w-[18px]" aria-hidden />
                  </button>
                  {accountOpen && (
                    <div className="animate-scale-in absolute right-0 top-11 z-50 w-64 border border-border bg-background py-2 shadow-panel">
                      <p className="truncate px-4 py-2 text-sm text-neutral-500">{user.email}</p>
                      <div className="my-1 border-t border-border" />
                      <Link
                        href="/account"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-accent"
                      >
                        <Package className="h-4 w-4 text-neutral-400" aria-hidden /> My orders
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-accent"
                      >
                        <LogOut className="h-4 w-4 text-neutral-400" aria-hidden /> Sign out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-sm transition-colors hover:bg-accent"
                  aria-label="Sign in"
                >
                  <User className="h-[18px] w-[18px]" aria-hidden />
                </button>
              )}
            </div>

            {/* Cart */}
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex h-10 w-10 items-center justify-center rounded-sm transition-colors hover:bg-accent"
              aria-label={`Open cart, ${cartCount} items`}
            >
              <ShoppingBag className="h-[18px] w-[18px]" aria-hidden />
              {cartCount > 0 && (
                <span
                  key={cartCount}
                  className="animate-scale-in absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-semibold tabular-nums text-background"
                  aria-live="polite"
                >
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="animate-fade-in absolute inset-0 cursor-default bg-black/30 backdrop-blur-[2px]"
          />
          <div className="animate-slide-in-right absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-background shadow-panel">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <span className="font-display text-xl font-medium tracking-tight">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center text-neutral-500 transition-colors hover:bg-accent"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSearch} role="search" className="border-b border-border px-6 py-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products"
                  aria-label="Search products"
                  className="h-11 w-full rounded-sm border border-border bg-neutral-50 pl-9 pr-3 text-sm focus:border-foreground focus:outline-none focus:ring-0"
                />
              </div>
            </form>

            <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-6 py-4">
              <ul className="space-y-1">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between rounded-sm px-2 py-3 font-display text-lg font-normal tracking-tight transition-colors hover:bg-accent"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="my-4 border-t border-border" />
              <button
                type="button"
                onClick={() => setCurrency(currency === "USD" ? "PKR" : "USD")}
                className="flex w-full items-center gap-2.5 rounded-sm px-2 py-3 text-sm font-medium transition-colors hover:bg-accent"
              >
                <Globe className="h-4 w-4" aria-hidden /> Currency: {currency}
              </button>
              {user ? (
                <div className="space-y-1">
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 rounded-sm px-2 py-3 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <Package className="h-4 w-4" aria-hidden /> My orders
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      handleSignOut();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-sm px-2 py-3 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" aria-hidden /> Sign out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setAuthOpen(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-sm px-2 py-3 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <User className="h-4 w-4" aria-hidden /> Sign in
                </button>
              )}
            </nav>

            <div className="border-t border-border px-6 py-4">
              <Link
                href="/cart"
                onClick={() => setMobileOpen(false)}
                className="flex h-11 items-center justify-center bg-foreground text-sm font-medium text-background"
              >
                View cart ({cartCount})
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
