// frontend/components/product/ReviewList.tsx
"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  content: string;
}

const INITIAL_COUNT = 5;

export default function ReviewList({ reviews }: { reviews: ProductReview[] }) {
  const [expanded, setExpanded] = useState(false);

  if (reviews.length === 0) {
    return (
      <div className="border border-dashed border-neutral-200 px-6 py-12 text-center">
        <p className="font-display text-lg font-medium tracking-tight">No reviews yet</p>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-neutral-600">
          This piece hasn&apos;t been reviewed yet. Reviews appear here as customers share their
          experience.
        </p>
      </div>
    );
  }

  const visible = expanded ? reviews : reviews.slice(0, INITIAL_COUNT);
  const hiddenCount = reviews.length - visible.length;

  return (
    <div>
      <ul className="divide-y divide-neutral-200 border-y border-neutral-200">
        {visible.map((review) => (
          <li key={review.id} className="py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-neutral-50 text-[12px] font-semibold text-neutral-700"
                  aria-hidden
                >
                  {review.author.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-[13px] font-medium">{review.author}</p>
                  <p className="text-[11px] text-neutral-400">
                    {new Date(review.date).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div
                className="flex items-center gap-0.5"
                role="img"
                aria-label={`Rated ${review.rating} out of 5`}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3.5 w-3.5",
                      i < Math.round(review.rating)
                        ? "fill-foreground text-foreground"
                        : "text-neutral-300",
                    )}
                    strokeWidth={1.25}
                    aria-hidden
                  />
                ))}
              </div>
            </div>
            <p className="mt-4 text-[13px] leading-[1.8] text-neutral-700">{review.content}</p>
          </li>
        ))}
      </ul>

      {hiddenCount > 0 && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="btn-press inline-flex h-11 items-center justify-center border border-neutral-300 px-8 text-[13px] font-medium transition-colors hover:border-foreground hover:bg-foreground hover:text-background"
          >
            See more — {hiddenCount} more {hiddenCount === 1 ? "review" : "reviews"}
          </button>
        </div>
      )}
    </div>
  );
}
