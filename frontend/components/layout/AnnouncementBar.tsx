// frontend/components/layout/AnnouncementBar.tsx

const ITEMS = [
  "Premium motorcycle protection & racing suits",
  "CE Level 2 Bio-Armor System",
  "Established 2017",
  "Secure international checkout",
];

export default function AnnouncementBar() {
  const repeatedItems = [...ITEMS, ...ITEMS];

  return (
    <div className="bg-white text-black">
      <p className="sr-only" aria-label="Store announcements">
        {ITEMS.join(". ")}.
      </p>

      <div className="relative flex h-8 overflow-hidden" aria-hidden>
        <p className="animate-marquee flex shrink-0 items-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.22em] text-black/70">
          {repeatedItems.map((item, i) => (
            <span key={i} className="flex items-center gap-10 pr-10">
              {item}
              <span className="text-black/25">·</span>
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
