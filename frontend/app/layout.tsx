// frontend/app/layout.tsx

import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getCategories, getTopLevelCategories } from "@/lib/data";
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

const SITE_NAME = "SDB WEAR";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.sdbbuy.com"),
  title: {
    default: "SDB WEAR | Premium Motorcycle Protection & Leather Gear",
    template: "%s · SDB WEAR",
  },
  description:
    "Premium motorcycle protection, leather jackets, riding gear and stitched gloves from SDB WEAR. Built for the ride — cash on delivery across Pakistan, secure card checkout worldwide.",
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  keywords: [
    "motorcycle gear",
    "moto suit",
    "moto gloves",
    "moto shoes",
    "leather jacket",
    "biker jacket",
    "handcrafted gloves",
    "riding gear",
    "SDB WEAR",
  ],
  openGraph: {
    title: "SDB WEAR | Premium Motorcycle Protection & Leather Gear",
    description:
      "Premium motorcycle protection, performance gear and leather craftsmanship designed for riders who demand more.",
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "SDB WEAR",
  url: "https://www.sdbbuy.com",
  description:
    "Premium motorcycle protection & leather gear — moto suits, moto gloves, moto shoes, leather jackets and handcrafted stitched gloves.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const allCategories: Category[] = await getCategories();
  const topLevel: Category[] = allCategories.filter((c) => !c.parent_id);

  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="min-h-screen">
        {/* Skip to content — accessibility */}
        <a
          href="#main"
          className="sr-only z-[100] bg-foreground px-4 py-2 text-[13px] font-medium text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <AnnouncementBar />
        <Header categories={allCategories} />
        <main id="main" className="animate-page-in min-h-[60vh]">
          {children}
        </main>
        <Footer categories={topLevel} />
      </body>
    </html>
  );
}
