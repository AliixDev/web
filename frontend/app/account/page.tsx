// frontend/app/account/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Loader2, Package, User } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { formatMoney, priceForCurrency } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthModal from "@/components/auth/AuthModal";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  default_currency: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price_minor: number;
}

interface Order {
  id: string;
  status: string;
  currency: string;
  total_minor: number;
  payment_method: string;
  created_at: string;
  order_items: OrderItem[];
}

const STATUS_LABEL: Record<string, string> = {
  pending_payment: "Payment pending",
  cod_pending: "Order placed",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_STYLE: Record<string, string> = {
  pending_payment: "border-neutral-200 text-neutral-600",
  cod_pending: "border-neutral-300 text-neutral-700",
  paid: "border-neutral-400 text-neutral-800",
  processing: "border-neutral-300 text-neutral-700",
  shipped: "border-neutral-400 text-neutral-800",
  delivered: "border-neutral-400 text-neutral-800",
  cancelled: "border-destructive/30 text-destructive",
  refunded: "border-destructive/30 text-destructive",
};

export default function AccountPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError("Sign-in isn't configured for this workspace yet.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const supabase = getSupabase();

    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (cancelled) return;
      if (!session?.user?.email) {
        setEmail(null);
        setLoading(false);
        return;
      }
      setEmail(session.user.email);

      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, full_name, phone, default_currency")
          .eq("id", session.user.id)
          .maybeSingle();

        const { data: ordersData } = await supabase
          .from("orders")
          .select("id, status, currency, total_minor, payment_method, created_at, order_items(*)")
          .order("created_at", { ascending: false });

        if (cancelled) return;
        if (profileData) {
          setProfile(profileData as Profile);
          setFullName(profileData.full_name ?? "");
          setPhone(profileData.phone ?? "");
          setDefaultCurrency(profileData.default_currency ?? "USD");
        }
        setOrders((ordersData ?? []) as Order[]);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load your account.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session?.user?.email) {
        setEmail(session.user.email);
        setLoading(true);
        setError(null);
        void load();
      } else {
        setEmail(null);
      }
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const supabase = getSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("You must be signed in.");

      const payload = {
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        default_currency: defaultCurrency,
      };
      const { error: upsertError } = await supabase.from("profiles").upsert({ id: session.user.id, ...payload });
      if (upsertError) throw upsertError;
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  }

  // Unconfigured state
  if (!isSupabaseConfigured()) {
    return (
      <div className="container flex flex-col items-center gap-5 py-28 text-center">
        <p className="text-neutral-600">{error}</p>
        <p className="max-w-sm text-[13px] leading-relaxed text-neutral-400">
          Add the Supabase environment variables in API Keys to enable accounts.
        </p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="container py-14">
        <div className="skeleton h-8 w-56" />
        <div className="mt-10 grid gap-10 lg:grid-cols-3">
          <div className="skeleton h-96 lg:col-span-1" />
          <div className="skeleton h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  // Not signed in
  if (!email) {
    return (
      <div className="container flex flex-col items-center gap-6 py-28 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50">
          <User className="h-6 w-6 text-neutral-300" strokeWidth={1.25} aria-hidden />
        </div>
        <div>
          <h1 className="font-display text-3xl font-light tracking-tight">Your account</h1>
          <p className="mx-auto mt-3 max-w-sm text-[14px] leading-[1.7] text-neutral-600">
            Sign in to view your profile, order history, and delivery preferences.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className="btn-press inline-flex h-12 items-center gap-2 bg-foreground px-7 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
        >
          Sign in <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} context="account" />
      </div>
    );
  }

  return (
    <div className="container py-10 md:py-14">
      <p className="eyebrow">Account</p>
      <h1 className="mt-2 text-4xl font-light tracking-tight md:text-5xl">
        Hello, {fullName || email.split("@")[0]}
      </h1>
      <p className="mt-2 text-[13px] text-neutral-600">{email}</p>

      {error && (
        <p
          className="mt-6 max-w-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-[13px] text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-3">
        {/* Profile */}
        <section aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="font-display text-xl font-medium tracking-tight">
            Profile
          </h2>
          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full name</Label>
              <Input id="full-name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Default currency</Label>
              <select
                id="currency"
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="h-11 w-full cursor-pointer border border-neutral-200 bg-background px-3.5 text-[13px] transition-colors hover:border-neutral-300 focus:border-foreground focus:outline-none focus:ring-0"
              >
                <option value="USD">USD — US Dollar</option>
                <option value="PKR">PKR — Pakistani Rupee</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn-press flex h-11 w-full items-center justify-center gap-2 bg-foreground text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Saving…
                </>
              ) : saved ? (
                "Saved"
              ) : (
                "Save changes"
              )}
            </button>
          </form>
        </section>

        {/* Orders */}
        <section className="lg:col-span-2" aria-labelledby="orders-heading">
          <h2 id="orders-heading" className="font-display text-xl font-medium tracking-tight">
            Order history
          </h2>

          {orders.length === 0 ? (
            <div className="mt-5 flex flex-col items-center gap-4 border border-dashed border-neutral-200 py-16 text-center">
              <Package className="h-8 w-8 text-neutral-300" strokeWidth={1.25} aria-hidden />
              <p className="text-[13px] text-neutral-600">You haven&apos;t placed any orders yet.</p>
              <Link
                href="/shop"
                className="btn-press inline-flex h-11 items-center justify-center bg-foreground px-6 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
              >
                Start shopping
              </Link>
            </div>
          ) : (
            <ul className="mt-5 divide-y divide-neutral-100 border-y border-neutral-100">
              {orders.map((order) => {
                const orderCurrency = order.currency === "PKR" ? "PKR" : "USD";
                const total = priceForCurrency(orderCurrency, order.total_minor, order.total_minor);
                return (
                  <li key={order.id} className="py-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-medium">
                          Order <span className="font-mono">{order.id.slice(0, 8)}</span>
                        </p>
                        <p className="mt-0.5 text-[12px] text-neutral-400">
                          {new Date(order.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]",
                            STATUS_STYLE[order.status] ?? "border-neutral-200 text-neutral-500",
                          )}
                        >
                          {STATUS_LABEL[order.status] ?? order.status.replace("_", " ")}
                        </span>
                        <span className="text-[13px] font-medium tabular-nums">
                          {formatMoney(total, orderCurrency)}
                        </span>
                      </div>
                    </div>
                    <ul className="mt-4 space-y-1.5 border-t border-neutral-100 pt-3 text-[12px] text-neutral-600">
                      {order.order_items.map((item) => (
                        <li key={item.id} className="flex justify-between gap-4">
                          <span className="truncate">
                            {item.quantity}× {item.product_name}
                            {item.variant_name ? ` — ${item.variant_name}` : ""}
                          </span>
                          <span className="shrink-0 tabular-nums text-neutral-500">
                            {formatMoney(
                              priceForCurrency(orderCurrency, item.unit_price_minor, item.unit_price_minor) *
                                item.quantity,
                              orderCurrency,
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} context="account" />
    </div>
  );
}
