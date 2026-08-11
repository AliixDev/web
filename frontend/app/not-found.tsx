// frontend/app/not-found.tsx

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center gap-6 py-28 text-center">
      <p className="eyebrow">Error 404</p>
      <h1 className="max-w-xl text-[40px] font-light leading-tight tracking-tight md:text-5xl">
        This page has wandered off.
      </h1>
      <p className="max-w-md text-[14px] leading-[1.7] text-neutral-600">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you back to the
        collection.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="btn-press inline-flex h-12 items-center gap-2 bg-foreground px-7 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
        >
          Return home <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link
          href="/shop"
          className="btn-press inline-flex h-12 items-center border border-neutral-200 px-7 text-[13px] font-medium transition-all duration-200 hover:border-foreground hover:bg-foreground hover:text-background"
        >
          Browse the shop
        </Link>
      </div>
    </div>
  );
}
