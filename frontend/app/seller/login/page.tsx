// frontend/app/seller/login/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Loader2, Lock, Mail, MailCheck, ShieldCheck } from "lucide-react";
import { getSupabase } from "@/lib/supabaseClient";
import { isSeller, sellerBackendAvailable } from "@/lib/seller";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "password" | "magic";

export default function SellerLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  // Already signed in as a seller? Go straight in.
  useEffect(() => {
    if (!sellerBackendAvailable()) return;
    let cancelled = false;
    void (async () => {
      if (await isSeller()) {
        if (!cancelled) router.replace("/seller");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!sellerBackendAvailable()) {
    return (
      <div className="container flex max-w-md flex-col items-center gap-5 py-24 text-center">
        <p className="eyebrow">Seller Central</p>
        <h1 className="font-display text-3xl font-light tracking-tight">Sign-in isn&apos;t available yet</h1>
        <p className="text-[13px] leading-relaxed text-neutral-600">
          Add <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in API
          Keys to enable authentication.
        </p>
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-500 transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to store
        </Link>
      </div>
    );
  }

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "magic") {
      setStage("loading");
      try {
        const { error } = await getSupabase().auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}${window.location.pathname}`,
            shouldCreateUser: true,
          },
        });
        if (error) {
          setError(error.message);
          setStage("idle");
          return;
        }
        setStage("sent");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        setStage("idle");
      }
      return;
    }

    setStage("loading");
    try {
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error) {
        setError("Incorrect email or password. Please try again.");
        setStage("idle");
        return;
      }
      // Password is correct — verify the account is a seller/admin.
      const authorized = await isSeller();
      if (!authorized) {
        await getSupabase().auth.signOut();
        setError("This account isn't authorized for Seller Central. Sign in with the seller account instead.");
        setStage("idle");
        return;
      }
      router.replace("/seller");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStage("idle");
    }
  }

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-[12px] font-medium text-neutral-500 transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to store
        </Link>

        <div className="border border-neutral-200 bg-background p-8 shadow-panel-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center bg-foreground text-background">
              <ShieldCheck className="h-5 w-5" strokeWidth={1.5} aria-hidden />
            </span>
            <div>
              <p className="font-display text-xl font-medium tracking-tight">Seller Central</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                SDB WEAR
              </p>
            </div>
          </div>

          <h1 className="mt-7 text-[22px] font-light tracking-tight">Sign in to manage your store</h1>

          {stage === "sent" ? (
            <div className="mt-6 flex flex-col items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100">
                <MailCheck className="h-5 w-5 text-neutral-600" strokeWidth={1.5} aria-hidden />
              </div>
              <p className="text-[13px] leading-relaxed text-neutral-600">
                We&apos;ve emailed you a sign-in link. Open it, then come back — you&apos;ll be signed in
                automatically.
              </p>
              <button
                type="button"
                onClick={() => setStage("idle")}
                className="btn-press mt-1 inline-flex h-10 items-center justify-center bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignIn} className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seller-email">Email address</Label>
                <Input
                  id="seller-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {mode === "password" && (
                <div className="space-y-2">
                  <Label htmlFor="seller-password">Password</Label>
                  <Input
                    id="seller-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}

              {error && (
                <p
                  className="border border-destructive/20 bg-destructive/5 px-3 py-2 text-[12px] leading-relaxed text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={stage === "loading"}
                className="btn-press inline-flex h-11 w-full items-center justify-center gap-2 bg-foreground text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {stage === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Signing in…
                  </>
                ) : (
                  <>
                    {mode === "password" ? (
                      <>
                        <Lock className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Sign in
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Send sign-in link
                      </>
                    )}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMode(mode === "password" ? "magic" : "password")}
                className="w-full text-center text-[12px] font-medium text-neutral-500 underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {mode === "password" ? "Use a sign-in link instead" : "Use email & password instead"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-neutral-400">
          <ArrowRight className="mr-1 inline h-3 w-3" aria-hidden />
          Only authorized seller accounts can access this area. Orders and customer data are
          protected by database-level rules.
        </p>
      </div>
    </div>
  );
}
