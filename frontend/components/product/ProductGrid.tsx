// frontend/components/product/ProductGrid.tsx

import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  products: Product[];
  className?: string;
}

export default function ProductGrid({ products, className }: ProductGridProps) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-5 lg:grid-cols-3 lg:gap-y-10 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((product, index) => (
        <li
          key={product.id}
          className="animate-fade-up"
          style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
        >
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
