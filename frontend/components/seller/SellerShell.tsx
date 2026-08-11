// frontend/components/seller/SellerShell.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Boxes,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Percent,
  Settings,
  ShoppingCart,
  Tags,
  Users,
  X,
} from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { useDialog } from "@/lib/useDialog";
import type { SellerNotification } from "@/lib/seller";
import { toast } from "./Toast";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/seller", icon: LayoutDashboard, match: (p: string) => p === "/seller" },
  { label: "Orders", href: "/seller/orders", icon: ShoppingCart },
  { label: "Products", href: "/seller/products", icon: Package },
  { label: "Inventory", href: "/seller/inventory", icon: Boxes },
  { label: "Categories", href: "/seller/categories", icon: Tags },
  { label: "Customers", href: "/seller/customers", icon: Users },
  { label: "Promotions", href: "/seller/promotions", icon: Percent },
  { label: "Analytics", href: "/seller/analytics", icon: BarChart3 },
  { label: "Reports", href: "/seller/reports", icon: FileText },
  { label: "Notifications", href: "/seller/notifications", icon: Bell },
  { label: "Settings", href: "/seller/settings", icon: Settings },
];

const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  NAV_ITEMS.map((item) => [item.href, item.label]),
);

const COLLAPSE_KEY = "seller-sidebar-collapsed-v1";

function isNavActive(href: string, pathname: string): boolean {
  if (href === "/seller") return pathname === "/seller";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function SellerShell({
  userEmail,
  onSignOut,
  children,
}: {
  userEmail: string | null;
  onSignOut: () => void;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<SellerNotification[]>([]);

  const mobileRef = useDialog(mobileOpen, () => setMobileOpen(false));

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  async function fetchNotifications() {
    if (!isSupabaseConfigured()) return;
    try {
      const supabase = getSupabase();
      const { count } = await supabase
        .from("seller_notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      setUnreadCount(count ?? 0);

      const { data } = await supabase
        .from("seller_notifications")
        .select("id, type, title, body, order_id, product_id, is_read, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecent((data ?? []) as SellerNotification[]);
    } catch {
      // RLS or network — bell simply shows nothing
    }
  }

  // Initial load + realtime updates for new notifications
  useEffect(() => {
    void fetchNotifications();
    let channel: ReturnType<ReturnType<typeof getSupabase>["channel"]> | null = null;
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabase();
        channel = supabase
          .channel("seller-notifications")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "seller_notifications" },
            (payload) => {
              const row = payload.new as SellerNotification;
              void fetchNotifications();
              if (row.type === "new_order" || row.type === "payment") {
                toast({ title: row.title, description: row.body });
              }
            },
          )
          .subscribe();
      } catch {
        // realtime unavailable
      }
    }
    return () => {
      channel?.unsubscribe();
    };
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  async function markRead(id: string) {
    try {
      await getSupabase().from("seller_notifications").update({ is_read: true }).eq("id", id);
      setUnreadCount((n) => Math.max(0, n - 1));
      setRecent((items) => items.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
    } catch {
      // ignore
    }
  }

  const activeLabel = PAGE_TITLES[pathname] ?? "Seller Central";
  const initial = userEmail?.charAt(0).toUpperCase() ?? "S";

  const sidebarContent = (isMobile: boolean) => (
    <nav aria-label="Seller navigation" className={cn("flex-1 overflow-y-auto px-3 py-4 custom-scrollbar", isMobile && "px-5")}>
      <ul className="space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isNavActive(item.href, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded py-2.5 text-[13px] font-medium transition-colors duration-200",
                  isMobile ? "px-3" : collapsed ? "justify-center px-2" : "px-3",
                  active
                    ? "bg-foreground text-background"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-foreground",
                )}
                title={collapsed && !isMobile ? item.label : undefined}
              >
                <item.icon className="h-[17px] w-[17px] shrink-0" strokeWidth={1.75} aria-hidden />
                {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-neutral-200 bg-background transition-all duration-300 ease-premium lg:flex",
          collapsed ? "w-[68px]" : "w-64",
        )}
      >
        <div className={cn("flex items-center border-b border-neutral-200 py-5", collapsed ? "justify-center px-2" : "justify-between px-5")}>
          {!collapsed && (
            <Link href="/seller" className="font-display text-[18px] font-medium tracking-tight">
              Sitara<span className="font-light text-neutral-400">Souq</span>
              <span className="ml-2 align-middle border border-neutral-300 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                Seller
              </span>
            </Link>
          )}
          {collapsed && (
            <Link href="/seller" className="font-display text-[18px] font-medium tracking-tight" aria-label="Seller Central home">
              S<span className="text-neutral-400">S</span>
            </Link>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-foreground",
              collapsed && "hidden",
            )}
          >
            <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} aria-hidden />
          </button>
          {collapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label="Expand sidebar"
              className="absolute -right-3 top-16 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-background text-neutral-400 shadow-panel-sm hover:text-foreground"
            >
              <PanelLeftOpen className="h-3 w-3" strokeWidth={1.5} aria-hidden />
            </button>
          )}
        </div>
        {sidebarContent(false)}
        <div className={cn("border-t border-neutral-200 p-3", collapsed && "px-2")}>
          <button
            type="button"
            onClick={onSignOut}
            className={cn(
              "flex w-full items-center gap-3 rounded py-2.5 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-foreground",
              collapsed ? "justify-center px-2" : "px-3",
            )}
          >
            <LogOut className="h-[17px] w-[17px] shrink-0" strokeWidth={1.75} aria-hidden />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-background/95 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-10 w-10 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 lg:hidden"
                aria-label="Open navigation"
                aria-expanded={mobileOpen}
              >
                <Menu className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
              </button>
              <h1 className="truncate font-display text-lg font-medium tracking-tight">{activeLabel}</h1>
            </div>

            <div className="flex items-center gap-1">
              {/* Notifications bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setBellOpen((v) => !v);
                    setUserOpen(false);
                    void fetchNotifications();
                  }}
                  aria-label={`Notifications, ${unreadCount} unread`}
                  aria-expanded={bellOpen}
                  className="relative flex h-10 w-10 items-center justify-center text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-foreground"
                >
                  <Bell className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[9px] font-bold leading-none text-background">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <div className="animate-scale-in absolute right-0 top-[calc(100%+8px)] z-50 w-80 border border-border bg-background shadow-panel">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3">
                      <p className="text-[13px] font-medium">Notifications</p>
                      <Link
                        href="/seller/notifications"
                        onClick={() => setBellOpen(false)}
                        className="text-[12px] font-medium text-neutral-500 transition-colors hover:text-foreground"
                      >
                        View all
                      </Link>
                    </div>
                    {recent.length === 0 ? (
                      <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                        <Inbox className="h-6 w-6 text-neutral-300" strokeWidth={1.25} aria-hidden />
                        <p className="text-[12px] text-neutral-500">No notifications yet.</p>
                      </div>
                    ) : (
                      <ul className="max-h-80 overflow-y-auto py-1 custom-scrollbar">
                        {recent.map((notification) => (
                          <li key={notification.id}>
                            <button
                              type="button"
                              onClick={() => {
                                void markRead(notification.id);
                                setBellOpen(false);
                                if (notification.order_id) router.push(`/seller/orders?focus=${notification.order_id}`);
                              }}
                              className={cn(
                                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50",
                                !notification.is_read && "bg-neutral-50",
                              )}
                            >
                              <span
                                className={cn(
                                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                                  notification.is_read ? "bg-transparent" : "bg-foreground",
                                )}
                                aria-hidden
                              />
                              <span className="min-w-0">
                                <span className="block text-[13px] font-medium">{notification.title}</span>
                                <span className="mt-0.5 line-clamp-2 block text-[12px] leading-relaxed text-neutral-500">
                                  {notification.body}
                                </span>
                                <span className="mt-1 block text-[10px] uppercase tracking-[0.15em] text-neutral-400">
                                  {new Date(notification.created_at).toLocaleString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setUserOpen((v) => !v);
                    setBellOpen(false);
                  }}
                  aria-label="Account menu"
                  aria-expanded={userOpen}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-[12px] font-semibold text-neutral-700 transition-colors hover:border-foreground"
                >
                  {initial}
                </button>
                {userOpen && (
                  <div className="animate-scale-in absolute right-0 top-[calc(100%+8px)] z-50 w-60 border border-border bg-background py-1.5 shadow-panel">
                    <p className="mb-1 truncate border-b border-border px-4 py-2.5 text-[12px] text-neutral-400">
                      {userEmail ?? "Seller"}
                    </p>
                    <Link
                      href="/seller/settings"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-neutral-50"
                    >
                      <Settings className="h-4 w-4 text-neutral-400" strokeWidth={1.5} aria-hidden /> Settings
                    </Link>
                    <button
                      type="button"
                      onClick={onSignOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-neutral-50"
                    >
                      <LogOut className="h-4 w-4 text-neutral-400" strokeWidth={1.5} aria-hidden /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div ref={mobileRef} className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="Seller navigation">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="animate-fade-in absolute inset-0 cursor-default bg-black/30 backdrop-blur-[2px]"
          />
          <div className="animate-slide-in-right absolute inset-y-0 left-0 flex w-[86%] max-w-[320px] flex-col bg-background shadow-panel">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <span className="font-display text-lg font-medium tracking-tight">
                Sitara<span className="font-light text-neutral-400">Souq</span>
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="flex h-9 w-9 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-foreground"
              >
                <X className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden />
              </button>
            </div>
            {sidebarContent(true)}
          </div>
        </div>
      )}
    </div>
  );
}
