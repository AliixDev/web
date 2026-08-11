// frontend/app/not-found.tsx

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center gap-6 py-28 text-center">
      <p className="eyebrow text-neutral-400">Error 404</p>
      <h1 className="max-w-xl text-[40px] font-light leading-tight tracking-tight md:text-5xl">
        This page has wandered off.
      </h1>
      <p className="max-w-md text-[14px] leading-relaxed text-neutral-500">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get
        you back to the collection.
      </p>
      <Link
        href="/"
        className="btn-press mt-2 inline-flex h-12 items-center gap-2 bg-foreground px-7 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
      >
        Return home <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}
