// frontend/components/layout/PolicyLayout.tsx

import type { ReactNode } from "react";

interface PolicyLayoutProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
}

export default function PolicyLayout({ eyebrow, title, children }: PolicyLayoutProps) {
  return (
    <div className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-[32px] font-light leading-[1.08] tracking-tight md:text-[42px]">
          {title}
        </h1>
        <div className="mt-10 space-y-10 text-[14px] leading-[1.8] text-neutral-700">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable section heading for policy pages.
 */
export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-medium tracking-tight text-foreground">{title}</h2>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}
