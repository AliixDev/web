// frontend/components/layout/CurrencySelector.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { useStore } from "@/lib/store";
import { CURRENCY_RATES, currencySymbol } from "@/lib/currency";
import { cn } from "@/lib/utils";
import type { Currency } from "@/lib/types";

const DISPLAY_CURRENCIES: Currency[] = ["USD", "EUR", "GBP", "AED", "SAR", "CAD", "AUD", "CHF"];

const CURRENCY_NAMES: Record<Currency, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  AED: "UAE Dirham",
  SAR: "Saudi Riyal",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  CHF: "Swiss Franc",
  PKR: "Pakistani Rupee",
};

export default function CurrencySelector() {
  const currency = useStore((s) => s.currency);
  const setCurrency = useStore((s) => s.setCurrency);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-1.5 px-2 text-[12px] font-semibold tracking-wider text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-foreground"
        aria-label={`Currency: ${currency}`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className="h-[15px] w-[15px]" strokeWidth={1.5} aria-hidden />
        <span className="hidden sm:inline">{currencySymbol(currency)} {currency}</span>
        <span className="sm:hidden">{currency}</span>
        <ChevronDown
          className={cn("h-3 w-3 transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select currency"
          className="animate-scale-in absolute right-0 top-[calc(100%+6px)] z-50 w-56 border border-border bg-background py-1.5 shadow-panel"
        >
          {DISPLAY_CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              role="option"
              aria-selected={c === currency}
              onClick={() => {
                setCurrency(c);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between px-4 py-2.5 text-[13px] transition-colors",
                c === currency
                  ? "font-medium text-foreground"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-foreground",
              )}
            >
              <span>{c} — {CURRENCY_NAMES[c]}</span>
              <span className="text-neutral-400">{currencySymbol(c)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
