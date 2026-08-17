// frontend/components/layout/AnnouncementBar.tsx

const ITEMS = [
  "Premium motorcycle protection & leather gear",
  "Stitched. Built. Made to last.",
  "Established 2017",
  "Secure international checkout",
];

export default function AnnouncementBar() {
  // Exactly two copies so the -50% marquee translate loops seamlessly.
  const repeatedItems = [...ITEMS, ...ITEMS];

  return (
    <div className="bg-foreground text-background">
      {/* Visually-hidden static list for screen readers */}
      <p className="sr-only" aria-label="Store announcements">
        {ITEMS.join(". ")}.
      </p>

      <div className="relative flex h-8 overflow-hidden" aria-hidden>
        <p className="animate-marquee flex shrink-0 items-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.22em] text-background/80">
          {repeatedItems.map((item, i) => (
            <span key={i} className="flex items-center gap-10 pr-10">
              {item}
              <span className="text-background/30">·</span>
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
