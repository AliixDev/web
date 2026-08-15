// frontend/lib/currency.ts

import { Currency } from "./types";

/**
 * Approximate conversion rates from USD.
 * These are display-only rates — no live exchange feeds.
 * Replace with a live-rate provider when available.
 */
export const CURRENCY_RATES: Record<Currency, number> = {
  USD: 1,
  PKR: 280,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  SAR: 3.75,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.88,
};

/** Formats a minor-unit amount (cents or equivalent) as a display string. */
export function formatMoney(minorAmount: number, currency: Currency): string {
  const majorAmount = minorAmount / 100;

  const localeMap: Record<Currency, string> = {
    USD: "en-US",
    PKR: "en-PK",
    EUR: "de-DE",
    GBP: "en-GB",
    AED: "ar-AE",
    SAR: "ar-SA",
    CAD: "en-CA",
    AUD: "en-AU",
    CHF: "de-CH",
  };

  return new Intl.NumberFormat(localeMap[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(majorAmount);
}

/**
 * Picks the correct minor-unit price field for a currency.
 * For USD and PKR, uses the stored DB values.
 * For all other currencies, derives from USD using CURRENCY_RATES.
 */
export function priceForCurrency(
  currency: Currency,
  usdCents: number,
  pkrPaisa: number,
): number {
  if (currency === "USD") return usdCents;
  if (currency === "PKR") return pkrPaisa;
  // Derive from USD using approximate rates, keeping minor units (cents)
  return Math.round(usdCents * CURRENCY_RATES[currency]);
}

/** Returns the currency symbol for display in price inputs. */
export function currencySymbol(currency: Currency): string {
  const symbols: Record<Currency, string> = {
    USD: "$",
    PKR: "Rs",
    EUR: "€",
    GBP: "£",
    AED: "د.إ",
    SAR: "﷼",
    CAD: "CA$",
    AUD: "A$",
    CHF: "CHF",
  };
  return symbols[currency];
}

/** Returns a short label for the currency selector. */
export function currencyLabel(currency: Currency): string {
  const labels: Record<Currency, string> = {
    USD: "USD — US Dollar",
    PKR: "PKR — Pakistani Rupee",
    EUR: "EUR — Euro",
    GBP: "GBP — British Pound",
    AED: "AED — UAE Dirham",
    SAR: "SAR — Saudi Riyal",
    CAD: "CAD — Canadian Dollar",
    AUD: "AUD — Australian Dollar",
    CHF: "CHF — Swiss Franc",
  };
  return labels[currency];
}
