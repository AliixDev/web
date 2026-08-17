// frontend/lib/seller.ts
//
// Seller Central helpers. Everything here either talks to Supabase
// through the existing public client (RLS-gated) or is a pure,
// unit-tested utility. No secrets, no service-role access, no mocks.

import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import type { Currency } from "@/lib/types";

// ---------------------------------------------------------------------
// Types (Supabase row shapes used by Seller Central)
// ---------------------------------------------------------------------

export type SellerRole = "customer" | "seller" | "admin";

export interface SellerProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: SellerRole;
  default_currency: string | null;
  created_at: string;
}

export interface SellerProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string;
  price_usd_cents: number | null;
  price_pkr_paisa: number | null;
  stock_quantity: number;
  is_active: boolean;
}

export interface SellerProduct {
  id: string;
  category_id: string | null;
  slug: string;
  name: string;
  description: string;
  image_url: string | null;
  price_usd_cents: number;
  price_pkr_paisa: number;
  is_active: boolean;
  stock_quantity: number;
  created_at: string;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  product_variants?: SellerProductVariant[];
}

export interface SellerCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  is_active: boolean;
}

export interface SellerOrderItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price_minor: number;
  line_total_minor: number;
}

export interface SellerOrder {
  id: string;
  user_id: string;
  status: string;
  currency: string;
  subtotal_minor: number;
  shipping_minor: number;
  total_minor: number;
  payment_method: string;
  payment_status: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address_line1: string;
  shipping_address_line2: string | null;
  shipping_city: string;
  shipping_country: string;
  notes: string | null;
  created_at: string;
  order_items?: SellerOrderItem[];
}

export interface SellerNotification {
  id: string;
  type: "new_order" | "payment" | "low_stock" | "out_of_stock" | "system";
  title: string;
  body: string;
  order_id: string | null;
  product_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface SellerPromotion {
  id: string;
  code: string;
  description: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  currency: Currency | null;
  product_id: string | null;
  category_id: string | null;
  min_subtotal_minor: number | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

export interface InventoryLogRow {
  id: string;
  product_id: string;
  variant_id: string | null;
  change_quantity: number;
  reason: string;
  previous_stock: number;
  new_stock: number;
  created_at: string;
}

// ---------------------------------------------------------------------
// Business constants
// ---------------------------------------------------------------------

export const LOW_STOCK_THRESHOLD = 5;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Payment pending",
  cod_pending: "Order placed (COD)",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  stripe: "Stripe",
  cod: "Cash on delivery",
  jazzcash: "JazzCash",
  safepay: "Safepay",
};

/** Statuses the seller may move an order to (matches the DB enum). */
export const ORDER_STATUS_OPTIONS = [
  "pending_payment",
  "cod_pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type DateRangePreset = "today" | "yesterday" | "7d" | "30d" | "month" | "all" | "custom";

// ---------------------------------------------------------------------
// Auth gate
// ---------------------------------------------------------------------

/**
 * True when a signed-in user is a seller/admin per the database
 * (profiles.role). RLS enforces the same rule server-side, so this is
 * UX + routing only — it can never grant real access.
 */
export async function isSeller(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) return false;

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();
    if (error || !data) return false;
    return data.role === "seller" || data.role === "admin";
  } catch {
    return false;
  }
}

/** Whether a configured Supabase project is present (for graceful UI). */
export function sellerBackendAvailable(): boolean {
  return isSupabaseConfigured();
}

// ---------------------------------------------------------------------
// Pure helpers (unit-tested)
// ---------------------------------------------------------------------

/** Groups orders by currency and sums their totals. */
export function sumByCurrency(
  orders: { currency: string; total_minor: number }[],
): Record<Currency, number> {
  const result: Record<Currency, number> = {
    USD: 0,
    PKR: 0,
    EUR: 0,
    GBP: 0,
    AED: 0,
    SAR: 0,
    CAD: 0,
    AUD: 0,
    CHF: 0,
  };
  for (const order of orders) {
    const key = order.currency as Currency;
    if (key in result) {
      result[key] += order.total_minor;
    } else {
      result.USD += order.total_minor;
    }
  }
  return result;
}

export interface DateRange {
  start: Date;
  end: Date;
}

/** Start (inclusive) and end (exclusive) dates for a preset range. */
export function dateRangeFor(
  preset: DateRangePreset,
  now: Date = new Date(),
): DateRange {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: addDays(startOfDay(now), 1) };
    case "yesterday":
      return { start: addDays(startOfDay(now), -1), end: startOfDay(now) };
    case "7d":
      return { start: addDays(startOfDay(now), -6), end: addDays(startOfDay(now), 1) };
    case "30d":
      return { start: addDays(startOfDay(now), -29), end: addDays(startOfDay(now), 1) };
    case "month":
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      };
    case "all":
      return { start: new Date(0), end: addDays(now, 1) };
    case "custom":
      // "custom" is resolved by the caller with explicit dates; this is a safe fallback.
      return { start: startOfDay(now), end: addDays(startOfDay(now), 1) };
  }
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

/** True when the order falls inside the range (start <= t < end). */
export function inRange(iso: string, range: DateRange): boolean {
  const t = new Date(iso).getTime();
  return t >= range.start.getTime() && t < range.end.getTime();
}

/** Day buckets (one per day in the range, oldest first) summing values. */
export function groupByDay(
  items: { at: string; value: number }[],
  range: DateRange,
): { label: string; value: number }[] {
  const days: { label: string; value: number }[] = [];
  const cursor = new Date(range.start);
  while (cursor < range.end) {
    days.push({
      label: cursor.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      value: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  const index = new Map(days.map((d, i) => [d.label, i]));
  for (const item of items) {
    if (!inRange(item.at, range)) continue;
    const label = new Date(item.at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    const i = index.get(label);
    if (i !== undefined) days[i].value += item.value;
  }
  return days;
}

/** True for any order/notification/product older than the given days. */
export function daysAgo(iso: string, days: number, now: Date = new Date()): boolean {
  return new Date(iso).getTime() < now.getTime() - days * 24 * 60 * 60 * 1000;
}

/** Integer minor-unit conversion (cents / paisa). */
export function toMinor(major: number): number {
  return Math.round(major * 100);
}

export function fromMinor(minor: number): number {
  return minor / 100;
}

/** Simple slug from a name, e.g. "Embroidered Lawn Kurta" -> "embroidered-lawn-kurta". */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Renders an array of objects as CSV with a header row. */
export function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

/** Triggers a browser download of a CSV string. */
export function downloadCSV(filename: string, csv: string): void {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
