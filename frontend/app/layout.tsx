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

const SITE_NAME = "RACEVOR";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.racevor.com"),
  title: {
    default: "RACEVOR | Premium Motorcycle Protection & Suits",
    template: "%s · RACEVOR",
  },
  description:
    "Premium motorcycle protection, racing suits, armor systems, and leather gear from RACEVOR. Engineered for impact. Built for the ride — secure checkout worldwide.",
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  keywords: [
    "motorcycle suits",
    "motorcycle protection",
    "CE Level 2 armor",
    "moto gear",
    "leather suit",
    "racing suit",
    "motorcycle armor",
    "riding gear",
    "RACEVOR",
    "bio-armor",
  ],
  openGraph: {
    title: "RACEVOR | Premium Motorcycle Protection & Suits",
    description:
      "Premium motorcycle protection, racing suits, and leather craftsmanship engineered for riders who demand more.",
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
  name: "RACEVOR",
  url: "https://www.racevor.com",
  description:
    "Premium motorcycle protection & racing suits — CE Level 2 armor, bio-armor system, full-grain leather construction.",
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
      <body className="min-h-screen bg-[#000000]">
        {/* Skip to content — accessibility */}
        <a
          href="#main"
          className="sr-only z-[100] bg-white px-4 py-2 text-[13px] font-medium text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <AnnouncementBar />
        <Header categories={allCategories} />
        <main id="main" className="min-h-[60vh]">
          {children}
        </main>
        <Footer categories={topLevel} />
      </body>
    </html>
  );
}
