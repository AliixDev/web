// frontend/app/seller/inventory/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Boxes, Loader2, Minus, Plus } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  LOW_STOCK_THRESHOLD,
  isSeller,
  type InventoryLogRow,
  type SellerProduct,
  type SellerProductVariant,
} from "@/lib/seller";
import DataTable, { type Column } from "@/components/seller/DataTable";
import { ErrorState, Field, Modal, PageHeader, StatusBadge } from "@/components/seller/ui";
import { toast } from "@/components/seller/Toast";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function SellerInventoryPage() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [history, setHistory] = useState<InventoryLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all");
  const [historyProductId, setHistoryProductId] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [adjusting, setAdjusting] = useState<SellerProduct | null>(null);
  const [target, setTarget] = useState<"product" | string>("product");
  const [delta, setDelta] = useState("1");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase isn't configured for this workspace yet.");
      setLoading(false);
      return;
    }
    if (!(await isSeller())) {
      setError("This account isn't authorized to manage inventory.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const [productsRes, historyRes] = await Promise.all([
        supabase.from("products").select("*, product_variants(*)").order("name"),
        supabase.from("inventory_log").select("*").order("created_at", { ascending: false }).limit(50),
      ]);
      setProducts((productsRes.data ?? []) as SellerProduct[]);
      setHistory((historyRes.data ?? []) as InventoryLogRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const productName = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products) map.set(product.id, product.name);
    return map;
  }, [products]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((p) => {
      if (stockFilter === "low" && p.stock_quantity > LOW_STOCK_THRESHOLD) return false;
      if (stockFilter === "out" && p.stock_quantity > 0) return false;
      if (term && !`${p.name} ${p.slug}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [products, query, stockFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => setPage(1), [query, stockFilter]);

  const filteredHistory = useMemo(() => {
    if (historyProductId === "all") return history;
    return history.filter((row) => row.product_id === historyProductId);
  }, [history, historyProductId]);

  function openAdjust(product: SellerProduct) {
    setAdjusting(product);
    setTarget(product.product_variants && product.product_variants.length > 0 ? product.product_variants[0].id : "product");
    setDelta("1");
    setReason("");
  }

  async function handleAdjust() {
    if (!adjusting) return;
    const amount = Math.round(Number(delta));
    if (!Number.isFinite(amount) || amount === 0) {
      toast({ title: "Enter a non-zero quantity", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await getSupabase().rpc("adjust_stock", {
        p_product_id: adjusting.id,
        p_variant_id: target === "product" ? null : target,
        p_delta: amount,
        p_reason: reason.trim() || "Manual adjustment",
      });
      if (error) throw error;
      toast({ title: "Stock adjusted", description: amount > 0 ? `+${amount} units` : `${amount} units`, variant: "success" });
      setAdjusting(null);
      await load();
    } catch (err) {
      toast({ title: "Couldn't adjust stock", description: err instanceof Error ? err.message : "Please try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  const variantsOf = (product: SellerProduct): SellerProductVariant[] =>
    (product.product_variants ?? []).filter((v) => v.is_active);

  const columns: Column<SellerProduct>[] = [
    {
      key: "name",
      header: "Product",
      sortable: true,
      render: (p) => (
        <span className="flex items-center gap-3">
          <span className="relative h-10 w-8 shrink-0 overflow-hidden border border-neutral-200 bg-neutral-100">
            {p.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Boxes className="h-4 w-4 text-neutral-300" aria-hidden />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium">{p.name}</span>
            {variantsOf(p).length > 0 && (
              <span className="block text-[11px] text-neutral-400">
                {variantsOf(p).length} variant{variantsOf(p).length === 1 ? "" : "s"}
              </span>
            )}
          </span>
        </span>
      ),
    },
    {
      key: "stock_quantity",
      header: "Stock",
      sortable: true,
      render: (p) => (
        <span className={cn("font-medium tabular-nums", p.stock_quantity <= 0 ? "text-destructive" : p.stock_quantity <= LOW_STOCK_THRESHOLD ? "text-neutral-800" : "")}>
          {p.stock_quantity}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <StatusBadge
          label={p.stock_quantity <= 0 ? "Out of stock" : p.stock_quantity <= LOW_STOCK_THRESHOLD ? "Low stock" : "In stock"}
          tone={p.stock_quantity <= 0 ? "danger" : p.stock_quantity <= LOW_STOCK_THRESHOLD ? "default" : "success"}
        />
      ),
      mobileHidden: true,
    },
    {
      key: "variants",
      header: "Variant stock",
      render: (p) => {
        const variants = variantsOf(p);
        if (variants.length === 0) return <span className="text-[12px] text-neutral-400">—</span>;
        return (
          <span className="inline-flex flex-wrap gap-1">
            {variants.map((v) => (
              <span
                key={v.id}
                className={cn(
                  "border px-2 py-0.5 text-[11px] tabular-nums",
                  v.stock_quantity <= 0 ? "border-destructive/30 text-destructive" : "border-neutral-200 text-neutral-600",
                )}
              >
                {v.name}: {v.stock_quantity}
              </span>
            ))}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (p) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openAdjust(p);
          }}
          className="btn-press inline-flex h-8 items-center gap-1.5 border border-neutral-300 px-3 text-[12px] font-medium transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
        >
          Adjust stock
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Stock"
        title="Inventory"
        description={`Products at or below ${LOW_STOCK_THRESHOLD} units are flagged as low stock.`}
      />

      {error ? (
        <ErrorState title="Couldn't load inventory" body={error} onRetry={() => void load()} />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products…"
                aria-label="Search products"
                className="h-10 w-full border border-neutral-200 bg-background px-3.5 text-[13px] transition-colors placeholder:text-neutral-400 hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
              />
            </div>
            <div className="flex gap-2">
              {(
                [
                  ["all", "All"],
                  ["low", `Low (≤${LOW_STOCK_THRESHOLD})`],
                  ["out", "Out of stock"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStockFilter(value)}
                  aria-pressed={stockFilter === value}
                  className={cn(
                    "h-10 border px-4 text-[12px] font-medium tracking-wide transition-colors",
                    stockFilter === value
                      ? "border-foreground bg-foreground text-background"
                      : "border-neutral-200 bg-background text-neutral-600 hover:border-neutral-400",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <DataTable
            columns={columns}
            rows={paginated}
            keyField={(p) => p.id}
            loading={loading}
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            empty={<div className="px-6 py-16 text-center text-[13px] text-neutral-600">No products match this view.</div>}
          />
        </>
      )}

      {/* Adjust stock modal */}
      <Modal
        open={adjusting !== null}
        onClose={() => !saving && setAdjusting(null)}
        title="Adjust stock"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setAdjusting(null)}
              disabled={saving}
              className="btn-press inline-flex h-10 items-center border border-neutral-200 px-5 text-[13px] font-medium transition-colors hover:border-neutral-400 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleAdjust()}
              disabled={saving}
              className="btn-press inline-flex h-10 items-center gap-2 bg-foreground px-6 text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              Apply adjustment
            </button>
          </>
        }
      >
        {adjusting && (
          <div className="space-y-4">
            <p className="text-[13px] font-medium">{adjusting.name}</p>
            <Field label="Target" htmlFor="adj-target">
              <select
                id="adj-target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="h-11 w-full cursor-pointer border border-neutral-200 bg-background px-3.5 text-[13px] transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
              >
                <option value="product">Base product ({adjusting.stock_quantity} in stock)</option>
                {variantsOf(adjusting).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.stock_quantity} in stock)
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Change (+ add / − remove)" htmlFor="adj-delta">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDelta(String((Math.round(Number(delta) || 0) || 0) - 1))}
                  aria-label="Decrease adjustment"
                  className="flex h-11 w-11 items-center justify-center border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50"
                >
                  <Minus className="h-3.5 w-3.5" aria-hidden />
                </button>
                <Input
                  id="adj-delta"
                  type="number"
                  inputMode="numeric"
                  value={delta}
                  onChange={(e) => setDelta(e.target.value)}
                  className="text-center"
                />
                <button
                  type="button"
                  onClick={() => setDelta(String((Math.round(Number(delta) || 0) || 0) + 1))}
                  aria-label="Increase adjustment"
                  className="flex h-11 w-11 items-center justify-center border border-neutral-200 text-neutral-500 transition-colors hover:bg-neutral-50"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </Field>

            <Field label="Reason" htmlFor="adj-reason">
              <Input
                id="adj-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Restock received, damaged unit, count correction"
              />
            </Field>
          </div>
        )}
      </Modal>

      {/* History */}
      <section>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h2 className="font-display text-lg font-medium tracking-tight">Adjustment history</h2>
          <select
            value={historyProductId}
            onChange={(e) => setHistoryProductId(e.target.value)}
            aria-label="Filter history by product"
            className="h-9 cursor-pointer border border-neutral-200 bg-background px-3 text-[12px] transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
          >
            <option value="all">All products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="mt-3 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="mt-3 flex flex-col items-center gap-3 border border-dashed border-neutral-200 px-6 py-12 text-center">
            <Boxes className="h-7 w-7 text-neutral-300" strokeWidth={1.25} aria-hidden />
            <p className="text-[13px] text-neutral-600">No adjustments recorded yet.</p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-100 border border-neutral-200">
            {filteredHistory.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">{productName.get(row.product_id) ?? "Deleted product"}</p>
                  <p className="mt-0.5 text-[11px] text-neutral-400">
                    {new Date(row.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    {row.reason ? ` · ${row.reason}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={cn("text-[12px] tabular-nums", row.change_quantity > 0 ? "text-neutral-800" : "text-destructive")}>
                    {row.change_quantity > 0 ? `+${row.change_quantity}` : row.change_quantity}
                  </span>
                  <span className="text-[11px] text-neutral-400 tabular-nums">
                    {row.previous_stock} → {row.new_stock}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
