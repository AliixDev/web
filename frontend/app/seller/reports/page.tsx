// frontend/app/seller/reports/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, ShoppingCart } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  dateRangeFor,
  downloadCSV,
  inRange,
  isSeller,
  toCSV,
  type DateRangePreset,
  type SellerOrder,
  type SellerOrderItem,
  type SellerProduct,
  type SellerProfile,
  type SellerPromotion,
} from "@/lib/seller";
import { formatMoney } from "@/lib/currency";
import DataTable, { type Column } from "@/components/seller/DataTable";
import { EmptyState, ErrorState, PageHeader, StatusBadge } from "@/components/seller/ui";
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

export default function SellerReportsPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [profiles, setProfiles] = useState<SellerProfile[]>([]);
  const [promotions, setPromotions] = useState<SellerPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<DateRangePreset>("30d");

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase isn't configured for this workspace yet.");
      setLoading(false);
      return;
    }
    if (!(await isSeller())) {
      setError("This account isn't authorized to view reports.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const [ordersRes, itemsRes, productsRes, profilesRes, promotionsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, status, currency, total_minor, subtotal_minor, shipping_minor, payment_method, payment_status, shipping_name, shipping_phone, shipping_city, shipping_country, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("order_items").select("order_id, product_name, variant_name, quantity, unit_price_minor, line_total_minor"),
        supabase.from("products").select("id, name, slug, category_id, price_usd_cents, price_pkr_paisa, is_active, stock_quantity, created_at"),
        supabase.from("profiles").select("id, full_name, email, role, created_at"),
        supabase.from("promotions").select("id, code, discount_type, discount_value, is_active, used_count, created_at"),
      ]);
      const itemsByOrder = new Map<string, SellerOrderItem[]>();
      for (const item of itemsRes.data ?? []) {
        const list = itemsByOrder.get(item.order_id) ?? [];
        list.push(item as unknown as SellerOrderItem);
        itemsByOrder.set(item.order_id, list);
      }
      setOrders(((ordersRes.data ?? []) as SellerOrder[]).map((o) => ({ ...o, order_items: itemsByOrder.get(o.id) ?? [] })));
      setProducts((productsRes.data ?? []) as SellerProduct[]);
      setProfiles((profilesRes.data ?? []) as SellerProfile[]);
      setPromotions((promotionsRes.data ?? []) as SellerPromotion[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load reports data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const range = useMemo(() => dateRangeFor(preset), [preset]);
  const scopedOrders = useMemo(
    () => orders.filter((o) => inRange(o.created_at, range)),
    [orders, range],
  );

  function exportOrders() {
    const rows = scopedOrders.map((o) => ({
      order_id: o.id,
      date: new Date(o.created_at).toISOString(),
      status: o.status,
      payment_method: o.payment_method,
      payment_status: o.payment_status,
      currency: o.currency,
      subtotal_minor: o.subtotal_minor,
      shipping_minor: o.shipping_minor,
      total_minor: o.total_minor,
      customer_name: o.shipping_name,
      customer_phone: o.shipping_phone,
      city: o.shipping_city,
      country: o.shipping_country,
      items: (o.order_items ?? []).map((i) => `${i.quantity}× ${i.product_name}`).join(" | "),
    }));
    downloadCSV(`orders-${preset}.csv`, toCSV(rows));
  }

  function exportOrderItems() {
    const rows = scopedOrders.flatMap((o) =>
      (o.order_items ?? []).map((i) => ({
        order_id: o.id,
        order_date: new Date(o.created_at).toISOString(),
        status: o.status,
        product: i.product_name,
        variant: i.variant_name ?? "",
        quantity: i.quantity,
        unit_price_minor: i.unit_price_minor,
        line_total_minor: i.line_total_minor,
        currency: o.currency,
      })),
    );
    downloadCSV(`order-items-${preset}.csv`, toCSV(rows));
  }

  function exportProducts() {
    const rows = products.map((p) => ({
      name: p.name,
      slug: p.slug,
      price_usd_cents: p.price_usd_cents,
      price_pkr_paisa: p.price_pkr_paisa,
      stock_quantity: p.stock_quantity,
      status: !p.is_active ? "inactive" : p.stock_quantity <= 0 ? "out_of_stock" : "active",
      created_at: p.created_at,
    }));
    downloadCSV(`products-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows));
  }

  function exportCustomers() {
    const rows = profiles
      .filter((p) => p.role === "customer")
      .map((p) => {
        const customerOrders = orders.filter((o) => o.user_id === p.id);
        const totalSpend = { USD: 0, PKR: 0 };
        for (const o of customerOrders) {
          if (["cancelled", "refunded"].includes(o.status)) continue;
          if (o.currency === "PKR") totalSpend.PKR += o.total_minor;
          else totalSpend.USD += o.total_minor;
        }
        return {
          id: p.id,
          name: p.full_name ?? "",
          email: p.email ?? "",
          joined_at: p.created_at,
          orders: customerOrders.length,
          total_spend_usd_minor: totalSpend.USD,
          total_spend_pkr_paisa: totalSpend.PKR,
        };
      });
    downloadCSV(`customers-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows));
  }

  function exportPromotions() {
    const rows = promotions.map((p) => ({
      code: p.code,
      type: p.discount_type,
      value: p.discount_value,
      currency: p.currency ?? "",
      used_count: p.used_count,
      usage_limit: p.usage_limit ?? "",
      is_active: p.is_active,
      created_at: p.created_at,
    }));
    downloadCSV(`promotions-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows));
  }

  const columns: Column<OrderWithItems>[] = [
    {
      key: "id",
      header: "Order",
      render: (o) => (
        <div className="min-w-0">
          <p className="font-mono text-[12px] font-medium">{o.id.slice(0, 8)}</p>
          <p className="text-[11px] text-neutral-400">
            {new Date(o.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (o) => (
        <span className="text-[12px] text-neutral-700">
          {o.shipping_name}
          {o.shipping_city ? ` · ${o.shipping_city}` : ""}
        </span>
      ),
      mobileHidden: true,
    },
    {
      key: "total",
      header: "Total",
      render: (o) => (
        <span className="tabular-nums text-[13px] font-medium">
          {formatMoney(o.total_minor, o.currency === "PKR" ? "PKR" : "USD")}
        </span>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      render: (o) => (
        <div className="flex flex-col gap-1">
          <span className="text-[11px] uppercase tracking-[0.12em] text-neutral-500">{o.payment_method}</span>
          <StatusBadge label={o.payment_status} tone={o.payment_status === "paid" ? "success" : o.payment_status === "failed" ? "danger" : "default"} />
        </div>
      ),
      mobileHidden: true,
    },
    {
      key: "status",
      header: "Status",
      render: (o) => <StatusBadge label={o.status.replace("_", " ")} tone={o.status === "cancelled" || o.status === "refunded" ? "danger" : o.status === "delivered" ? "success" : "default"} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        description="Export your store data as CSV — every report is generated from real Supabase records."
        actions={
          <button
            type="button"
            onClick={exportOrders}
            disabled={loading || scopedOrders.length === 0}
            className="btn-press inline-flex h-10 items-center gap-2 bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-40"
          >
            <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Export orders CSV
          </button>
        }
      />

      {error ? (
        <ErrorState title="Couldn't load reports" body={error} onRetry={() => void load()} />
      ) : (
        <>
          {/* Date range */}
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

          {/* Export cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Sales (orders)", count: scopedOrders.length, onExport: exportOrders },
              { label: "Line items", count: scopedOrders.reduce((n, o) => n + (o.order_items?.length ?? 0), 0), onExport: exportOrderItems },
              { label: "Products", count: products.length, onExport: exportProducts },
              { label: "Customers", count: profiles.filter((p) => p.role === "customer").length, onExport: exportCustomers },
              { label: "Promotions", count: promotions.length, onExport: exportPromotions },
            ].map((report) => (
              <div key={report.label} className="flex items-center justify-between gap-3 border border-neutral-200 bg-background p-4">
                <div>
                  <p className="text-[12px] font-medium">{report.label}</p>
                  <p className="mt-0.5 text-[11px] text-neutral-400">{report.count} records</p>
                </div>
                <button
                  type="button"
                  onClick={report.onExport}
                  disabled={loading || report.count === 0}
                  className="flex h-9 w-9 items-center justify-center border border-neutral-200 text-neutral-500 transition-colors hover:border-foreground hover:bg-foreground hover:text-background disabled:opacity-30"
                  aria-label={`Export ${report.label} as CSV`}
                >
                  <Download className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                </button>
              </div>
            ))}
          </div>

          {/* Preview table */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-neutral-400" aria-hidden />
              <h2 className="font-display text-lg font-medium tracking-tight">Orders in range</h2>
              <span className="text-[12px] text-neutral-400">({scopedOrders.length})</span>
            </div>
            <DataTable
              columns={columns}
              rows={scopedOrders.slice(0, 25)}
              keyField={(o) => o.id}
              loading={loading}
              empty={
                <EmptyState
                  icon={ShoppingCart}
                  title="No orders in this range"
                  body="Orders placed in the selected period will appear here."
                />
              }
            />
          </section>
        </>
      )}
    </div>
  );
}
