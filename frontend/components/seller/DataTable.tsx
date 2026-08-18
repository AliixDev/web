// frontend/components/seller/DataTable.tsx
"use client";

import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState, Pagination, Skeleton } from "./ui";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  className?: string;
  /** Hidden from the automatic mobile card layout. */
  mobileHidden?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  /** All filtered/sorted rows (across pages) for select-all. Falls back to `rows`. */
  allRows?: T[];
  keyField: (row: T) => string;
  loading?: boolean;
  empty?: ReactNode;
  sortKey?: string | null;
  sortDir?: "asc" | "desc";
  onSortChange?: (key: string, dir: "asc" | "desc") => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  /** Set of selected row keys. Pass to enable row-selection checkboxes. */
  selectedKeys?: Set<string>;
  /** Callback when the selection set changes. */
  onSelectionChange?: (keys: Set<string>) => void;
}

export default function DataTable<T>({
  columns,
  rows,
  allRows,
  keyField,
  loading = false,
  empty,
  sortKey,
  sortDir = "asc",
  onSortChange,
  page,
  pageSize,
  total,
  onPageChange,
  onRowClick,
  rowClassName,
  selectedKeys,
  onSelectionChange,
}: DataTableProps<T>) {
  const selectionEnabled = selectedKeys !== undefined && onSelectionChange !== undefined;

  // ── Selection helpers ───────────────────────────────────────────────
  function toggleRow(key: string) {
    if (!selectionEnabled) return;
    const next = new Set(selectedKeys);
    if (next.has(key)) next.delete(key); else next.add(key);
    onSelectionChange(next);
  }

  function toggleAll() {
    if (!selectionEnabled) return;
    const sourceRows = allRows ?? rows;
    const allKeys = sourceRows.map(keyField);
    const allSelected = allKeys.length > 0 && allKeys.every((k) => selectedKeys.has(k));
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(allKeys));
    }
  }

  const visibleKeys = rows.map(keyField);
  const allVisibleSelected = selectionEnabled && visibleKeys.length > 0 && visibleKeys.every((k) => selectedKeys.has(k));
  const someSelected = selectionEnabled && visibleKeys.some((k) => selectedKeys.has(k));

  function renderCheckbox(checked: boolean, onChange: () => void, ariaLabel?: string) {
    return (
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
        className="h-4 w-4 cursor-pointer accent-neutral-900"
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  // ── Sorting ─────────────────────────────────────────────────────────
  function handleSort(key: string) {
    if (!onSortChange) return;
    if (sortKey === key) {
      onSortChange(key, sortDir === "asc" ? "desc" : "asc");
    } else {
      onSortChange(key, "asc");
    }
  }

  const paginated = typeof page === "number" && typeof pageSize === "number" && typeof total === "number";
  const showFooter = paginated && onPageChange;

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto border border-neutral-200 md:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              {selectionEnabled && (
                <th scope="col" className="w-10 px-4 py-3">
                  {renderCheckbox(
                    allVisibleSelected,
                    toggleAll,
                    someSelected && !allVisibleSelected ? "Deselect all on this page" : "Select all on this page",
                  )}
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn("px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500", column.className)}
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className="inline-flex items-center gap-1 uppercase tracking-[0.18em] transition-colors hover:text-foreground"
                    >
                      {column.header}
                      {sortKey === column.key ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="h-3 w-3" aria-hidden />
                        ) : (
                          <ArrowDown className="h-3 w-3" aria-hidden />
                        )
                      ) : (
                        <ChevronsUpDown className="h-3 w-3 text-neutral-300" aria-hidden />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={columns.length + (selectionEnabled ? 1 : 0)} className="px-4 py-2">
                    <Skeleton className="h-10 w-full" />
                  </td>
                </tr>
              ))
            ) : (
              rows.map((row) => {
                const rk = keyField(row);
                return (
                  <tr
                    key={rk}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "bg-background transition-colors",
                      onRowClick && "cursor-pointer hover:bg-neutral-50",
                      selectionEnabled && selectedKeys!.has(rk) && "bg-neutral-50",
                      rowClassName?.(row),
                    )}
                  >
                    {selectionEnabled && (
                      <td className="w-10 px-4 py-3.5">
                        {renderCheckbox(
                          selectedKeys!.has(rk),
                          () => toggleRow(rk),
                          `Select ${rk}`,
                        )}
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className={cn("px-4 py-3.5 align-middle text-[13px] text-neutral-800", column.className)}>
                        {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
          : rows.map((row) => {
              const rk = keyField(row);
              return (
                <div
                  key={rk}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "space-y-3 border border-neutral-200 bg-background p-4",
                    onRowClick && "cursor-pointer active:bg-neutral-50",
                    selectionEnabled && selectedKeys!.has(rk) && "bg-neutral-50",
                    rowClassName?.(row),
                  )}
                >
                  {selectionEnabled && (
                    <div className="flex items-center justify-end">
                      {renderCheckbox(
                        selectedKeys!.has(rk),
                        () => toggleRow(rk),
                        `Select ${rk}`,
                      )}
                    </div>
                  )}
                  {columns
                    .filter((column) => !column.mobileHidden)
                    .map((column) => (
                      <div key={column.key} className="flex items-start justify-between gap-3">
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">
                          {column.header}
                        </span>
                        <span className="min-w-0 text-right text-[13px] text-neutral-800">
                          {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "")}
                        </span>
                      </div>
                    ))}
                </div>
              );
            })}
      </div>

      {/* Empty */}
      {!loading && rows.length === 0 && (
        <div className="border border-neutral-200">
          {empty ?? <EmptyState title="Nothing here yet" body="No records match the current view." />}
        </div>
      )}

      {/* Footer */}
      {showFooter && total !== undefined && (
        <div className="mt-4">
          <Pagination page={page!} pageSize={pageSize!} total={total} onPageChange={onPageChange!} />
        </div>
      )}
    </div>
  );
}
