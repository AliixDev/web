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
}

export default function DataTable<T>({
  columns,
  rows,
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
}: DataTableProps<T>) {
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
                  <td colSpan={columns.length} className="px-4 py-2">
                    <Skeleton className="h-10 w-full" />
                  </td>
                </tr>
              ))
            ) : (
              rows.map((row) => (
                <tr
                  key={keyField(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "bg-background transition-colors",
                    onRowClick && "cursor-pointer hover:bg-neutral-50",
                    rowClassName?.(row),
                  )}
                >
                  {columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-3.5 align-middle text-[13px] text-neutral-800", column.className)}>
                      {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
          : rows.map((row) => (
              <div
                key={keyField(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "space-y-3 border border-neutral-200 bg-background p-4",
                  onRowClick && "cursor-pointer active:bg-neutral-50",
                  rowClassName?.(row),
                )}
              >
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
            ))}
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
