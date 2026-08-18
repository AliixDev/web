// frontend/app/seller/page.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Boxes, Inbox, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  LOW_STOCK_THRESHOLD,
  dateRangeFor,
  groupByDay,
  inRange,
  isSeller,
  sumByCurrency,
  type SellerOrder,
  type SellerProduct,
  type SellerProfile,
} from "@/lib/seller";
import { formatMoney } from "@/lib/currency";
import type { Currency } from "@/lib/types";
import { BarChart, LineChart } from "@/components/seller/Charts";
import { EmptyState, ErrorState, PageHeader, Skeleton, StatCard, StatusBadge, orderStatusTone } from "@/components/seller/ui";
import { cn } from "@/lib/utils";

export default function SellerDashboardPage() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [profiles, setProfiles] = useState<SellerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>("USD");

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase isn't configured for this workspace yet.");
      setLoading(false);
      return;
    }
    if (!(await isSeller())) {
      setError("This account isn't authorized to view seller data.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const [ordersRes, productsRes, profilesRes] = await Promise.all([
        supabase.from("orders").select("id, status, currency, total_minor, payment_status, payment_method, shipping_name, shipping_city, created_at").order("created_at", { ascending: false }),
        supabase.from("products").select("id, name, slug, image_url, price_usd_cents, price_pkr_paisa, is_active, stock_quantity, category_id, created_at").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, role, created_at"),
      ]);
      setOrders((ordersRes.data ?? []) as SellerOrder[]);
      setProducts((productsRes.data ?? []) as SellerProduct[]);
      setProfiles((profilesRes.data ?? []) as SellerProfile[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = dateRangeFor("today", now);
    const month = dateRangeFor("month", now);

    const monthOrders = orders.filter((o) => inRange(o.created_at, month));
    const todayOrders = orders.filter((o) => inRange(o.created_at, today));
    const revenue = sumByCurrency(monthOrders);

    const activeProducts = products.filter((p) => p.is_active);
    const outOfStock = products.filter((p) => p.stock_quantity <= 0);
    const lowStock = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= LOW_STOCK_THRESHOLD);

    const pending = orders.filter((o) => ["pending_payment", "paid"].includes(o.status));
    const processing = orders.filter((o) => o.status === "processing" || o.status === "shipped");

    const customers = profiles.filter((p) => p.role === "customer");
    const newCustomers = customers.filter((p) => inRange(p.created_at, month));

    return {
      monthOrders,
      todayOrders,
      revenue,
      activeProducts: activeProducts.length,
      totalProducts: products.length,
      outOfStock: outOfStock.length,
      lowStock: lowStock.length,
      pending: pending.length,
      processing: processing.length,
      customers: customers.length,
      newCustomers: newCustomers.length,
    };
  }, [orders, products, profiles]);

  const charts = useMemo(() => {
    const range = dateRangeFor("7d");
    const revenueDay = groupByDay(
      orders.map((o) => ({
        at: o.created_at,
        value: o.currency === "PKR" && currency === "PKR" ? o.total_minor : o.currency === "USD" && currency === "USD" ? o.total_minor : 0,
      })),
      range,
    );
    const ordersDay = groupByDay(orders.map((o) => ({ at: o.created_at, value: 1 })), range);
    return { revenueDay, ordersDay };
  }, [orders, currency]);

  const recentOrders = orders.slice(0, 5);
  const lowStockItems = products
    .filter((p) => p.stock_quantity <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock_quantity - b.stock_quantity)
    .slice(0, 5);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Seller Central" title="Dashboard" description="Store performance at a glance." />
        <ErrorState title="Couldn't load the dashboard" body={error} onRetry={() => void load()} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Seller Central"
        title="Dashboard"
        description="A live view of your store — every number is computed from real Supabase data."
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Revenue (USD)"
          value={formatMoney(stats.revenue.USD, "USD")}
          hint={`${stats.monthOrders.length} orders this month`}
          icon={<TrendingUp className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
          loading={loading}
        />
        <StatCard
          label="Revenue (PKR)"
          value={formatMoney(stats.revenue.PKR, "PKR")}
          hint="This month"
          icon={<TrendingUp className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
          loading={loading}
        />
        <StatCard
          label="Orders"
          value={stats.monthOrders.length}
          hint={`${stats.todayOrders.length} today · ${stats.processing} in progress`}
          icon={<ShoppingCart className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
          loading={loading}
        />
        <StatCard
          label="Products"
          value={stats.totalProducts}
          hint={`${stats.activeProducts} active · ${stats.outOfStock} out of stock`}
          icon={<Package className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
          loading={loading}
        />
        <StatCard
          label="Low stock"
          value={stats.lowStock}
          hint={`At or below ${LOW_STOCK_THRESHOLD} units`}
          icon={<AlertTriangle className="h-4 w-4" strokeWidth={1.5} aria-hidden />}
          loading={loading}
        />
        <StatCard
          label="Customers"
          value={stats.customers}
          hint={`${stats.newCustomers} new this month`}
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
              <h2 className="mt-1 font-display text-lg font-medium tracking-tight">Last 7 days</h2>
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
                data={charts.revenueDay}
                height={200}
                formatValue={(v) => formatMoney(v, currency)}
                ariaLabel="Revenue over the last 7 days"
              />
            )}
          </div>
        </section>

        <section className="border border-neutral-200 bg-background p-5">
          <p className="eyebrow">Orders</p>
          <h2 className="mt-1 font-display text-lg font-medium tracking-tight">Last 7 days</h2>
          <div className="mt-6">
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <BarChart data={charts.ordersDay} height={200} formatValue={(v) => `${v} order${v === 1 ? "" : "s"}`} ariaLabel="Orders over the last 7 days" />
            )}
          </div>
        </section>
      </div>

      {/* Lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent orders */}
        <section className="border border-neutral-200 bg-background">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <h2 className="font-display text-lg font-medium tracking-tight">Recent orders</h2>
            <Link
              href="/seller/orders"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-neutral-500 transition-colors hover:text-foreground"
            >
              View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <EmptyState icon={Inbox} title="No orders yet" body="Orders will appear here as customers place them." />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/seller/orders?focus=${order.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-neutral-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">
                        {order.shipping_name || "Customer"} · {order.shipping_city || "—"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-neutral-400">
                        {new Date(order.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        {" · "}
                        {order.id.slice(0, 8)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge label={order.status.replace("_", " ")} tone={orderStatusTone(order.status)} />
                      <span className="text-[13px] font-medium tabular-nums">
                        {formatMoney(order.total_minor, order.currency === "PKR" ? "PKR" : "USD")}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Low stock */}
        <section className="border border-neutral-200 bg-background">
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <h2 className="font-display text-lg font-medium tracking-tight">Low stock</h2>
            <Link
              href="/seller/inventory"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-neutral-500 transition-colors hover:text-foreground"
            >
              Manage <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : lowStockItems.length === 0 ? (
            <EmptyState icon={Boxes} title="Stock looks healthy" body={`No products at or below ${LOW_STOCK_THRESHOLD} units.`} />
          ) : (
            <ul className="divide-y divide-neutral-100">
              {lowStockItems.map((product) => (
                <li key={product.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">{product.name}</p>
                    <p className="mt-0.5 text-[11px] text-neutral-400">
                      {product.stock_quantity <= 0 ? "Out of stock" : "Low stock"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] tabular-nums",
                      product.stock_quantity <= 0 ? "border-destructive/30 text-destructive" : "border-neutral-300 text-neutral-700",
                    )}
                  >
                    {product.stock_quantity} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Alerts strip */}
      {!loading && stats.outOfStock > 0 && (
        <p className="border border-destructive/20 bg-destructive/5 px-4 py-3 text-[12px] leading-relaxed text-destructive" role="status">
          {stats.outOfStock} product{stats.outOfStock === 1 ? " is" : "s are"} out of stock —{" "}
          <Link href="/seller/inventory" className="font-medium underline underline-offset-2">
            review inventory
          </Link>
          .
        </p>
      )}

    </div>
  );
}
