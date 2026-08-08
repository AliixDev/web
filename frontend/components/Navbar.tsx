// frontend/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart, Globe } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import type { Currency } from "@/lib/types";

export default function Navbar() {
  const currency = useStore((s) => s.currency);
  const setCurrency = useStore((s) => s.setCurrency);
  const cartCount = useStore((s) => s.cartCount());

  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleAuthClick() {
    if (userEmail) {
      await supabase.auth.signOut();
      return;
    }
    const email = window.prompt("Enter your email for a magic sign-in link:");
    if (!email) return;
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      window.alert(error.message);
    } else {
      window.alert("Check your email for a sign-in link.");
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Sitara<span className="text-primary">Souq</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/" className="transition-colors hover:text-primary">
            Shop
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrency(currency === "USD" ? "PKR" : ("USD" as Currency))}
            className="flex items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm font-medium hover:bg-accent"
            aria-label="Switch currency"
          >
            <Globe className="h-4 w-4" />
            {currency}
          </button>

          <Button variant="ghost" size="sm" onClick={handleAuthClick}>
            {userEmail ? "Sign out" : "Sign in"}
          </Button>

          <Link href="/cart" className="relative inline-flex">
            <Button variant="outline" size="icon" aria-label="View cart">
              <ShoppingCart className="h-4 w-4" />
            </Button>
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
