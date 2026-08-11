// frontend/components/product/ProductImage.tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Product image with skeleton loading, fade-in on load,
 * and graceful fallback if the image is missing or fails.
 */
export default function ProductImage({
  src,
  alt,
  className,
  imgClassName,
  sizes = "(min-width: 1024px) 33vw, 50vw",
  priority = false,
}: ProductImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(!src);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-neutral-100", className)}>
      {/* Skeleton shimmer behind image */}
      {!loaded && !failed && (
        <div className="skeleton absolute inset-0" aria-hidden />
      )}

      {!failed ? (
        <Image
          src={src as string}
          alt={alt}
          fill
          unoptimized
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "object-cover transition-opacity duration-500 ease-out",
            loaded ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-neutral-100 text-neutral-300">
          <Package className="h-7 w-7" strokeWidth={1.25} aria-hidden />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-300">No image</span>
        </div>
      )}
    </div>
  );
}
