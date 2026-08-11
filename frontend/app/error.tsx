// frontend/app/error.tsx
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Logged for diagnostics only — the user sees plain-language copy below.
    console.error(error);
  }, [error]);

  return (
    <div className="container flex flex-col items-center gap-6 py-28 text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="max-w-xl text-[40px] font-light leading-tight tracking-tight md:text-5xl">
        We hit an unexpected snag.
      </h1>
      <p className="max-w-md text-[14px] leading-[1.7] text-neutral-600">
        This is on us, not you. Try the action again, or head back to the collection — your cart
        is safe.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="btn-press inline-flex h-12 items-center gap-2 bg-foreground px-7 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
        >
          <RotateCcw className="h-4 w-4" aria-hidden /> Try again
        </button>
        <Link
          href="/"
          className="btn-press inline-flex h-12 items-center gap-2 border border-neutral-200 px-7 text-[13px] font-medium transition-all duration-200 hover:border-foreground hover:bg-foreground hover:text-background"
        >
          Return home <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
