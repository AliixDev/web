// frontend/app/seller/settings/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Bell, KeyRound, Loader2, LogOut, Save, Store, User } from "lucide-react";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { isSeller } from "@/lib/seller";
import { ErrorState, PageHeader, Skeleton } from "@/components/seller/ui";
import { toast } from "@/components/seller/Toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StoreDraft {
  store_name: string;
  store_tagline: string;
  contact_email: string;
  contact_phone: string;
  store_address: string;
}

interface PrefsDraft {
  notify_new_orders: boolean;
  notify_payments: boolean;
  notify_low_stock: boolean;
  notify_out_of_stock: boolean;
}

interface ProfileDraft {
  full_name: string;
  phone: string;
}

export default function SellerSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileDraft>({ full_name: "", phone: "" });
  const [store, setStore] = useState<StoreDraft>({
    store_name: "",
    store_tagline: "",
    contact_email: "",
    contact_phone: "",
    store_address: "",
  });
  const [prefs, setPrefs] = useState<PrefsDraft>({
    notify_new_orders: true,
    notify_payments: true,
    notify_low_stock: true,
    notify_out_of_stock: true,
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingStore, setSavingStore] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError("Supabase isn't configured for this workspace yet.");
      setLoading(false);
      return;
    }
    if (!(await isSeller())) {
      setError("This account isn't authorized to view seller settings.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setError("No active session. Sign in again.");
        setLoading(false);
        return;
      }
      setEmail(session.user.email ?? "");
      setLastSignIn(session.user.last_sign_in_at ?? null);

      const [profileRes, settingsRes] = await Promise.all([
        supabase.from("profiles").select("full_name, phone").eq("id", userId).maybeSingle(),
        supabase.from("seller_settings").select("*").eq("user_id", userId).maybeSingle(),
      ]);
      if (profileRes.data) {
        setProfile({
          full_name: profileRes.data.full_name ?? "",
          phone: profileRes.data.phone ?? "",
        });
      }
      if (settingsRes.data) {
        setStore({
          store_name: settingsRes.data.store_name ?? "",
          store_tagline: settingsRes.data.store_tagline ?? "",
          contact_email: settingsRes.data.contact_email ?? "",
          contact_phone: settingsRes.data.contact_phone ?? "",
          store_address: settingsRes.data.store_address ?? "",
        });
        setPrefs({
          notify_new_orders: settingsRes.data.notify_new_orders ?? true,
          notify_payments: settingsRes.data.notify_payments ?? true,
          notify_low_stock: settingsRes.data.notify_low_stock ?? true,
          notify_out_of_stock: settingsRes.data.notify_out_of_stock ?? true,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const supabase = getSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error("No active session.");
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: profile.full_name.trim() || null, phone: profile.phone.trim() || null })
        .eq("id", session.user.id);
      if (error) throw error;
      toast({ title: "Profile updated", variant: "success" });
    } catch (err) {
      toast({ title: "Couldn't save profile", description: err instanceof Error ? err.message : "Please try again.", variant: "error" });
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveStore(e: FormEvent) {
    e.preventDefault();
    setSavingStore(true);
    try {
      const supabase = getSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error("No active session.");
      const { error } = await supabase.from("seller_settings").upsert(
        {
          user_id: session.user.id,
          store_name: store.store_name.trim(),
          store_tagline: store.store_tagline.trim(),
          contact_email: store.contact_email.trim(),
          contact_phone: store.contact_phone.trim(),
          store_address: store.store_address.trim(),
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      toast({ title: "Store profile saved", variant: "success" });
    } catch (err) {
      toast({ title: "Couldn't save store profile", description: err instanceof Error ? err.message : "Please try again.", variant: "error" });
    } finally {
      setSavingStore(false);
    }
  }

  async function savePrefs() {
    setSavingPrefs(true);
    try {
      const supabase = getSupabase();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error("No active session.");
      const { error } = await supabase.from("seller_settings").upsert(
        {
          user_id: session.user.id,
          ...prefs,
          store_name: store.store_name,
          store_tagline: store.store_tagline,
          contact_email: store.contact_email,
          contact_phone: store.contact_phone,
          store_address: store.store_address,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      toast({ title: "Notification preferences saved", variant: "success" });
    } catch (err) {
      toast({ title: "Couldn't save preferences", description: err instanceof Error ? err.message : "Please try again.", variant: "error" });
    } finally {
      setSavingPrefs(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: "New password must be at least 6 characters", variant: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "error" });
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await getSupabase().auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast({ title: "Password changed", description: "Use your new password next time you sign in.", variant: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast({ title: "Couldn't change password", description: err instanceof Error ? err.message : "Please try again.", variant: "error" });
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleLogout() {
    await getSupabase().auth.signOut();
    router.push("/seller/login");
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Seller Central" title="Settings" description="Your store, account, and security." />
        <ErrorState title="Couldn't load settings" body={error} onRetry={() => void load()} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Seller Central" title="Settings" description="Store profile, account details, security, and notification preferences." />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Store profile */}
            <section className="border border-neutral-200 bg-background">
              <header className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4">
                <Store className="h-4 w-4 text-neutral-400" strokeWidth={1.5} aria-hidden />
                <h2 className="font-display text-lg font-medium tracking-tight">Store profile</h2>
              </header>
              <form onSubmit={saveStore} className="space-y-4 p-5">
                <div className="space-y-2">
                  <Label htmlFor="s-store-name">Store name</Label>
                  <Input
                    id="s-store-name"
                    value={store.store_name}
                    onChange={(e) => setStore({ ...store, store_name: e.target.value })}
                    placeholder="SitaraSouq"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-tagline">Tagline</Label>
                  <Input
                    id="s-tagline"
                    value={store.store_tagline}
                    onChange={(e) => setStore({ ...store, store_tagline: e.target.value })}
                    placeholder="Crafted goods, delivered worldwide"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="s-contact-email">Contact email</Label>
                    <Input
                      id="s-contact-email"
                      type="email"
                      value={store.contact_email}
                      onChange={(e) => setStore({ ...store, contact_email: e.target.value })}
                      placeholder="hello@sitarasouq.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s-contact-phone">Contact phone</Label>
                    <Input
                      id="s-contact-phone"
                      type="tel"
                      value={store.contact_phone}
                      onChange={(e) => setStore({ ...store, contact_phone: e.target.value })}
                      placeholder="+92 …"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-address">Address</Label>
                  <Input
                    id="s-address"
                    value={store.store_address}
                    onChange={(e) => setStore({ ...store, store_address: e.target.value })}
                    placeholder="Karachi, Pakistan"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingStore}
                  className="btn-press inline-flex h-10 items-center gap-2 bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
                >
                  {savingStore ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Save className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
                  Save store profile
                </button>
              </form>
            </section>

            {/* Account profile */}
            <section className="border border-neutral-200 bg-background">
              <header className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4">
                <User className="h-4 w-4 text-neutral-400" strokeWidth={1.5} aria-hidden />
                <h2 className="font-display text-lg font-medium tracking-tight">Your account</h2>
              </header>
              <form onSubmit={saveProfile} className="space-y-4 p-5">
                <div className="space-y-2">
                  <Label htmlFor="s-name">Full name</Label>
                  <Input
                    id="s-name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-email">Email (sign-in)</Label>
                  <Input id="s-email" value={email} disabled className="opacity-60" />
                  <p className="text-[11px] text-neutral-400">Your sign-in email is managed by Supabase Auth.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-phone">Phone</Label>
                  <Input
                    id="s-phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    autoComplete="tel"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-press inline-flex h-10 items-center gap-2 bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
                >
                  {savingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Save className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
                  Save account
                </button>
              </form>
            </section>
          </div>

          {/* Security */}
          <section className="border border-neutral-200 bg-background">
            <header className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4">
              <KeyRound className="h-4 w-4 text-neutral-400" strokeWidth={1.5} aria-hidden />
              <h2 className="font-display text-lg font-medium tracking-tight">Security</h2>
            </header>
            <div className="grid gap-8 p-5 lg:grid-cols-2">
              <form onSubmit={changePassword} className="space-y-4">
                <p className="text-[12px] text-neutral-600">Change your Supabase account password.</p>
                <div className="space-y-2">
                  <Label htmlFor="s-new-password">New password</Label>
                  <Input
                    id="s-new-password"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="s-confirm-password">Confirm new password</Label>
                  <Input
                    id="s-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat the new password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="btn-press inline-flex h-10 items-center gap-2 bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
                >
                  {savingPassword && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
                  Change password
                </button>
              </form>

              <div className="space-y-4 border-t border-neutral-200 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-400">Session</p>
                  <p className="mt-1.5 text-[13px] text-neutral-700">
                    Signed in as <span className="font-medium">{email}</span>
                  </p>
                  {lastSignIn && (
                    <p className="mt-0.5 text-[12px] text-neutral-500">
                      Last sign-in: {new Date(lastSignIn).toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="btn-press inline-flex h-10 items-center gap-2 border border-destructive/30 px-5 text-[13px] font-medium text-destructive transition-colors hover:bg-destructive hover:text-background"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Sign out
                </button>
                <p className="text-[11px] leading-relaxed text-neutral-400">
                  Signing out returns you to the Seller Central login. The customer store keeps its own session.
                </p>
              </div>
            </div>
          </section>

          {/* Notification preferences */}
          <section className="border border-neutral-200 bg-background">
            <header className="flex items-center gap-3 border-b border-neutral-200 px-5 py-4">
              <Bell className="h-4 w-4 text-neutral-400" strokeWidth={1.5} aria-hidden />
              <h2 className="font-display text-lg font-medium tracking-tight">Notifications</h2>
            </header>
            <div className="space-y-3 p-5">
              {(
                [
                  ["notify_new_orders", "New orders", "Alert me when a customer places an order."],
                  ["notify_payments", "Payments", "Alert me when a payment is confirmed."],
                  ["notify_low_stock", "Low stock", "Alert me when stock drops to 5 units or fewer."],
                  ["notify_out_of_stock", "Out of stock", "Alert me when a product sells out."],
                ] as const
              ).map(([key, label, hint]) => (
                <label key={key} className="flex cursor-pointer items-start justify-between gap-4 border border-neutral-100 px-4 py-3 transition-colors hover:border-neutral-300">
                  <span>
                    <span className="block text-[13px] font-medium">{label}</span>
                    <span className="mt-0.5 block text-[12px] text-neutral-500">{hint}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={prefs[key]}
                    onChange={(e) => setPrefs({ ...prefs, [key]: e.target.checked })}
                    className="mt-0.5 h-4 w-4 accent-neutral-900"
                  />
                </label>
              ))}
              <button
                type="button"
                onClick={() => void savePrefs()}
                disabled={savingPrefs}
                className="btn-press inline-flex h-10 items-center gap-2 bg-foreground px-5 text-[13px] font-medium text-background transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                {savingPrefs ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Save className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
                Save preferences
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
