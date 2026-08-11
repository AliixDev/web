// frontend/app/seller/promotions/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Percent, Plus, Tag, Trash2 } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { fromMinor, isSeller, toMinor, type SellerCategory, type SellerProduct, type SellerPromotion } from "@/lib/seller";
import { formatMoney } from "@/lib/currency";
import DataTable, { type Column } from "@/components/seller/DataTable";
import { ConfirmDialog, ErrorState, Field, Modal, PageHeader, StatusBadge } from "@/components/seller/ui";
import { toast } from "@/components/seller/Toast";
import { Input } from "@/components/ui/input";

interface PromotionDraft {
  id: string | null;
  code: string;
  description: string;
  discount_type: "percent" | "fixed";
  discount_value: string;
  currency: string;
  product_id: string;
  category_id: string;
  min_subtotal: string;
  starts_at: string;
  ends_at: string;
  usage_limit: string;
  is_active: boolean;
}

const EMPTY_DRAFT: PromotionDraft = {
  id: null,
  code: "",
  description: "",
  discount_type: "percent",
  discount_value: "",
  currency: "",
  product_id: "",
  category_id: "",
  min_subtotal: "",
  starts_at: "",
  ends_at: "",
  usage_limit: "",
  is_active: true,
};

export default function SellerPromotionsPage() {
  const [promotions, setPromotions] = useState<SellerPromotion[]>([]);
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [categories, setCategories] = useState<SellerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [draft, setDraft] = useState<PromotionDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<SellerPromotion | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase isn't configured for this workspace yet.");
      setLoading(false);
      return;
    }
    if (!(await isSeller())) {
      setError("This account isn't authorized to manage promotions.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const [promotionsRes, productsRes, categoriesRes] = await Promise.all([
        supabase.from("promotions").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("id, name").order("name"),
        supabase.from("categories").select("id, name").order("name"),
      ]);
      setPromotions((promotionsRes.data ?? []) as SellerPromotion[]);
      setProducts((productsRes.data ?? []) as SellerProduct[]);
      setCategories((categoriesRes.data ?? []) as SellerCategory[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load promotions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const productName = useCallback(
    (id: string | null) => products.find((p) => p.id === id)?.name ?? null,
    [products],
  );
  const categoryName = useCallback(
    (id: string | null) => categories.find((c) => c.id === id)?.name ?? null,
    [categories],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const now = Date.now();
    return promotions.filter((p) => {
      if (statusFilter === "active" && !p.is_active) return false;
      if (statusFilter === "inactive" && p.is_active) return false;
      if (statusFilter === "expired" && !(!p.is_active || (p.ends_at && new Date(p.ends_at).getTime() < now))) return false;
      if (term && !`${p.code} ${p.description}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [promotions, query, statusFilter]);

  const promotionScope = useCallback(
    (p: SellerPromotion) => {
      if (p.product_id) return `Product: ${productName(p.product_id) ?? "—"}`;
      if (p.category_id) return `Category: ${categoryName(p.category_id) ?? "—"}`;
      return "All products";
    },
    [productName, categoryName],
  );

  const promotionValue = useCallback(
    (p: SellerPromotion) => {
      if (p.discount_type === "percent") return `${p.discount_value}% off`;
      return `${formatMoney(p.discount_value, (p.currency as "USD" | "PKR") ?? "USD")} off`;
    },
    [],
  );

  const isExpired = useCallback((p: SellerPromotion) => {
    return Boolean(p.ends_at && new Date(p.ends_at).getTime() < Date.now());
  }, []);

  function openNew() {
    setDraft(EMPTY_DRAFT);
  }

  function openEdit(p: SellerPromotion) {
    setDraft({
      id: p.id,
      code: p.code,
      description: p.description,
      discount_type: p.discount_type,
      discount_value: String(p.discount_value),
      currency: p.currency ?? "",
      product_id: p.product_id ?? "",
      category_id: p.category_id ?? "",
      min_subtotal: p.min_subtotal_minor !== null ? String(fromMinor(p.min_subtotal_minor)) : "",
      starts_at: p.starts_at ? new Date(p.starts_at).toISOString().slice(0, 16) : "",
      ends_at: p.ends_at ? new Date(p.ends_at).toISOString().slice(0, 16) : "",
      usage_limit: p.usage_limit !== null ? String(p.usage_limit) : "",
      is_active: p.is_active,
    });
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    if (!draft.code.trim()) {
      toast({ title: "Promo code is required", variant: "error" });
      return;
    }
    const value = Number(draft.discount_value);
    if (!value || value <= 0) {
      toast({ title: "Enter a discount value greater than zero", variant: "error" });
      return;
    }
    if (draft.discount_type === "percent" && value > 100) {
      toast({ title: "Percentage discount can't exceed 100%", variant: "error" });
      return;
    }
    if (draft.product_id && draft.category_id) {
      toast({ title: "Pick one scope", description: "A promotion applies to a product, a category, or everything — not both.", variant: "error" });
      return;
    }
    if (draft.ends_at && draft.starts_at && new Date(draft.ends_at) <= new Date(draft.starts_at)) {
      toast({ title: "End date must be after the start date", variant: "error" });
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabase();
      const payload = {
        code: draft.code.trim().toUpperCase(),
        description: draft.description.trim(),
        discount_type: draft.discount_type,
        discount_value: Math.round(value),
        currency: draft.currency || null,
        product_id: draft.product_id || null,
        category_id: draft.category_id || null,
        min_subtotal_minor: draft.min_subtotal ? toMinor(Number(draft.min_subtotal)) : null,
        starts_at: draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
        ends_at: draft.ends_at ? new Date(draft.ends_at).toISOString() : null,
        usage_limit: draft.usage_limit ? Math.max(1, Math.round(Number(draft.usage_limit))) : null,
        is_active: draft.is_active,
      };
      if (draft.id) {
        const { error } = await supabase.from("promotions").update(payload).eq("id", draft.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("promotions").insert(payload);
        if (error) throw error;
      }
      toast({ title: draft.id ? "Promotion updated" : "Promotion created", variant: "success" });
      setDraft(null);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/duplicate|unique/i.test(message)) {
        toast({ title: "That code already exists", description: "Promo codes must be unique.", variant: "error" });
      } else {
        toast({ title: "Couldn't save promotion", description: message || "Please try again.", variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const { error } = await getSupabase().from("promotions").delete().eq("id", deleting.id);
      if (error) throw error;
      toast({ title: "Promotion deleted", variant: "success" });
      setDeleting(null);
      await load();
    } catch (err) {
      toast({ title: "Couldn't delete promotion", description: err instanceof Error ? err.message : "Please try again.", variant: "error" });
    } finally {
      setDeleteBusy(false);
    }
  }

  async function toggleActive(p: SellerPromotion) {
    try {
      const { error } = await getSupabase().from("promotions").update({ is_active: !p.is_active }).eq("id", p.id);
      if (error) throw error;
      toast({ title: p.is_active ? "Promotion deactivated" : "Promotion activated", variant: "success" });
      await load();
    } catch (err) {
      toast({ title: "Couldn't update promotion", description: err instanceof Error ? err.message : "Please try again.", variant: "error" });
    }
  }

  const columns: Column<SellerPromotion>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      render: (p) => (
        <div className="min-w-0">
          <p className="font-mono text-[13px] font-semibold">{p.code}</p>
          {p.description && <p className="mt-0.5 max-w-[240px] truncate text-[11px] text-neutral-400">{p.description}</p>}
        </div>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      sortable: true,
      render: (p) => <span className="tabular-nums">{promotionValue(p)}</span>,
      mobileHidden: true,
    },
    {
      key: "scope",
      header: "Applies to",
      render: (p) => <span className="max-w-[220px] truncate text-[12px] text-neutral-600">{promotionScope(p)}</span>,
    },
    {
      key: "usage",
      header: "Usage",
      sortable: true,
      render: (p) => (
        <span className="tabular-nums text-[12px] text-neutral-600">
          {p.used_count}
          {p.usage_limit !== null ? ` / ${p.usage_limit}` : ""}
        </span>
      ),
      mobileHidden: true,
    },
    {
      key: "window",
      header: "Schedule",
      render: (p) => {
        const fmt = (iso: string | null) =>
          iso ? new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";
        return <span className="text-[12px] text-neutral-500">{fmt(p.starts_at)} → {fmt(p.ends_at)}</span>;
      },
      mobileHidden: true,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => {
        if (!p.is_active) return <StatusBadge label="Inactive" tone="muted" />;
        if (isExpired(p)) return <StatusBadge label="Expired" tone="danger" />;
        return <StatusBadge label="Active" tone="success" />;
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (p) => (
        <span className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => void toggleActive(p)}
            className="h-8 border border-neutral-200 px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:border-neutral-400"
          >
            {p.is_active ? "Disable" : "Enable"}
          </button>
          <button
            type="button"
            onClick={() => setDeleting(p)}
            className="flex h-8 w-8 items-center justify-center border border-neutral-200 text-neutral-400 transition-colors hover:border-destructive/40 hover:text-destructive"
            aria-label={`Delete ${p.code}`}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          </button>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketing"
        title="Promotions"
        description="Discount codes for your store. Codes are managed here — applying them at checkout is a Phase 2 backend step."
        actions={
          <button
            type="button"
            onClick={openNew}
            className="btn-press inline-flex h-10 items-center gap-2 bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden /> New promotion
          </button>
        }
      />

      {error ? (
        <ErrorState title="Couldn't load promotions" body={error} onRetry={() => void load()} />
      ) : (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search codes…"
              aria-label="Search promotions"
              className="h-10 w-full max-w-sm border border-neutral-200 bg-background px-3.5 text-[13px] transition-colors placeholder:text-neutral-400 hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="h-10 cursor-pointer border border-neutral-200 bg-background px-3 text-[13px] transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <DataTable
            columns={columns}
            rows={filtered}
            keyField={(p) => p.id}
            loading={loading}
            onRowClick={(p) => openEdit(p)}
            empty={
              <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
                <Tag className="h-8 w-8 text-neutral-300" strokeWidth={1.25} aria-hidden />
                <p className="text-[13px] text-neutral-600">
                  {query || statusFilter !== "all"
                    ? "No promotions match your filters."
                    : "No promotions yet — create a discount code to get started."}
                </p>
                {!query && statusFilter === "all" && (
                  <button
                    type="button"
                    onClick={openNew}
                    className="btn-press inline-flex h-10 items-center gap-2 bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
                  >
                    <Plus className="h-4 w-4" aria-hidden /> New promotion
                  </button>
                )}
              </div>
            }
          />
        </>
      )}

      {/* Add / edit modal */}
      <Modal
        open={draft !== null}
        onClose={() => !saving && setDraft(null)}
        title={draft?.id ? "Edit promotion" : "New promotion"}
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDraft(null)}
              disabled={saving}
              className="btn-press inline-flex h-10 items-center border border-neutral-200 px-5 text-[13px] font-medium transition-colors hover:border-neutral-400 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => void handleSave(e)}
              disabled={saving}
              className="btn-press inline-flex h-10 items-center gap-2 bg-foreground px-6 text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              {draft?.id ? "Save changes" : "Create promotion"}
            </button>
          </>
        }
      >
        {draft && (
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Code" htmlFor="promo-code">
                <Input
                  id="promo-code"
                  value={draft.code}
                  onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                  required
                  placeholder="WELCOME10"
                  className="font-mono uppercase"
                />
              </Field>
              <Field label="Type" htmlFor="promo-type">
                <select
                  id="promo-type"
                  value={draft.discount_type}
                  onChange={(e) => setDraft({ ...draft, discount_type: e.target.value as "percent" | "fixed" })}
                  className="h-11 w-full cursor-pointer border border-neutral-200 bg-background px-3.5 text-[13px] transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
                >
                  <option value="percent">Percentage off</option>
                  <option value="fixed">Fixed amount off</option>
                </select>
              </Field>
              <Field label={draft.discount_type === "percent" ? "Discount (%)" : "Discount amount"} htmlFor="promo-value">
                <Input
                  id="promo-value"
                  type="number"
                  min="0"
                  step={draft.discount_type === "percent" ? "1" : "0.01"}
                  inputMode="decimal"
                  value={draft.discount_value}
                  onChange={(e) => setDraft({ ...draft, discount_value: e.target.value })}
                  placeholder={draft.discount_type === "percent" ? "10" : "5.00"}
                  required
                />
              </Field>
              <Field label="Currency (fixed only)" htmlFor="promo-currency">
                <select
                  id="promo-currency"
                  value={draft.currency}
                  onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
                  disabled={draft.discount_type === "percent"}
                  className="h-11 w-full cursor-pointer border border-neutral-200 bg-background px-3.5 text-[13px] transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">—</option>
                  <option value="USD">USD</option>
                  <option value="PKR">PKR</option>
                </select>
              </Field>
            </div>

            <Field label="Description" htmlFor="promo-description">
              <Input
                id="promo-description"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                placeholder="e.g. Launch discount for first-time buyers"
              />
            </Field>

            {/* Scope */}
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Apply to a product" htmlFor="promo-product">
                <select
                  id="promo-product"
                  value={draft.product_id}
                  onChange={(e) => setDraft({ ...draft, product_id: e.target.value })}
                  className="h-11 w-full cursor-pointer border border-neutral-200 bg-background px-3.5 text-[13px] transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
                >
                  <option value="">Any product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Apply to a category" htmlFor="promo-category">
                <select
                  id="promo-category"
                  value={draft.category_id}
                  onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
                  className="h-11 w-full cursor-pointer border border-neutral-200 bg-background px-3.5 text-[13px] transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
                >
                  <option value="">Any category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Minimum subtotal" htmlFor="promo-min">
                <Input
                  id="promo-min"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={draft.min_subtotal}
                  onChange={(e) => setDraft({ ...draft, min_subtotal: e.target.value })}
                  placeholder="Optional — e.g. 50.00"
                />
              </Field>
              <Field label="Usage limit" htmlFor="promo-limit">
                <Input
                  id="promo-limit"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={draft.usage_limit}
                  onChange={(e) => setDraft({ ...draft, usage_limit: e.target.value })}
                  placeholder="Optional — unlimited"
                />
              </Field>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Starts" htmlFor="promo-start">
                <Input
                  id="promo-start"
                  type="datetime-local"
                  value={draft.starts_at}
                  onChange={(e) => setDraft({ ...draft, starts_at: e.target.value })}
                />
              </Field>
              <Field label="Ends" htmlFor="promo-end">
                <Input
                  id="promo-end"
                  type="datetime-local"
                  value={draft.ends_at}
                  onChange={(e) => setDraft({ ...draft, ends_at: e.target.value })}
                />
              </Field>
            </div>

            <label className="flex items-center gap-2.5 text-[13px] text-neutral-700">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                className="h-4 w-4 accent-neutral-900"
              />
              Active — customers can use this code
            </label>
          </form>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => !deleteBusy && setDeleting(null)}
        onConfirm={() => void handleDelete()}
        title="Delete promotion"
        body={deleting ? `Delete code "${deleting.code}"? This can't be undone.` : ""}
        confirmLabel="Delete"
        destructive
        busy={deleteBusy}
      />
    </div>
  );
}
