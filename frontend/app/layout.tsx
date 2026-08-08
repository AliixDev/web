// frontend/app/layout.tsx

import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "SitaraSouq — Global Storefront from Pakistan",
  description:
    "Shop handcrafted apparel, home goods, and electronics from Pakistan, with local Cash on Delivery and international card checkout.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Navbar />
        <main className="container py-8">{children}</main>
        <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SitaraSouq. Built with Next.js &amp; Supabase.
        </footer>
      </body>
    </html>
  );
}
