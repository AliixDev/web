// frontend/app/seller/analytics/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  dateRangeFor,
  groupByDay,
  inRange,
  isSeller,
  sumByCurrency,
  type DateRangePreset,
  type SellerCategory,
  type SellerOrder,
  type SellerOrderItem,
  type SellerProduct,
  type SellerProfile,
} from "@/lib/seller";
import { formatMoney } from "@/lib/currency";
import type { Currency } from "@/lib/types";
import { BarChart, HBarList, LineChart } from "@/components/seller/Charts";
import { EmptyState, ErrorState, PageHeader, Skeleton, StatCard } from "@/components/seller/ui";
import { cn } from "@/lib/utils";

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
];

interface OrderWithItems extends SellerOrder {
  order_items?: SellerOrderItem[];
}

export default function SellerAnalyticsPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [categories, setCategories] = useState<SellerCategory[]>([]);
  const [profiles, setProfiles] = useState<SellerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<DateRangePreset>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase isn't configured for this workspace yet.");
      setLoading(false);
      return;
    }
    if (!(await isSeller())) {
      setError("This account isn't authorized to view analytics.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const [ordersRes, itemsRes, productsRes, categoriesRes, profilesRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, status, currency, total_minor, subtotal_minor, payment_status, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("order_items").select("order_id, product_id, product_name, quantity, line_total_minor"),
        supabase.from("products").select("id, name, category_id").order("name"),
        supabase.from("categories").select("id, name"),
        supabase.from("profiles").select("id, role, created_at"),
      ]);
      const items = itemsRes.data ?? [];
      const itemsByOrder = new Map<string, SellerOrderItem[]>();
      for (const item of items) {
        const list = itemsByOrder.get(item.order_id) ?? [];
        list.push(item as unknown as SellerOrderItem);
        itemsByOrder.set(item.order_id, list);
      }
      const ordersWithItems = ((ordersRes.data ?? []) as SellerOrder[]).map((order) => ({
        ...order,
        order_items: itemsByOrder.get(order.id) ?? [],
      }));
      setOrders(ordersWithItems);
      setProducts((productsRes.data ?? []) as SellerProduct[]);
      setCategories((categoriesRes.data ?? []) as SellerCategory[]);
      setProfiles((profilesRes.data ?? []) as SellerProfile[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load analytics data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const range = useMemo(() => {
    if (preset === "all") return dateRangeFor("all");
    if (preset === "custom" && customStart && customEnd) {
      const start = new Date(`${customStart}T00:00:00`);
      const end = new Date(`${customEnd}T23:59:59`);
      if (start < end) return { start, end };
    }
    return dateRangeFor(preset);
  }, [preset, customStart, customEnd]);

  // Orders that count toward revenue (not cancelled / refunded).
  const activeOrders = useMemo(() => orders.filter((o) => !["cancelled", "refunded"].includes(o.status)), [orders]);

  const scoped = useMemo(() => {
    const inScope = (iso: string) => inRange(iso, range);
    const list = activeOrders.filter((o) => inScope(o.created_at));
    const revenue = sumByCurrency(list);
    const total = list.length;
    const avg =
      total > 0
        ? {
            USD: Math.round(revenue.USD / total),
            PKR: Math.round(revenue.PKR / total),
          }
        : { USD: 0, PKR: 0 };
    const customers = profiles.filter((p) => p.role === "customer");
    const newCustomers = customers.filter((p) => inScope(p.created_at));
    return { orders: list, revenue, avg, total, newCustomers: newCustomers.length };
  }, [activeOrders, profiles, range]);

  const revenueTrend = useMemo(() => {
    const currencyOrders = scoped.orders.filter((o) => o.currency === currency);
    return groupByDay(
      currencyOrders.map((o) => ({ at: o.created_at, value: o.total_minor })),
      range,
    );
  }, [scoped.orders, range, currency]);

  const ordersTrend = useMemo(
    () => groupByDay(scoped.orders.map((o) => ({ at: o.created_at, value: 1 })), range),
    [scoped.orders, range],
  );

  const bestSellers = useMemo(() => {
    const totals = new Map<string, { qty: number; revenue: number }>();
    for (const order of scoped.orders) {
      for (const item of order.order_items ?? []) {
        const current = totals.get(item.product_name) ?? { qty: 0, revenue: 0 };
        current.qty += item.quantity;
        current.revenue += item.line_total_minor;
        totals.set(item.product_name, current);
      }
    }
    return [...totals.entries()]
      .map(([name, v]) => ({ label: name, value: v.qty, revenue: v.revenue }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [scoped.orders]);

  const categoryPerformance = useMemo(() => {
    const categoryById = new Map(categories.map((c) => [c.id, c.name]));
    const totals = new Map<string, number>();
    for (const order of scoped.orders) {
      for (const item of order.order_items ?? []) {
        const product = products.find((p) => p.id === item.product_id);
        const name = product ? (categoryById.get(product.category_id ?? "") ?? "Uncategorized") : "Uncategorized";
        totals.set(name, (totals.get(name) ?? 0) + item.line_total_minor);
      }
    }
    return [...totals.entries()]
      .map(([name, revenue]) => ({ label: name, value: revenue }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [scoped.orders, products, categories]);

  const rangeLabel = `${range.start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${range.end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Store performance over time — computed live from real orders, products, and customers."
      />

      {error ? (
        <ErrorState title="Couldn't load analytics" body={error} onRetry={() => void load()} />
      ) : (
        <>
          {/* Date range */}
          <div className="flex flex-wrap items-center gap-2">
            <CalendarRange className="h-4 w-4 text-neutral-400" aria-hidden />
            <div className="flex flex-wrap border border-neutral-200">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPreset(p.value)}
                  aria-pressed={preset === p.value}
                  className={cn(
                    "h-9 px-3.5 text-[12px] font-medium transition-colors",
                    preset === p.value ? "bg-foreground text-background" : "text-neutral-500 hover:text-foreground",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <label className="sr-only" htmlFor="custom-start">Custom start date</label>
            <input
              id="custom-start"
              type="date"
              value={customStart}
              onChange={(e) => {
                setCustomStart(e.target.value);
                setPreset("custom");
              }}
              className="h-9 border border-neutral-200 bg-background px-2 text-[12px] focus:border-foreground focus:outline-none"
            />
            <span className="text-[12px] text-neutral-400">to</span>
            <label className="sr-only" htmlFor="custom-end">Custom end date</label>
            <input
              id="custom-end"
              type="date"
              value={customEnd}
              onChange={(e) => {
                setCustomEnd(e.target.value);
                setPreset("custom");
              }}
              className="h-9 border border-neutral-200 bg-background px-2 text-[12px] focus:border-foreground focus:outline-none"
            />
          </div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">{rangeLabel}</p>

          {/* KPIs */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <StatCard
              label="Revenue (USD)"
              value={formatMoney(scoped.revenue.USD, "USD")}
              hint={`${scoped.orders.length} orders · excludes cancelled & refunded`}
              icon={<TrendingUp className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
              loading={loading}
            />
            <StatCard
              label="Revenue (PKR)"
              value={formatMoney(scoped.revenue.PKR, "PKR")}
              hint="Excludes cancelled & refunded"
              icon={<TrendingUp className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
              loading={loading}
            />
            <StatCard
              label="Orders"
              value={scoped.total}
              hint="In the selected period"
              icon={<ShoppingCart className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
              loading={loading}
            />
            <StatCard
              label="Avg order (USD)"
              value={formatMoney(scoped.avg.USD, "USD")}
              hint={`${formatMoney(scoped.avg.PKR, "PKR")} avg`}
              icon={<TrendingUp className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
              loading={loading}
            />
            <StatCard
              label="New customers"
              value={scoped.newCustomers}
              hint="First-time signups in period"
              icon={<Users className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
              loading={loading}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="border border-neutral-200 bg-background p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Revenue trend</p>
                  <h2 className="mt-1 font-display text-lg font-medium tracking-tight">{rangeLabel}</h2>
                </div>
                <div className="flex border border-neutral-200">
                  {(["USD", "PKR"] as Currency[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCurrency(c)}
                      aria-pressed={currency === c}
                      className={cn(
                        "h-8 px-3 text-[11px] font-semibold tracking-wider transition-colors",
                        currency === c ? "bg-foreground text-background" : "text-neutral-500 hover:text-foreground",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-6">
                {loading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <LineChart
                    data={revenueTrend}
                    height={200}
                    formatValue={(v) => formatMoney(v, currency)}
                    ariaLabel={`Revenue trend in ${currency}`}
                  />
                )}
              </div>
            </section>

            <section className="border border-neutral-200 bg-background p-5">
              <p className="eyebrow">Orders</p>
              <h2 className="mt-1 font-display text-lg font-medium tracking-tight">Per day</h2>
              <div className="mt-6">
                {loading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <BarChart
                    data={ordersTrend}
                    height={200}
                    formatValue={(v) => `${v} order${v === 1 ? "" : "s"}`}
                    ariaLabel="Orders per day"
                  />
                )}
              </div>
            </section>
          </div>

          {/* Rankings */}
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="border border-neutral-200 bg-background p-5">
              <p className="eyebrow">Best sellers</p>
              <h2 className="mt-1 font-display text-lg font-medium tracking-tight">By units sold</h2>
              <div className="mt-6">
                {loading ? (
                  <Skeleton className="h-40 w-full" />
                ) : bestSellers.length === 0 ? (
                  <EmptyState icon={ShoppingCart} title="No sales yet" body="Best sellers appear here once orders come in." />
                ) : (
                  <ul className="space-y-3">
                    {bestSellers.map((item) => (
                      <li key={item.label} className="flex items-center justify-between gap-3 border-b border-neutral-100 pb-3 last:border-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium">{item.label}</p>
                          <p className="text-[11px] text-neutral-400">{item.value} sold · {formatMoney(item.revenue, currency)}</p>
                        </div>
                        <span className="shrink-0 text-[12px] font-semibold tabular-nums text-neutral-600">{item.value}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <section className="border border-neutral-200 bg-background p-5">
              <p className="eyebrow">Category performance</p>
              <h2 className="mt-1 font-display text-lg font-medium tracking-tight">By revenue</h2>
              <div className="mt-6">
                {loading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <HBarList
                    items={categoryPerformance}
                    formatValue={(v) => formatMoney(v, currency)}
                    emptyLabel="No category sales in this period yet."
                  />
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
