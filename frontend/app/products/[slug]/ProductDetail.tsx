// frontend/app/products/[slug]/ProductDetail.tsx
"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { formatMoney, priceForCurrency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import type { Product, ProductVariant } from "@/lib/types";

export default function ProductDetail({ product }: { product: Product }) {
  const currency = useStore((s) => s.currency);
  const addToCart = useStore((s) => s.addToCart);

  const variants = product.product_variants?.filter((v) => v.is_active) ?? [];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.length > 0 ? variants[0] : null,
  );
  const [added, setAdded] = useState(false);

  const baseUnit = priceForCurrency(currency, product.price_usd_cents, product.price_pkr_paisa);
  const variantOverride =
    selectedVariant &&
    priceForCurrency(
      currency,
      selectedVariant.price_usd_cents ?? product.price_usd_cents,
      selectedVariant.price_pkr_paisa ?? product.price_pkr_paisa,
    );
  const unitPrice = variantOverride ?? baseUnit;
  const stock = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity;

  function handleAddToCart() {
    addToCart({
      product_id: product.id,
      variant_id: selectedVariant?.id ?? null,
      slug: product.slug,
      name: product.name,
      variant_name: selectedVariant?.name ?? null,
      image_url: product.image_url,
      unit_price_usd_cents: selectedVariant?.price_usd_cents ?? product.price_usd_cents,
      unit_price_pkr_paisa: selectedVariant?.price_pkr_paisa ?? product.price_pkr_paisa,
      quantity: 1,
      max_stock: stock,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p className="text-xl font-semibold text-primary">{formatMoney(unitPrice, currency)}</p>
      <p className="text-muted-foreground">{product.description}</p>

      {variants.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Options</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedVariant(variant)}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  selectedVariant?.id === variant.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:bg-accent"
                }`}
              >
                {variant.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {stock > 0 ? `${stock} in stock` : "Out of stock"}
      </p>

      <Button size="lg" onClick={handleAddToCart} disabled={stock <= 0} className="w-full sm:w-auto">
        {added ? "Added!" : "Add to cart"}
      </Button>
    </div>
  );
}
