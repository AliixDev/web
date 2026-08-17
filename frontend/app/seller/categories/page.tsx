// frontend/app/seller/categories/page.tsx
"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { FolderTree, Loader2, Plus, Trash2 } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { isSeller, slugify, type SellerCategory } from "@/lib/seller";
import DataTable, { type Column } from "@/components/seller/DataTable";
import { ConfirmDialog, ErrorState, Field, Modal, PageHeader, StatusBadge } from "@/components/seller/ui";
import { toast } from "@/components/seller/Toast";
import { Input } from "@/components/ui/input";

interface CategoryDraft {
  id: string | null;
  name: string;
  slug: string;
  parent_id: string;
  is_active: boolean;
}

const EMPTY_DRAFT: CategoryDraft = {
  id: null,
  name: "",
  slug: "",
  parent_id: "",
  is_active: true,
};

export default function SellerCategoriesPage() {
  const [categories, setCategories] = useState<SellerCategory[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<CategoryDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<SellerCategory | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase isn't configured for this workspace yet.");
      setLoading(false);
      return;
    }
    if (!(await isSeller())) {
      setError("This account isn't authorized to manage categories.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const [categoriesRes, productsRes] = await Promise.all([
        supabase.from("categories").select("id, name, slug, parent_id, is_active").order("name"),
        supabase.from("products").select("category_id"),
      ]);
      setCategories((categoriesRes.data ?? []) as SellerCategory[]);
      const counts: Record<string, number> = {};
      for (const product of productsRes.data ?? []) {
        if (product.category_id) counts[product.category_id] = (counts[product.category_id] ?? 0) + 1;
      }
      setProductCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const parentName = useCallback(
    (id: string | null) => categories.find((c) => c.id === id)?.name ?? null,
    [categories],
  );

  const rootCategories = useMemo(() => categories.filter((c) => !c.parent_id), [categories]);
  const subcategories = useMemo(() => categories.filter((c) => c.parent_id), [categories]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term));
  }, [categories, query]);

  function openNew() {
    setDraft(EMPTY_DRAFT);
  }

  function openEdit(category: SellerCategory) {
    setDraft({
      id: category.id,
      name: category.name,
      slug: category.slug,
      parent_id: category.parent_id ?? "",
      is_active: category.is_active,
    });
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    if (!draft.name.trim()) {
      toast({ title: "Category name is required", variant: "error" });
      return;
    }
    if (draft.parent_id === draft.id) {
      toast({ title: "A category can't be its own parent", variant: "error" });
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabase();
      const payload = {
        name: draft.name.trim(),
        slug: draft.slug.trim() || slugify(draft.name),
        parent_id: draft.parent_id || null,
        is_active: draft.is_active,
      };
      if (draft.id) {
        const { error } = await supabase.from("categories").update(payload).eq("id", draft.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }
      toast({ title: draft.id ? "Category updated" : "Category created", variant: "success" });
      setDraft(null);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/duplicate|unique/i.test(message)) {
        toast({ title: "That slug is already in use", description: "Choose a different slug.", variant: "error" });
      } else {
        toast({ title: "Couldn't save category", description: message || "Please try again.", variant: "error" });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const { error } = await getSupabase().from("categories").delete().eq("id", deleting.id);
      if (error) throw error;
      toast({ title: "Category deleted", variant: "success" });
      setDeleting(null);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (/foreign key/i.test(message)) {
        toast({
          title: "Can't delete this category",
          description: "Products still reference it. Move them to another category first, then delete.",
          variant: "error",
        });
      } else {
        toast({ title: "Couldn't delete category", description: message || "Please try again.", variant: "error" });
      }
    } finally {
      setDeleteBusy(false);
    }
  }

  async function toggleActive(category: SellerCategory) {
    try {
      const { error } = await getSupabase()
        .from("categories")
        .update({ is_active: !category.is_active })
        .eq("id", category.id);
      if (error) throw error;
      toast({ title: category.is_active ? "Category hidden from store" : "Category visible in store", variant: "success" });
      await load();
    } catch (err) {
      toast({ title: "Couldn't update category", description: err instanceof Error ? err.message : "Please try again.", variant: "error" });
    }
  }

  const columns: Column<SellerCategory>[] = [
    {
      key: "name",
      header: "Category",
      sortable: true,
      render: (c) => (
        <div className="min-w-0">
          <p className="text-[13px] font-medium">
            {parentName(c.parent_id) && (
              <span className="mr-1.5 text-[11px] font-normal text-neutral-400">↳</span>
            )}
            {c.name}
          </p>
          <p className="text-[11px] text-neutral-400">/{c.slug}</p>
        </div>
      ),
    },
    {
      key: "parent",
      header: "Parent",
      render: (c) => <span className="text-[12px] text-neutral-600">{parentName(c.parent_id) ?? "—"}</span>,
      mobileHidden: true,
    },
    {
      key: "products",
      header: "Products",
      sortable: true,
      render: (c) => <span className="tabular-nums text-[13px]">{productCounts[c.id] ?? 0}</span>,
      mobileHidden: true,
    },
    {
      key: "status",
      header: "Status",
      render: (c) => (
        <StatusBadge label={c.is_active ? "Visible" : "Hidden"} tone={c.is_active ? "success" : "muted"} />
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (c) => (
        <span className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => void toggleActive(c)}
            className="h-8 border border-neutral-200 px-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:border-neutral-400"
          >
            {c.is_active ? "Hide" : "Show"}
          </button>
          <button
            type="button"
            onClick={() => setDeleting(c)}
            className="flex h-8 w-8 items-center justify-center border border-neutral-200 text-neutral-400 transition-colors hover:border-destructive/40 hover:text-destructive"
            aria-label={`Delete ${c.name}`}
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
        title="Categories"
        description="Organize your catalog into collections and subcategories."
        actions={
          <button
            type="button"
            onClick={openNew}
            className="btn-press inline-flex h-10 items-center gap-2 bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
          >
            <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Add category
          </button>
        }
      />

      {error ? (
        <ErrorState title="Couldn't load categories" body={error} onRetry={() => void load()} />
      ) : (
        <>
          {/* Structure summary */}
          {!loading && categories.length > 0 && (
            <div className="flex flex-wrap gap-3 text-[12px] text-neutral-600">
              <span className="border border-neutral-200 px-3 py-1.5">
                {rootCategories.length} top-level · {subcategories.length} subcategories
              </span>
              <span className="border border-neutral-200 px-3 py-1.5">
                {categories.filter((c) => !c.is_active).length} hidden
              </span>
            </div>
          )}

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories…"
            aria-label="Search categories"
            className="h-10 w-full max-w-sm border border-neutral-200 bg-background px-3.5 text-[13px] transition-colors placeholder:text-neutral-400 hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
          />

          <DataTable
            columns={columns}
            rows={filtered}
            keyField={(c) => c.id}
            loading={loading}
            sortKey="name"
            onRowClick={(c) => openEdit(c)}
            empty={
              <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
                <FolderTree className="h-8 w-8 text-neutral-300" strokeWidth={1.25} aria-hidden />
                <p className="text-[13px] text-neutral-600">
                  {query ? "No categories match your search." : "No categories yet — add your first one."}
                </p>
                {!query && (
                  <button
                    type="button"
                    onClick={openNew}
                    className="btn-press inline-flex h-10 items-center gap-2 bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
                  >
                    <Plus className="h-4 w-4" aria-hidden /> Add category
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
        title={draft?.id ? "Edit category" : "Add category"}
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
              {draft?.id ? "Save changes" : "Create category"}
            </button>
          </>
        }
      >
        {draft && (
          <form onSubmit={handleSave} className="space-y-5">
            <Field label="Name" htmlFor="c-name">
              <Input
                id="c-name"
                value={draft.name}
                onChange={(e) =>
                  setDraft({ ...draft, name: e.target.value, slug: slugify(e.target.value) })
                }
                required
                placeholder="e.g. Moto Gloves"
              />
            </Field>
            <Field label="Slug" htmlFor="c-slug">
              <Input
                id="c-slug"
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })}
                required
                placeholder="moto-gloves"
              />
            </Field>
            <Field label="Parent category (subcategory)" htmlFor="c-parent">
              <select
                id="c-parent"
                value={draft.parent_id}
                onChange={(e) => setDraft({ ...draft, parent_id: e.target.value })}
                className="h-11 w-full cursor-pointer border border-neutral-200 bg-background px-3.5 text-[13px] transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
              >
                <option value="">None — top-level category</option>
                {rootCategories
                  .filter((c) => c.id !== draft.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </Field>
            <label className="flex items-center gap-2.5 text-[13px] text-neutral-700">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                className="h-4 w-4 accent-neutral-900"
              />
              Visible in the store
            </label>
          </form>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => !deleteBusy && setDeleting(null)}
        onConfirm={() => void handleDelete()}
        title="Delete category"
        body={
          deleting
            ? `Delete "${deleting.name}"? ${
                productCounts[deleting.id]
                  ? `It contains ${productCounts[deleting.id]} product${productCounts[deleting.id] === 1 ? "" : "s"} which would become uncategorized.`
                  : "Its products would become uncategorized."
              }`
            : ""
        }
        confirmLabel="Delete"
        destructive
        busy={deleteBusy}
      />
    </div>
  );
}
