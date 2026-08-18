// frontend/app/seller/orders/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  isSeller,
  type SellerOrder,
} from "@/lib/seller";
import { formatMoney } from "@/lib/currency";
import DataTable, { type Column } from "@/components/seller/DataTable";
import { ErrorState, Modal, PageHeader, StatusBadge, orderStatusTone, paymentStatusTone } from "@/components/seller/ui";
import { toast } from "@/components/seller/Toast";
import { cn } from "@/lib/utils";

const STATUS_TABS = ["all", "pending_payment", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusTab, setStatusTab] = useState<(typeof STATUS_TABS)[number]>("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  const [detail, setDetail] = useState<SellerOrder | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase isn't configured for this workspace yet.");
      setLoading(false);
      return;
    }
    if (!(await isSeller())) {
      setError("This account isn't authorized to view orders.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getSupabase()
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      setOrders((data ?? []) as SellerOrder[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Deep link from dashboard / notifications (?focus=<order-id>)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("focus");
    if (id && orders.length > 0) {
      const match = orders.find((o) => o.id === id);
      if (match) {
        setDetail(match);
        setNewStatus(match.status);
      }
    }
  }, [orders]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusTab !== "all" && o.status !== statusTab) return false;
      if (paymentFilter !== "all" && o.payment_status !== paymentFilter) return false;
      if (term) {
        const haystack = `${o.id} ${o.shipping_name} ${o.shipping_city} ${o.shipping_phone}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [orders, statusTab, paymentFilter, query]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => setPage(1), [statusTab, paymentFilter, query]);

  async function updateOrderStatus() {
    if (!detail) return;
    setUpdating(true);
    try {
      const { error } = await getSupabase().from("orders").update({ status: newStatus }).eq("id", detail.id);
      if (error) throw error;
      toast({ title: "Order status updated", variant: "success" });
      setOrders((items) => items.map((o) => (o.id === detail.id ? { ...o, status: newStatus } : o)));
      setDetail({ ...detail, status: newStatus });
      await load();
    } catch (err) {
      toast({ title: "Couldn't update order", description: err instanceof Error ? err.message : "Please try again.", variant: "error" });
    } finally {
      setUpdating(false);
    }
  }

  const currencyOf = (o: SellerOrder) => (o.currency === "PKR" ? "PKR" : "USD");

  const columns: Column<SellerOrder>[] = [
    {
      key: "id",
      header: "Order",
      render: (o) => (
        <span>
          <span className="font-mono text-[12px] font-medium">{o.id.slice(0, 8)}</span>
          <span className="block text-[11px] text-neutral-400">
            {new Date(o.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </span>
      ),
    },
    {
      key: "shipping_name",
      header: "Customer",
      sortable: true,
      render: (o) => (
        <span>
          <span className="block text-[13px] font-medium">{o.shipping_name}</span>
          <span className="block text-[11px] text-neutral-400">
            {o.shipping_city}, {o.shipping_country}
          </span>
        </span>
      ),
    },
    {
      key: "items",
      header: "Items",
      render: (o) => (
        <span className="text-[12px] text-neutral-600">
          {(o.order_items ?? []).reduce((sum, item) => sum + item.quantity, 0)}
        </span>
      ),
      mobileHidden: true,
    },
    {
      key: "total_minor",
      header: "Total",
      sortable: true,
      render: (o) => <span className="font-medium tabular-nums">{formatMoney(o.total_minor, currencyOf(o))}</span>,
    },
    {
      key: "payment_method",
      header: "Payment",
      render: (o) => (
        <span className="text-[12px] text-neutral-600">{PAYMENT_METHOD_LABELS[o.payment_method] ?? o.payment_method}</span>
      ),
      mobileHidden: true,
    },
    {
      key: "payment_status",
      header: "Payment",
      render: (o) => <StatusBadge label={PAYMENT_STATUS_LABELS[o.payment_status] ?? o.payment_status} tone={paymentStatusTone(o.payment_status)} />,
    },
    {
      key: "status",
      header: "Status",
      render: (o) => <StatusBadge label={ORDER_STATUS_LABELS[o.status] ?? o.status.replace("_", " ")} tone={orderStatusTone(o.status)} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description="Track, filter, and update every order from one place."
      />

      {error ? (
        <ErrorState title="Couldn't load orders" body={error} onRetry={() => void load()} />
      ) : (
        <>
          {/* Status tabs */}
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => {
              const count = tab === "all" ? orders.length : orders.filter((o) => o.status === tab).length;
              const active = statusTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusTab(tab)}
                  aria-pressed={active}
                  className={cn(
                    "h-9 shrink-0 border px-4 text-[12px] font-medium tracking-wide transition-colors",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-neutral-200 bg-background text-neutral-600 hover:border-neutral-400 hover:text-foreground",
                  )}
                >
                  {ORDER_STATUS_LABELS[tab] ?? (tab === "all" ? "All" : tab)}
                  <span className={cn("ml-1.5 tabular-nums", active ? "text-background/60" : "text-neutral-400")}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search order ID, customer, city…"
                aria-label="Search orders"
                className="h-10 w-full border border-neutral-200 bg-background px-3.5 text-[13px] transition-colors placeholder:text-neutral-400 hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
              />
            </div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              aria-label="Filter by payment status"
              className="h-10 cursor-pointer border border-neutral-200 bg-background px-3 text-[13px] transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
            >
              <option value="all">Any payment status</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <DataTable
            columns={columns}
            rows={paginated}
            keyField={(o) => o.id}
            loading={loading}
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onRowClick={(o) => {
              setDetail(o);
              setNewStatus(o.status);
            }}
            empty={<div className="px-6 py-16 text-center text-[13px] text-neutral-600">No orders match this view.</div>}
          />
        </>
      )}

      {/* Details drawer */}
      <Modal
        open={detail !== null}
        onClose={() => !updating && setDetail(null)}
        title="Order details"
        size="lg"
        footer={
          detail && (
            <>
              <button
                type="button"
                onClick={() => setDetail(null)}
                disabled={updating}
                className="btn-press inline-flex h-10 items-center border border-neutral-200 px-5 text-[13px] font-medium transition-colors hover:border-neutral-400 disabled:opacity-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => void updateOrderStatus()}
                disabled={updating || newStatus === detail.status}
                className="btn-press inline-flex h-10 items-center gap-2 bg-foreground px-6 text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-40"
              >
                {updating && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                Update status
              </button>
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[13px] font-medium">{detail.id}</p>
                <p className="mt-0.5 text-[12px] text-neutral-400">
                  Placed {new Date(detail.created_at).toLocaleString(undefined, { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge label={ORDER_STATUS_LABELS[detail.status] ?? detail.status} tone={orderStatusTone(detail.status)} />
                <StatusBadge label={PAYMENT_STATUS_LABELS[detail.payment_status] ?? detail.payment_status} tone={paymentStatusTone(detail.payment_status)} />
              </div>
            </div>

            {/* Status control */}
            <div className="grid gap-2 border border-neutral-200 bg-neutral-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <label htmlFor="order-status" className="text-[12px] font-medium text-neutral-700">
                Move order to
              </label>
              <select
                id="order-status"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="h-10 w-full cursor-pointer border border-neutral-200 bg-background px-3 text-[13px] transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0 sm:w-64"
              >
                {ORDER_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {ORDER_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            {/* Items */}
            <div>
              <h3 className="eyebrow">Items</h3>
              <ul className="mt-3 divide-y divide-neutral-100 border-y border-neutral-100">
                {(detail.order_items ?? []).map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{item.product_name}</p>
                      <p className="mt-0.5 text-[11px] text-neutral-400">
                        {item.variant_name ? `${item.variant_name} · ` : ""}
                        Qty {item.quantity} × {formatMoney(item.unit_price_minor, currencyOf(detail))}
                      </p>
                    </div>
                    <span className="shrink-0 text-[13px] font-medium tabular-nums">
                      {formatMoney(item.line_total_minor, currencyOf(detail))}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Subtotal</dt>
                  <dd className="tabular-nums">{formatMoney(detail.subtotal_minor, currencyOf(detail))}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Shipping</dt>
                  <dd className="tabular-nums">{formatMoney(detail.shipping_minor, currencyOf(detail))}</dd>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-2">
                  <dt className="font-medium">Total</dt>
                  <dd className="font-medium tabular-nums">{formatMoney(detail.total_minor, currencyOf(detail))}</dd>
                </div>
              </dl>
            </div>

            {/* Shipping */}
            <div>
              <h3 className="eyebrow">Delivery</h3>
              <dl className="mt-3 space-y-1.5 text-[13px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Name</dt>
                  <dd className="text-right">{detail.shipping_name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Phone</dt>
                  <dd className="text-right">{detail.shipping_phone}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Address</dt>
                  <dd className="max-w-[60%] text-right">
                    {detail.shipping_address_line1}
                    {detail.shipping_address_line2 ? `, ${detail.shipping_address_line2}` : ""}, {detail.shipping_city},{" "}
                    {detail.shipping_country}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-neutral-500">Payment</dt>
                  <dd className="text-right">{PAYMENT_METHOD_LABELS[detail.payment_method] ?? detail.payment_method}</dd>
                </div>
                {detail.notes && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-neutral-500">Notes</dt>
                    <dd className="max-w-[60%] text-right">{detail.notes}</dd>
                  </div>
                )}
              </dl>
            </div>

            {!detail.order_items || detail.order_items.length === 0 ? (
              <p className="flex items-center gap-2 text-[12px] text-neutral-400">
                <ShoppingCart className="h-4 w-4" aria-hidden /> No line items were recorded for this order.
              </p>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
}
