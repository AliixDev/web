// frontend/app/seller/layout.tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { isSeller } from "@/lib/seller";
import SellerShell from "@/components/seller/SellerShell";
import { Toaster } from "@/components/seller/Toast";
import { Skeleton } from "@/components/seller/ui";

function SellerLoading() {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <div className="hidden w-64 shrink-0 border-r border-neutral-200 bg-background p-5 lg:block">
        <Skeleton className="h-5 w-24" />
        <div className="mt-8 space-y-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6 md:p-8">
        <Skeleton className="h-6 w-40" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function SellerLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "authorized" | "denied">("loading");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function evaluate() {
      if (!isSupabaseConfigured()) {
        if (!cancelled) setStatus("denied");
        return;
      }
      try {
        const {
          data: { session },
        } = await getSupabase().auth.getSession();
        if (cancelled) return;
        if (!session?.user) {
          setEmail(null);
          setStatus("denied");
          return;
        }
        setEmail(session.user.email ?? null);
        const authorized = await isSeller();
        if (!cancelled) setStatus(authorized ? "authorized" : "denied");
      } catch {
        if (!cancelled) setStatus("denied");
      }
    }

    void evaluate();

    let unsubscribe: (() => void) | undefined;
    if (isSupabaseConfigured()) {
      try {
        const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
          if (cancelled) return;
          if (!session?.user) {
            setEmail(null);
            setStatus("denied");
            return;
          }
          setEmail(session.user.email ?? null);
          setStatus("loading");
          void isSeller().then((authorized) => {
            if (!cancelled) setStatus(authorized ? "authorized" : "denied");
          });
        });
        unsubscribe = () => data.subscription.unsubscribe();
      } catch {
        // Supabase not configured
      }
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  // Unauthenticated / non-seller users are sent to the Seller login.
  // Note: this is UX only — the database rejects any seller-scoped
  // query through RLS regardless of what the UI does.
  useEffect(() => {
    if (status === "denied") router.replace("/seller/login");
  }, [status, router]);

  async function handleSignOut() {
    try {
      await getSupabase().auth.signOut();
    } catch {
      // ignore
    }
    setStatus("denied");
  }

  if (status !== "authorized") return <SellerLoading />;

  return (
    <SellerShell userEmail={email} onSignOut={handleSignOut}>
      {children}
      <Toaster />
    </SellerShell>
  );
}
