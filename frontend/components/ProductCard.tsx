// frontend/components/ProductCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useStore } from "@/lib/store";
import { formatMoney, priceForCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const currency = useStore((s) => s.currency);
  const addToCart = useStore((s) => s.addToCart);

  const unitPrice = priceForCurrency(currency, product.price_usd_cents, product.price_pkr_paisa);
  const hasVariants = (product.product_variants?.length ?? 0) > 0;

  function handleQuickAdd() {
    if (hasVariants) return; // must pick a variant on the product page
    addToCart({
      product_id: product.id,
      variant_id: null,
      slug: product.slug,
      name: product.name,
      variant_name: null,
      image_url: product.image_url,
      unit_price_usd_cents: product.price_usd_cents,
      unit_price_pkr_paisa: product.price_pkr_paisa,
      quantity: 1,
      max_stock: product.stock_quantity,
    });
  }

  return (
    <Card className="flex flex-col overflow-hidden">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square w-full bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              unoptimized
              className="object-cover transition-transform hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
              No image
            </div>
          )}
        </div>
      </Link>
      <CardContent className="flex-1 space-y-1 pt-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-1 font-semibold hover:text-primary">{product.name}</h3>
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        <p className="pt-1 text-base font-bold">{formatMoney(unitPrice, currency)}</p>
      </CardContent>
      <CardFooter>
        {hasVariants ? (
          <Button asChild className="w-full">
            <Link href={`/products/${product.slug}`}>Choose options</Link>
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={handleQuickAdd}
            disabled={product.stock_quantity <= 0}
          >
            {product.stock_quantity <= 0 ? "Out of stock" : "Add to cart"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
