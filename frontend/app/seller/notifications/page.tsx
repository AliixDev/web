// frontend/app/seller/notifications/page.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Bell, BellOff, CheckCheck, Package, ShieldAlert, ShoppingCart, Wallet } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { isSeller, type SellerNotification } from "@/lib/seller";
import { EmptyState, ErrorState, PageHeader, StatusBadge } from "@/components/seller/ui";
import { toast } from "@/components/seller/Toast";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<SellerNotification["type"], string> = {
  new_order: "New order",
  payment: "Payment",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
  system: "System",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function SellerNotificationsPage() {
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | SellerNotification["type"]>("all");

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase isn't configured for this workspace yet.");
      setLoading(false);
      return;
    }
    if (!(await isSeller())) {
      setError("This account isn't authorized to view notifications.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await getSupabase()
        .from("seller_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setNotifications((data ?? []) as SellerNotification[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => (typeFilter === "all" ? notifications : notifications.filter((n) => n.type === typeFilter)),
    [notifications, typeFilter],
  );
  const unread = notifications.filter((n) => !n.is_read).length;

  async function setRead(notification: SellerNotification, isRead: boolean) {
    const previous = notifications;
    setNotifications((list) => list.map((n) => (n.id === notification.id ? { ...n, is_read: isRead } : n)));
    const { error } = await getSupabase().from("seller_notifications").update({ is_read: isRead }).eq("id", notification.id);
    if (error) {
      setNotifications(previous);
      toast({ title: "Couldn't update notification", variant: "error" });
    }
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((list) => list.map((n) => ({ ...n, is_read: true })));
    const { error } = await getSupabase().from("seller_notifications").update({ is_read: true }).in("id", unreadIds);
    if (error) {
      await load();
      toast({ title: "Couldn't update notifications", variant: "error" });
      return;
    }
    toast({ title: "All notifications marked as read", variant: "success" });
  }

  const typeIcon = (type: SellerNotification["type"]) => {
    switch (type) {
      case "new_order":
        return <ShoppingCart className="h-4 w-4" strokeWidth={1.5} aria-hidden />;
      case "payment":
        return <Wallet className="h-4 w-4" strokeWidth={1.5} aria-hidden />;
      case "low_stock":
        return <Package className="h-4 w-4" strokeWidth={1.5} aria-hidden />;
      case "out_of_stock":
        return <BellOff className="h-4 w-4" strokeWidth={1.5} aria-hidden />;
      case "system":
        return <ShieldAlert className="h-4 w-4" strokeWidth={1.5} aria-hidden />;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activity"
        title="Notifications"
        description="Order, payment, and stock alerts from your store."
        actions={
          unread > 0 ? (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="btn-press inline-flex h-10 items-center gap-2 border border-neutral-300 px-5 text-[13px] font-medium transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
            >
              <CheckCheck className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Mark all read
            </button>
          ) : undefined
        }
      />

      {error ? (
        <ErrorState title="Couldn't load notifications" body={error} onRetry={() => void load()} />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "new_order", "payment", "low_stock", "out_of_stock", "system"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setTypeFilter(type)}
                aria-pressed={typeFilter === type}
                className={cn(
                  "h-9 border px-3.5 text-[12px] font-medium transition-colors",
                  typeFilter === type
                    ? "border-foreground bg-foreground text-background"
                    : "border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-foreground",
                )}
              >
                {type === "all" ? "All" : TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-20 w-full" aria-hidden />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Bell}
              title={unread === 0 && notifications.length === 0 ? "No notifications yet" : "Nothing in this filter"}
              body={
                unread === 0 && notifications.length === 0
                  ? "New orders, payments, and stock alerts will appear here automatically."
                  : "No notifications match the selected type."
              }
            />
          ) : (
            <ul className="divide-y divide-neutral-100 border border-neutral-200">
              {filtered.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    "flex items-start gap-4 px-4 py-4 transition-colors sm:px-5",
                    !notification.is_read ? "bg-neutral-50" : "bg-background",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border",
                      !notification.is_read ? "border-foreground bg-foreground text-background" : "border-neutral-200 text-neutral-500",
                    )}
                  >
                    {typeIcon(notification.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={cn("text-[13px]", !notification.is_read ? "font-semibold" : "font-medium")}>
                        {notification.title}
                      </p>
                      <StatusBadge label={TYPE_LABELS[notification.type]} tone={notification.type === "payment" ? "success" : "default"} />
                      {!notification.is_read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-label="Unread" />
                      )}
                    </div>
                    {notification.body && (
                      <p className="mt-1 text-[12px] leading-relaxed text-neutral-600">{notification.body}</p>
                    )}
                    <p className="mt-1.5 text-[11px] text-neutral-400">
                      {relativeTime(notification.created_at)}
                      {notification.order_id && (
                        <Link
                          href={`/seller/orders?focus=${notification.order_id}`}
                          className="ml-3 inline-flex items-center gap-1 font-medium text-neutral-600 underline-offset-4 transition-colors hover:text-foreground hover:underline"
                        >
                          View order <ArrowRight className="h-3 w-3" aria-hidden />
                        </Link>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void setRead(notification, !notification.is_read)}
                    className={cn(
                      "shrink-0 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors",
                      notification.is_read ? "text-neutral-400 hover:text-foreground" : "text-neutral-600 hover:text-foreground",
                    )}
                  >
                    {notification.is_read ? "Unread" : "Read"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
