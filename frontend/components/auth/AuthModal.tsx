// frontend/components/auth/AuthModal.tsx
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Loader2, MailCheck, X } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { useDialog } from "@/lib/useDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  context?: "signin" | "checkout" | "account";
}

type Stage = "idle" | "loading" | "sent" | "error";

const COPY = {
  signin: {
    title: "Sign in to SDBBUY",
    body: "We'll email you a secure sign-in link. No password needed.",
    confirm: "We've emailed your sign-in link. Open it to sign in, then close this window.",
  },
  checkout: {
    title: "Sign in to place your order",
    body: "Orders are tied to your account. We'll email you a sign-in link.",
    confirm: "We've emailed your sign-in link. Open it, then come back and submit your order.",
  },
  account: {
    title: "Sign in to view your account",
    body: "View your profile and order history. We'll email you a sign-in link.",
    confirm: "We've emailed your sign-in link. Open it to access your account.",
  },
} as const;

export default function AuthModal({ open, onClose, context = "signin" }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [message, setMessage] = useState("");

  const dialogRef = useDialog(open, onClose);

  // Reset the form each time the dialog opens.
  useEffect(() => {
    if (open) {
      setStage("idle");
      setMessage("");
      setEmail("");
    }
  }, [open]);

  if (!open) return null;

  const copy = COPY[context];
  const isConfigured = isSupabaseConfigured();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStage("loading");
    setMessage("");
    try {
      const supabase = getSupabase();
      // Redirect back to the current page after the magic link is clicked.
      // Derived from window.location so it works on any host — local dev
      // (localhost), GitHub Pages, or the custom domain (sdbbuy.com).
      const redirectTo = `${window.location.origin}${window.location.pathname}`;
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
          shouldCreateUser: true,
        },
      });
      if (error) {
        setMessage(error.message);
        setStage("error");
        return;
      }
      setStage("sent");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStage("error");
    }
  }

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 cursor-default bg-black/30 backdrop-blur-[2px]"
      />
      <div className="animate-scale-in relative w-full max-w-sm bg-background p-8 shadow-panel">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors duration-200 hover:text-foreground"
        >
          <X className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
        </button>

        <h2 className="font-display text-[22px] font-medium tracking-tight">{copy.title}</h2>

        {!isConfigured ? (
          <div className="mt-5 space-y-3">
            <p className="text-[13px] leading-relaxed text-neutral-600">
              Sign-in isn&apos;t available yet because the Supabase environment variables haven&apos;t
              been configured for this workspace.
            </p>
            <p className="text-[11px] leading-relaxed text-neutral-400">
              Add <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
              and{" "}
              <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
              in API Keys to enable it.
            </p>
          </div>
        ) : stage === "sent" ? (
          <div className="mt-6 flex flex-col items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100">
              <MailCheck className="h-5 w-5 text-neutral-600" strokeWidth={1.5} aria-hidden />
            </div>
            <p className="text-[13px] leading-relaxed text-neutral-600">{copy.confirm}</p>
            <p className="text-[12px] text-neutral-400">Didn&apos;t receive it? Check your spam folder.</p>
            <button
              type="button"
              onClick={onClose}
              className="btn-press mt-2 inline-flex h-11 items-center justify-center bg-foreground px-6 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <p className="text-[13px] leading-relaxed text-neutral-600">{copy.body}</p>
            <div className="space-y-2">
              <Label htmlFor="auth-email">Email address</Label>
              <Input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {stage === "error" && (
              <p
                className="border border-destructive/20 bg-destructive/5 px-3 py-2 text-[12px] text-destructive"
                role="alert"
              >
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={stage === "loading"}
              className="btn-press inline-flex h-11 w-full items-center justify-center gap-2 bg-foreground text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {stage === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sending link…
                </>
              ) : (
                <>
                  Send sign-in link <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
