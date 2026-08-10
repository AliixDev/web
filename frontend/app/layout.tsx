// frontend/app/layout.tsx

import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import "./globals.css";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { Category } from "@/lib/types";

export const metadata: Metadata = {
  title: "SitaraSouq — Global Storefront from Pakistan",
  description:
    "Shop handcrafted apparel, home goods, and electronics from Pakistan, with local Cash on Delivery and international card checkout.",
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..600;1,9..144,300..600&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <a
          href="#main"
          className="sr-only z-[100] bg-foreground px-4 py-2 text-sm text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
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
