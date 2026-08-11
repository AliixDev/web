// frontend/app/seller/customers/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { isSeller, type SellerOrder, type SellerProfile } from "@/lib/seller";
import { formatMoney } from "@/lib/currency";
import DataTable, { type Column } from "@/components/seller/DataTable";
import { ErrorState, Modal, PageHeader, StatusBadge, orderStatusTone } from "@/components/seller/ui";
import { cn } from "@/lib/utils";

interface CustomerRow {
  profile: SellerProfile;
  orderCount: number;
  totalSpendUsd: number;
  totalSpendPkr: number;
}

export default function SellerCustomersPage() {
  const [profiles, setProfiles] = useState<SellerProfile[]>([]);
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [detail, setDetail] = useState<CustomerRow | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase isn't configured for this workspace yet.");
      setLoading(false);
      return;
    }
    if (!(await isSeller())) {
      setError("This account isn't authorized to view customers.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const [profilesRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, phone, role, default_currency, created_at").order("created_at", { ascending: false }),
        supabase.from("orders").select("id, user_id, status, currency, total_minor, shipping_name, created_at").order("created_at", { ascending: false }),
      ]);
      setProfiles((profilesRes.data ?? []) as SellerProfile[]);
      setOrders((ordersRes.data ?? []) as SellerOrder[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load customers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo<CustomerRow[]>(() => {
    return profiles.map((profile) => {
      const customerOrders = orders.filter((o) => o.user_id === profile.id);
      const usd = customerOrders.filter((o) => o.currency !== "PKR").reduce((sum, o) => sum + o.total_minor, 0);
      const pkr = customerOrders.filter((o) => o.currency === "PKR").reduce((sum, o) => sum + o.total_minor, 0);
      return { profile, orderCount: customerOrders.length, totalSpendUsd: usd, totalSpendPkr: pkr };
    });
  }, [profiles, orders]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      `${row.profile.full_name ?? ""} ${row.profile.email ?? ""} ${row.profile.phone ?? ""}`.toLowerCase().includes(term),
    );
  }, [rows, query]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => setPage(1), [query]);

  const customerOrders = (customerId: string) => orders.filter((o) => o.user_id === customerId);

  const columns: Column<CustomerRow>[] = [
    {
      key: "customer",
      header: "Customer",
      sortable: true,
      render: (row) => (
        <span>
          <span className="block text-[13px] font-medium">{row.profile.full_name || "Unnamed customer"}</span>
          <span className="block text-[11px] text-neutral-400">{row.profile.email ?? "No email on file"}</span>
        </span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => <span className="text-[12px] text-neutral-600">{row.profile.phone ?? "—"}</span>,
      mobileHidden: true,
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <StatusBadge
          label={row.profile.role}
          tone={row.profile.role === "seller" || row.profile.role === "admin" ? "dark" : "muted"}
        />
      ),
      mobileHidden: true,
    },
    {
      key: "orderCount",
      header: "Orders",
      sortable: true,
      render: (row) => <span className="tabular-nums">{row.orderCount}</span>,
    },
    {
      key: "totalSpendUsd",
      header: "Spent (USD)",
      sortable: true,
      render: (row) => <span className="tabular-nums">{formatMoney(row.totalSpendUsd, "USD")}</span>,
      mobileHidden: true,
    },
    {
      key: "totalSpendPkr",
      header: "Spent (PKR)",
      sortable: true,
      render: (row) => <span className="tabular-nums">{formatMoney(row.totalSpendPkr, "PKR")}</span>,
      mobileHidden: true,
    },
    {
      key: "created_at",
      header: "Joined",
      sortable: true,
      render: (row) => (
        <span className="text-[12px] text-neutral-500">
          {new Date(row.profile.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
        </span>
      ),
      mobileHidden: true,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directory"
        title="Customers"
        description="Everyone with an account — including their order history and lifetime spend."
      />

      {error ? (
        <ErrorState title="Couldn't load customers" body={error} onRetry={() => void load()} />
      ) : (
        <>
          <div className="relative max-w-md">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone…"
              aria-label="Search customers"
              className="h-10 w-full border border-neutral-200 bg-background px-3.5 text-[13px] transition-colors placeholder:text-neutral-400 hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
            />
          </div>

          <DataTable
            columns={columns}
            rows={paginated}
            keyField={(row) => row.profile.id}
            loading={loading}
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onRowClick={setDetail}
            empty={<div className="px-6 py-16 text-center text-[13px] text-neutral-600">No customers yet — new accounts appear here as they sign up.</div>}
          />
        </>
      )}

      {/* Customer details */}
      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title="Customer details"
        size="lg"
        footer={
          <button
            type="button"
            onClick={() => setDetail(null)}
            className="btn-press inline-flex h-10 items-center border border-neutral-200 px-5 text-[13px] font-medium transition-colors hover:border-neutral-400"
          >
            Close
          </button>
        }
      >
        {detail && (
          <div className="space-y-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-xl font-medium tracking-tight">
                  {detail.profile.full_name || "Unnamed customer"}
                </p>
                <p className="mt-1 text-[12px] text-neutral-400">{detail.profile.email ?? "No email on file"}</p>
                <p className="mt-0.5 text-[12px] text-neutral-400">
                  {detail.profile.phone ? `+${detail.profile.phone}` : "No phone on file"}
                </p>
              </div>
              <StatusBadge
                label={detail.profile.role}
                tone={detail.profile.role === "seller" || detail.profile.role === "admin" ? "dark" : "muted"}
              />
            </div>

            <dl className="grid grid-cols-3 gap-3">
              <div className="border border-neutral-200 p-4 text-center">
                <dt className="eyebrow">Orders</dt>
                <dd className="mt-2 font-display text-2xl font-light tabular-nums">{detail.orderCount}</dd>
              </div>
              <div className="border border-neutral-200 p-4 text-center">
                <dt className="eyebrow">Spent (USD)</dt>
                <dd className="mt-2 font-display text-2xl font-light tabular-nums">{formatMoney(detail.totalSpendUsd, "USD")}</dd>
              </div>
              <div className="border border-neutral-200 p-4 text-center">
                <dt className="eyebrow">Spent (PKR)</dt>
                <dd className="mt-2 font-display text-2xl font-light tabular-nums">{formatMoney(detail.totalSpendPkr, "PKR")}</dd>
              </div>
            </dl>

            <div>
              <h3 className="eyebrow">Order history</h3>
              {customerOrders(detail.profile.id).length === 0 ? (
                <div className="mt-3 flex flex-col items-center gap-3 border border-dashed border-neutral-200 px-6 py-10 text-center">
                  <Users className="h-6 w-6 text-neutral-300" strokeWidth={1.25} aria-hidden />
                  <p className="text-[13px] text-neutral-600">This customer hasn&apos;t placed any orders yet.</p>
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-neutral-100 border-y border-neutral-100">
                  {customerOrders(detail.profile.id).map((order) => (
                    <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-mono text-[12px] font-medium">{order.id.slice(0, 8)}</p>
                        <p className="mt-0.5 text-[11px] text-neutral-400">
                          {new Date(order.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge label={order.status.replace("_", " ")} tone={orderStatusTone(order.status)} />
                        <span className="text-[13px] font-medium tabular-nums">
                          {formatMoney(order.total_minor, order.currency === "PKR" ? "PKR" : "USD")}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className={cn("text-[11px] text-neutral-400")}>
              Customer emails are mirrored from Supabase Auth at signup (profiles.email) — sellers see only what RLS permits.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
