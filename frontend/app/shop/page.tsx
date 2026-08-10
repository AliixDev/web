// frontend/app/shop/page.tsx

import { getCategories, getProducts } from "@/lib/data";
import ShopClient from "@/components/shop/ShopClient";

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return <ShopClient products={products} categories={categories} />;
}
