// frontend/components/seller/Toast.tsx
"use client";

import { create } from "zustand";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToastInput {
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
}

interface ToastItem extends ToastInput {
  id: number;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: ToastInput) => void;
  dismiss: (id: number) => void;
}

let nextToastId = 1;

const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = nextToastId++;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4200);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative helper: toast({ title, description, variant }) */
export function toast(input: ToastInput): void {
  useToastStore.getState().push(input);
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-full max-w-sm flex-col gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            "animate-slide-in-right pointer-events-auto flex items-start gap-3 border bg-background p-4 shadow-panel",
            t.variant === "error" ? "border-destructive/30" : "border-border",
          )}
        >
          {t.variant === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-neutral-700" aria-hidden />
          ) : t.variant === "error" ? (
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
          ) : (
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium leading-snug">{t.title}</p>
            {t.description && (
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-600">{t.description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className="flex h-6 w-6 shrink-0 items-center justify-center text-neutral-400 transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
