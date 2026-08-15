// frontend/app/layout.tsx

import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { createClient } from "@supabase/supabase-js";
import "./globals.css";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Category } from "@/lib/types";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SDBBUY — Leather, Apparel & Lifestyle",
    template: "%s · SDBBUY",
  },
  description:
    "Leather garments, fashion apparel, boxing gear, and gym wear — from a brand with roots in 2017. Cash on Delivery across Pakistan, secure card checkout worldwide.",
  applicationName: "SDBBUY",
  authors: [{ name: "SDBBUY" }],
  openGraph: {
    title: "SDBBUY — Leather, Apparel & Lifestyle",
    description:
      "Leather jackets, fashion apparel, boxing gear, and fitness wear from SDBBUY — rooted in 2017. Cash on delivery across Pakistan, secure card checkout worldwide.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

async function getCategories(): Promise<Category[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return [];

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.from("categories").select("id, name, slug").order("name");
    if (error) return [];
    return (data ?? []) as Category[];
  } catch {
    return [];
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();

  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen">
        {/* Skip to content — accessibility */}
        <a
          href="#main"
          className="sr-only z-[100] bg-foreground px-4 py-2 text-[13px] font-medium text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <AnnouncementBar />
        <Header categories={categories} />
        <main id="main" className="animate-page-in min-h-[60vh]">
          {children}
        </main>
        <Footer categories={categories} />
      </body>
    </html>
  );
}
