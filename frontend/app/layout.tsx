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
    default: "SitaraSouq — Global Storefront from Pakistan",
    template: "%s · SitaraSouq",
  },
  description:
    "Shop handcrafted apparel, home goods, and electronics from Pakistan, with local Cash on Delivery and international card checkout.",
  applicationName: "SitaraSouq",
  authors: [{ name: "SitaraSouq" }],
  openGraph: {
    title: "SitaraSouq — Global Storefront from Pakistan",
    description:
      "Handcrafted apparel, home textiles, and everyday electronics from Pakistan. Cash on delivery across Pakistan, secure card checkout worldwide.",
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
