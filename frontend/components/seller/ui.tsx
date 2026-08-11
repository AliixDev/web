// frontend/components/seller/ui.tsx
"use client";

import type { ReactNode } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, RotateCcw, X } from "lucide-react";
import { useDialog } from "@/lib/useDialog";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

// ---------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------
export function EmptyState({
  icon = Inbox,
  title,
  body,
  action,
}: {
  icon?: typeof Inbox;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  const Icon = icon;
  return (
    <div className="flex flex-col items-center gap-4 border border-dashed border-neutral-200 px-6 py-16 text-center">
      <Icon className="h-8 w-8 text-neutral-300" strokeWidth={1.25} aria-hidden />
      <div>
        <p className="font-display text-lg font-medium tracking-tight">{title}</p>
        {body && <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-neutral-600">{body}</p>}
      </div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------
// Error state
// ---------------------------------------------------------------------
export function ErrorState({
  title = "Something went wrong",
  body,
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 border border-destructive/20 bg-destructive/5 px-6 py-16 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" strokeWidth={1.25} aria-hidden />
      <div>
        <p className="font-display text-lg font-medium tracking-tight">{title}</p>
        {body && <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-neutral-600">{body}</p>}
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-press inline-flex h-10 items-center gap-2 border border-neutral-300 px-5 text-[13px] font-medium transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Try again
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------
const BADGE_TONES: Record<string, string> = {
  default: "border-neutral-300 text-neutral-700",
  muted: "border-neutral-200 text-neutral-500",
  dark: "border-foreground bg-foreground text-background",
  danger: "border-destructive/30 text-destructive",
  success: "border-neutral-400 bg-neutral-100 text-neutral-900",
};

export function StatusBadge({
  label,
  tone = "default",
  className,
}: {
  label: string;
  tone?: keyof typeof BADGE_TONES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]",
        BADGE_TONES[tone],
        className,
      )}
    >
      {label}
    </span>
  );
}

/** Maps an order status string to a badge tone. */
export function orderStatusTone(status: string): keyof typeof BADGE_TONES {
  switch (status) {
    case "cancelled":
    case "refunded":
      return "danger";
    case "delivered":
    case "paid":
      return "success";
    case "processing":
    case "shipped":
      return "dark";
    default:
      return "default";
  }
}

/** Maps a payment status string to a badge tone. */
export function paymentStatusTone(status: string): keyof typeof BADGE_TONES {
  switch (status) {
    case "paid":
      return "success";
    case "failed":
      return "danger";
    default:
      return "default";
  }
}

// ---------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------
export function StatCard({
  label,
  value,
  hint,
  icon,
  loading,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="border border-neutral-200 bg-background p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">{label}</p>
        {icon && <span className="text-neutral-300">{icon}</span>}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-24" />
      ) : (
        <p className="mt-3 font-display text-[26px] font-light leading-none tracking-tight tabular-nums">
          {value}
        </p>
      )}
      {hint && <p className="mt-2 text-[12px] text-neutral-500">{hint}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------
// Page header
// ---------------------------------------------------------------------
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1.5 font-display text-2xl font-light tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-neutral-600">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const dialogRef = useDialog(open, onClose);

  if (!open) return null;

  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 py-10 md:items-center md:py-10"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close dialog"
        onClick={onClose}
        className="animate-fade-in fixed inset-0 cursor-default bg-black/30 backdrop-blur-[2px]"
      />
      <div className={cn("animate-scale-in relative w-full bg-background shadow-panel", widths[size])}>
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-medium tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-foreground"
          >
            <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 custom-scrollbar">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Confirm dialog
// ---------------------------------------------------------------------
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = "Confirm",
  destructive = false,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
  destructive?: boolean;
  busy?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-[13px] leading-relaxed text-neutral-700">{body}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="btn-press inline-flex h-10 items-center border border-neutral-200 px-5 text-[13px] font-medium transition-colors hover:border-neutral-400 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={cn(
            "btn-press inline-flex h-10 items-center gap-2 px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50",
            destructive ? "bg-destructive" : "bg-foreground",
          )}
        >
          {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-4 border-t border-neutral-200 pt-4">
      <p className="text-[12px] text-neutral-500">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          className="flex h-9 w-9 items-center justify-center border border-neutral-200 text-neutral-600 transition-colors hover:border-neutral-400 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </button>
        <span className="px-3 text-[12px] tabular-nums text-neutral-600">
          {page} / {pages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          aria-label="Next page"
          className="flex h-9 w-9 items-center justify-center border border-neutral-200 text-neutral-600 transition-colors hover:border-neutral-400 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Field (label + control + error)
// ---------------------------------------------------------------------
export function Field({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[12px] font-medium text-neutral-700">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[12px] text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Loading block (page-level skeletons)
// ---------------------------------------------------------------------
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
