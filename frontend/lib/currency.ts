// frontend/lib/currency.ts

import { Currency } from "./types";

/** Formats an integer minor-unit amount (cents or paisa) as a display string. */
export function formatMoney(minorAmount: number, currency: Currency): string {
  const majorAmount = minorAmount / 100;
  if (currency === "PKR") {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      maximumFractionDigits: 0,
    }).format(majorAmount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(majorAmount);
}

/** Picks the correct minor-unit price field for a currency. */
export function priceForCurrency(
  currency: Currency,
  usdCents: number,
  pkrPaisa: number,
): number {
  return currency === "USD" ? usdCents : pkrPaisa;
}
