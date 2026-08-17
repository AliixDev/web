// frontend/app/shop/page.tsx

import type { Metadata } from "next";
import { getCategories, getProducts } from "@/lib/data";
import ShopClient from "@/components/shop/ShopClient";

export const metadata: Metadata = {
  title: "Shop the Collection | SDB WEAR",
  description:
    "Shop premium motorcycle protection and leather gear — moto suits, moto gloves, moto shoes, leather jackets, and handcrafted stitched gloves from SDB WEAR.",
  alternates: { canonical: "https://www.sdbbuy.com/shop" },
  openGraph: {
    title: "Shop the Collection | SDB WEAR",
    description:
      "Premium motorcycle protection, leather jackets, riding gear and stitched gloves from SDB WEAR.",
    type: "website",
  },
};

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return <ShopClient products={products} categories={categories} />;
}
