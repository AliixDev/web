// frontend/app/seller/products/page.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Copy, ImagePlus, Loader2, Package, Plus, Trash2 } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import {
  fromMinor,
  isSeller,
  slugify,
  toMinor,
  type SellerCategory,
  type SellerProduct,
  type SellerProductVariant,
} from "@/lib/seller";
import { formatMoney } from "@/lib/currency";
import DataTable, { type Column } from "@/components/seller/DataTable";
import { ConfirmDialog, ErrorState, Field, Modal, PageHeader, StatusBadge } from "@/components/seller/ui";
import { toast } from "@/components/seller/Toast";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface VariantDraft {
  id?: string;
  name: string;
  sku: string;
  priceUsd: string;
  pricePkr: string;
  stock: string;
  is_active: boolean;
}

interface ProductDraft {
  id: string | null;
  name: string;
  slug: string;
  slugTouched: boolean;
  category_id: string;
  description: string;
  priceUsd: string;
  pricePkr: string;
  stock: string;
  is_active: boolean;
  image_url: string;
  variants: VariantDraft[];
}

const EMPTY_DRAFT: ProductDraft = {
  id: null,
  name: "",
  slug: "",
  slugTouched: false,
  category_id: "",
  description: "",
  priceUsd: "",
  pricePkr: "",
  stock: "0",
  is_active: true,
  image_url: "",
  variants: [],
};

export default function SellerProductsPage() {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [categories, setCategories] = useState<SellerCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [pageSize] = useState(10);

  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<SellerProduct | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase isn't configured for this workspace yet.");
      setLoading(false);
      return;
    }
    if (!(await isSeller())) {
      setError("This account isn't authorized to manage products.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const [productsRes, categoriesRes] = await Promise.all([
        supabase
          .from("products")
          .select("*, product_variants(*)")
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("id, name, slug, parent_id, is_active").order("name"),
      ]);
      setProducts((productsRes.data ?? []) as SellerProduct[]);
      setCategories((categoriesRes.data ?? []) as SellerCategory[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Focus an order from the dashboard "focus" link
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("focus");
    if (id) setFocusId(id);
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    let list = products.filter((p) => {
      if (categoryFilter !== "all" && p.category_id !== categoryFilter) return false;
      if (statusFilter === "active" && !p.is_active) return false;
      if (statusFilter === "inactive" && p.is_active) return false;
      if (statusFilter === "out" && p.stock_quantity > 0) return false;
      if (term) {
        const haystack = `${p.name} ${p.slug} ${p.description}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });

    if (sortKey) {
      list = [...list].sort((a, b) => {
        let left: number | string = 0;
        let right: number | string = 0;
        switch (sortKey) {
          case "name":
            left = a.name.toLowerCase();
            right = b.name.toLowerCase();
            break;
          case "price_usd_cents":
            left = a.price_usd_cents;
            right = b.price_usd_cents;
            break;
          case "stock_quantity":
            left = a.stock_quantity;
            right = b.stock_quantity;
            break;
          default:
            left = new Date(a.created_at).getTime();
            right = new Date(b.created_at).getTime();
        }
        if (left < right) return sortDir === "asc" ? -1 : 1;
        if (left > right) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [products, query, categoryFilter, statusFilter, sortKey, sortDir]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => setPage(1), [query, categoryFilter, statusFilter]);

  const categoryName = useCallback(
    (id: string | null) => categories.find((c) => c.id === id)?.name ?? "Uncategorized",
    [categories],
  );

  function openNew() {
    setDraft(EMPTY_DRAFT);
  }

  function openEdit(product: SellerProduct) {
    const variants: VariantDraft[] = (product.product_variants ?? []).map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      priceUsd: v.price_usd_cents !== null ? String(fromMinor(v.price_usd_cents)) : "",
      pricePkr: v.price_pkr_paisa !== null ? String(fromMinor(v.price_pkr_paisa)) : "",
      stock: String(v.stock_quantity),
      is_active: v.is_active,
    }));
    setDraft({
      id: product.id,
      name: product.name,
      slug: product.slug,
      slugTouched: true,
      category_id: product.category_id ?? "",
      description: product.description,
      priceUsd: String(fromMinor(product.price_usd_cents)),
      pricePkr: String(fromMinor(product.price_pkr_paisa)),
      stock: String(product.stock_quantity),
      is_active: product.is_active,
      image_url: product.image_url ?? "",
      variants,
    });
  }

  async function handleUpload(file: File) {
    if (!draft) return;
    setUploading(true);
    try {
      const supabase = getSupabase();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setDraft({ ...draft, image_url: data.publicUrl });
      toast({ title: "Image uploaded", variant: "success" });
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Couldn't upload the image.", variant: "error" });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    if (!draft.name.trim() || !draft.slug.trim()) {
      toast({ title: "Name and slug are required", variant: "error" });
      return;
    }
    const skus = draft.variants.map((v) => v.sku.trim()).filter(Boolean);
    if (new Set(skus).size !== skus.length) {
      toast({ title: "Variant SKUs must be unique", variant: "error" });
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabase();
      const payload = {
        name: draft.name.trim(),
        slug: draft.slug.trim(),
        category_id: draft.category_id || null,
        description: draft.description.trim(),
        price_usd_cents: toMinor(Number(draft.priceUsd) || 0),
        price_pkr_paisa: toMinor(Number(draft.pricePkr) || 0),
        stock_quantity: Math.max(0, Math.round(Number(draft.stock) || 0)),
        is_active: draft.is_active,
        image_url: draft.image_url || null,
      };

      let productId: string;
      if (draft.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", draft.id);
        if (error) throw error;
        productId = draft.id;
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        productId = data.id as string;
      }

      // Variants: delete removed, update existing, insert new
      const existing = (products.find((p) => p.id === productId)?.product_variants ?? []).filter((v) => v.is_active);
      const keptIds = draft.variants.map((v) => v.id).filter(Boolean);
      for (const variant of existing) {
        if (variant.id && !keptIds.includes(variant.id)) {
          await supabase.from("product_variants").delete().eq("id", variant.id);
        }
      }
      for (const variant of draft.variants) {
        const variantPayload = {
          product_id: productId,
          name: variant.name.trim(),
          sku: variant.sku.trim() || `${draft.slug.trim()}-${variant.name.trim() || "variant"}`.toLowerCase(),
          price_usd_cents: variant.priceUsd ? toMinor(Number(variant.priceUsd)) : null,
          price_pkr_paisa: variant.pricePkr ? toMinor(Number(variant.pricePkr)) : null,
          stock_quantity: Math.max(0, Math.round(Number(variant.stock) || 0)),
          is_active: variant.is_active,
        };
        if (variant.id) {
          const { error } = await supabase.from("product_variants").update(variantPayload).eq("id", variant.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("product_variants").insert(variantPayload);
          if (error) throw error;
        }
      }

      toast({ title: draft.id ? "Product updated" : "Product created", variant: "success" });
      setDraft(null);
      await load();
    } catch (err) {
      toast({ title: "Couldn't save product", description: err instanceof Error ? err.message : "Please try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const { error } = await getSupabase().from("products").delete().eq("id", deleting.id);
      if (error) throw error;
      toast({ title: "Product deleted", variant: "success" });
      setDeleting(null);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/foreign key|order_items/i.test(message)) {
        toast({
          title: "Can't delete this product",
          description: "It has order history. Deactivate it instead to hide it from the store.",
          variant: "error",
        });
      } else {
        toast({ title: "Couldn't delete product", description: message || "Please try again.", variant: "error" });
      }
    } finally {
      setDeleteBusy(false);
    }
  }

  async function toggleActive(product: SellerProduct) {
    try {
      const { error } = await getSupabase().from("products").update({ is_active: !product.is_active }).eq("id", product.id);
      if (error) throw error;
      toast({ title: product.is_active ? "Product deactivated" : "Product activated", variant: "success" });
      await load();
    } catch (err) {
      toast({ title: "Couldn't update status", description: err instanceof Error ? err.message : "Please try again.", variant: "error" });
    }
  }

  async function duplicate(product: SellerProduct) {
    try {
      const supabase = getSupabase();
      const baseSlug = slugify(product.name);
      const { data: newProduct, error } = await supabase
        .from("products")
        .insert({
          name: `${product.name} (Copy)`,
          slug: `${baseSlug}-copy`,
          category_id: product.category_id,
          description: product.description,
          image_url: product.image_url,
          price_usd_cents: product.price_usd_cents,
          price_pkr_paisa: product.price_pkr_paisa,
          stock_quantity: product.stock_quantity,
          is_active: false,
        })
        .select("id")
        .single();
      if (error) throw error;
      for (const variant of product.product_variants ?? []) {
        await supabase.from("product_variants").insert({
          product_id: newProduct.id,
          name: variant.name,
          sku: `${variant.sku}-copy`,
          price_usd_cents: variant.price_usd_cents,
          price_pkr_paisa: variant.price_pkr_paisa,
          stock_quantity: variant.stock_quantity,
          is_active: variant.is_active,
        });
      }
      toast({ title: "Product duplicated as a draft", description: "Edit the copy before activating it.", variant: "success" });
      await load();
    } catch (err) {
      toast({ title: "Couldn't duplicate product", description: err instanceof Error ? err.message : "Please try again.", variant: "error" });
    }
  }

  const columns: Column<SellerProduct>[] = [
    {
      key: "product",
      header: "Product",
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <span className="relative h-12 w-10 shrink-0 overflow-hidden border border-neutral-200 bg-neutral-100">
            {p.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Package className="h-4 w-4 text-neutral-300" aria-hidden />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium">{p.name}</span>
            <span className="block truncate text-[11px] text-neutral-400">/{p.slug}</span>
          </span>
        </div>
      ),
    },
    {
      key: "category_id",
      header: "Category",
      render: (p) => <span className="text-[12px] text-neutral-600">{categoryName(p.category_id)}</span>,
      mobileHidden: true,
    },
    {
      key: "price_usd_cents",
      header: "Price (USD)",
      sortable: true,
      render: (p) => <span className="tabular-nums">{formatMoney(p.price_usd_cents, "USD")}</span>,
      mobileHidden: true,
    },
    {
      key: "price_pkr_paisa",
      header: "Price (PKR)",
      sortable: true,
      render: (p) => <span className="tabular-nums">{formatMoney(p.price_pkr_paisa, "PKR")}</span>,
      mobileHidden: true,
    },
    {
      key: "stock_quantity",
      header: "Stock",
      sortable: true,
      render: (p) => (
        <span className={cn("tabular-nums", p.stock_quantity <= 0 && "font-medium text-destructive")}>
          {p.stock_quantity}
        </span>
      ),
    },
    {
      key: "variants",
      header: "Variants",
      render: (p) => <span className="text-[12px] text-neutral-500">{(p.product_variants ?? []).filter((v) => v.is_active).length}</span>,
      mobileHidden: true,
    },
    {
      key: "status",
      header: "Status",
      render: (p) => (
        <StatusBadge
          label={!p.is_active ? "Inactive" : p.stock_quantity <= 0 ? "Out of stock" : "Active"}
          tone={!p.is_active ? "muted" : p.stock_quantity <= 0 ? "danger" : "success"}
        />
      ),
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
            aria-label={p.is_active ? "Deactivate product" : "Activate product"}
          >
            {p.is_active ? "Deactivate" : "Activate"}
          </button>
          <button
            type="button"
            onClick={() => void duplicate(p)}
            className="flex h-8 w-8 items-center justify-center border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-400 hover:text-foreground"
            aria-label={`Duplicate ${p.name}`}
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setDeleting(p)}
            className="flex h-8 w-8 items-center justify-center border border-neutral-200 text-neutral-400 transition-colors hover:border-destructive/40 hover:text-destructive"
            aria-label={`Delete ${p.name}`}
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
        eyebrow="Catalog"
        title="Products"
        description="Manage your catalog — prices, stock, variants, and images."
        actions={
          <button
            type="button"
            onClick={openNew}
            className="btn-press inline-flex h-10 items-center gap-2 bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Add product
          </button>
        }
      />

      {error ? (
        <ErrorState title="Couldn't load products" body={error} onRetry={() => void load()} />
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
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by category"
              className="h-10 cursor-pointer border border-neutral-200 bg-background px-3 text-[13px] transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="h-10 cursor-pointer border border-neutral-200 bg-background px-3 text-[13px] transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="out">Out of stock</option>
            </select>
          </div>

          <DataTable
            columns={columns}
            rows={paginated}
            keyField={(p) => p.id}
            loading={loading}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={(key, dir) => {
              setSortKey(key);
              setSortDir(dir);
            }}
            page={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onRowClick={(p) => openEdit(p)}
            rowClassName={(p) => (focusId === p.id ? "bg-neutral-50" : undefined)}
            empty={
              <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
                <Package className="h-8 w-8 text-neutral-300" strokeWidth={1.25} aria-hidden />
                <p className="text-[13px] text-neutral-600">
                  {query || categoryFilter !== "all" || statusFilter !== "all"
                    ? "No products match your filters."
                    : "No products yet — add your first one."}
                </p>
                {!query && categoryFilter === "all" && statusFilter === "all" && (
                  <button
                    type="button"
                    onClick={openNew}
                    className="btn-press inline-flex h-10 items-center gap-2 bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
                  >
                    <Plus className="h-4 w-4" aria-hidden /> Add product
                  </button>
                )}
              </div>
            }
          />
        </>
      )}

      {/* Add / edit drawer */}
      <Modal
        open={draft !== null}
        onClose={() => !saving && setDraft(null)}
        title={draft?.id ? "Edit product" : "Add product"}
        size="xl"
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
              disabled={saving || uploading}
              className="btn-press inline-flex h-10 items-center gap-2 bg-foreground px-6 text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              {draft?.id ? "Save changes" : "Create product"}
            </button>
          </>
        }
      >
        {draft && (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" htmlFor="p-name" className="sm:col-span-2">
                <Input
                  id="p-name"
                  value={draft.name}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      name: e.target.value,
                      slug: draft.slugTouched ? draft.slug : slugify(e.target.value),
                    })
                  }
                  required
                />
              </Field>
              <Field label="Slug" htmlFor="p-slug" className="sm:col-span-2">
                <Input
                  id="p-slug"
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value), slugTouched: true })}
                  required
                />
              </Field>
              <Field label="Category" htmlFor="p-category">
                <select
                  id="p-category"
                  value={draft.category_id}
                  onChange={(e) => setDraft({ ...draft, category_id: e.target.value })}
                  className="h-11 w-full cursor-pointer border border-neutral-200 bg-background px-3.5 text-[13px] transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parent_id ? `${categoryName(c.parent_id)} / ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status" htmlFor="p-active">
                <select
                  id="p-active"
                  value={draft.is_active ? "active" : "inactive"}
                  onChange={(e) => setDraft({ ...draft, is_active: e.target.value === "active" })}
                  className="h-11 w-full cursor-pointer border border-neutral-200 bg-background px-3.5 text-[13px] transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
                >
                  <option value="active">Active (visible in store)</option>
                  <option value="inactive">Inactive (hidden)</option>
                </select>
              </Field>
              <Field label="Price (USD)" htmlFor="p-usd">
                <Input
                  id="p-usd"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={draft.priceUsd}
                  onChange={(e) => setDraft({ ...draft, priceUsd: e.target.value })}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Price (PKR)" htmlFor="p-pkr">
                <Input
                  id="p-pkr"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={draft.pricePkr}
                  onChange={(e) => setDraft({ ...draft, pricePkr: e.target.value })}
                  placeholder="0"
                />
              </Field>
              <Field label="Base stock" htmlFor="p-stock">
                <Input
                  id="p-stock"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={draft.stock}
                  onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
                />
              </Field>

              {/* Image */}
              <div className="sm:col-span-2">
                <p className="text-[12px] font-medium text-neutral-700">Product image</p>
                <div className="mt-1.5 flex items-center gap-4">
                  <span className="relative h-24 w-20 shrink-0 overflow-hidden border border-neutral-200 bg-neutral-100">
                    {draft.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={draft.image_url} alt="Product preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-neutral-300">
                        <ImagePlus className="h-5 w-5" strokeWidth={1.25} aria-hidden />
                      </span>
                    )}
                  </span>
                  <label className="btn-press inline-flex h-10 cursor-pointer items-center gap-2 border border-neutral-300 px-4 text-[13px] font-medium transition-colors hover:border-foreground hover:bg-foreground hover:text-background">
                    {uploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Uploading…
                      </>
                    ) : (
                      <>
                        <ImagePlus className="h-3.5 w-3.5" aria-hidden /> Upload image
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={uploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handleUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {draft.image_url && (
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, image_url: "" })}
                      className="text-[12px] font-medium text-neutral-500 underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </div>
            </div>

            <Field label="Description" htmlFor="p-description">
              <textarea
                id="p-description"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={4}
                className="w-full border border-neutral-200 bg-background px-3.5 py-2.5 text-[13px] leading-relaxed transition-colors placeholder:text-neutral-400 hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
                placeholder="Describe the product…"
              />
            </Field>

            {/* Variants */}
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-medium text-neutral-700">Variants (sizes, colors…)</p>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      variants: [...draft.variants, { name: "", sku: "", priceUsd: "", pricePkr: "", stock: "0", is_active: true }],
                    })
                  }
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-neutral-500 transition-colors hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden /> Add variant
                </button>
              </div>
              {draft.variants.length === 0 ? (
                <p className="mt-2 border border-dashed border-neutral-200 px-4 py-5 text-center text-[12px] text-neutral-400">
                  No variants — this product is sold as-is.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {draft.variants.map((variant, index) => (
                    <div key={index} className="grid grid-cols-2 gap-3 border border-neutral-200 p-3 md:grid-cols-6">
                      <div className="col-span-2 md:col-span-1">
                        <Input
                          placeholder="Name"
                          aria-label={`Variant ${index + 1} name`}
                          value={variant.name}
                          onChange={(e) => {
                            const next = [...draft.variants];
                            next[index] = { ...variant, name: e.target.value };
                            setDraft({ ...draft, variants: next });
                          }}
                        />
                      </div>
                      <Input
                        placeholder="SKU"
                        aria-label={`Variant ${index + 1} SKU`}
                        value={variant.sku}
                        onChange={(e) => {
                          const next = [...draft.variants];
                          next[index] = { ...variant, sku: e.target.value };
                          setDraft({ ...draft, variants: next });
                        }}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="USD"
                        aria-label={`Variant ${index + 1} USD price`}
                        value={variant.priceUsd}
                        onChange={(e) => {
                          const next = [...draft.variants];
                          next[index] = { ...variant, priceUsd: e.target.value };
                          setDraft({ ...draft, variants: next });
                        }}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="PKR"
                        aria-label={`Variant ${index + 1} PKR price`}
                        value={variant.pricePkr}
                        onChange={(e) => {
                          const next = [...draft.variants];
                          next[index] = { ...variant, pricePkr: e.target.value };
                          setDraft({ ...draft, variants: next });
                        }}
                      />
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Stock"
                        aria-label={`Variant ${index + 1} stock`}
                        value={variant.stock}
                        onChange={(e) => {
                          const next = [...draft.variants];
                          next[index] = { ...variant, stock: e.target.value };
                          setDraft({ ...draft, variants: next });
                        }}
                      />
                      <div className="col-span-2 flex items-center justify-between gap-2 md:col-span-1">
                        <label className="flex items-center gap-2 text-[12px] text-neutral-600">
                          <input
                            type="checkbox"
                            checked={variant.is_active}
                            onChange={(e) => {
                              const next = [...draft.variants];
                              next[index] = { ...variant, is_active: e.target.checked };
                              setDraft({ ...draft, variants: next });
                            }}
                            className="h-4 w-4 accent-neutral-900"
                          />
                          Active
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft({ ...draft, variants: draft.variants.filter((_, i) => i !== index) })
                          }
                          aria-label={`Remove variant ${index + 1}`}
                          className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => !deleteBusy && setDeleting(null)}
        onConfirm={() => void handleDelete()}
        title="Delete product"
        body={
          deleting
            ? `Delete "${deleting.name}"? Variants will be removed too. Products with order history can't be deleted — deactivate those instead.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        busy={deleteBusy}
      />
    </div>
  );
}
