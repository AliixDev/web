// frontend/components/product/ProductGallery.tsx
"use client";

import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductImage from "./ProductImage";
import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: string[];
  alt: string;
  productName: string;
}

/**
 * Product image gallery with thumbnail navigation, prev/next controls,
 * and arrow-key support. Built on the existing ProductImage component so
 * loading skeletons and fallbacks behave exactly like everywhere else.
 */
export default function ProductGallery({ images, alt, productName }: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const count = images.length;
  const index = Math.min(active, Math.max(0, count - 1));
  const current = images[index];

  const step = useCallback(
    (delta: number) => {
      setActive((prev) => (prev + delta + count) % count);
    },
    [count],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    }
  }

  return (
    <div>
      {/* Main image */}
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={`${productName} gallery`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="relative aspect-square overflow-hidden bg-neutral-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-300"
      >
        <ProductImage
          key={current}
          src={current}
          alt={`${alt} — image ${index + 1} of ${count}`}
          sizes="(min-width: 1024px) 50vw, 100vw"
          imgClassName="transition-transform duration-700 ease-out hover:scale-[1.03]"
        />

        {/* Prev / next */}
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-border bg-background/90 text-neutral-600 backdrop-blur-sm transition-all duration-200 hover:bg-foreground hover:text-background"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-border bg-background/90 text-neutral-600 backdrop-blur-sm transition-all duration-200 hover:bg-foreground hover:text-background"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </button>
          </>
        )}
      </div>

      {/* Counter */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
          Product photography
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
          {index + 1} / {count}
        </p>
      </div>

      {/* Thumbnails */}
      {count > 1 && (
        <div className="mt-3 flex gap-2.5" role="tablist" aria-label="Product images">
          {images.map((image, i) => (
            <button
              key={image}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`View image ${i + 1} of ${count}`}
              onClick={() => setActive(i)}
              className={cn(
                "relative block h-20 w-16 shrink-0 overflow-hidden bg-neutral-100 transition-all duration-200",
                i === index
                  ? "border border-foreground opacity-100"
                  : "border border-transparent opacity-50 hover:opacity-80",
              )}
            >
              <ProductImage src={image} alt="" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
