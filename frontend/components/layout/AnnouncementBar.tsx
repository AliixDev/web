// frontend/components/layout/AnnouncementBar.tsx

export default function AnnouncementBar() {
  const items = [
    "Cash on delivery across Pakistan",
    "Secure international checkout",
    "Handcrafted in Pakistan",
    "Free shipping on orders over PKR 5,000",
  ];

  const repeatedItems = [...items, ...items, ...items];

  return (
    <div className="bg-foreground text-background">
      <div className="relative flex h-8 overflow-hidden" aria-hidden>
        <p className="animate-marquee flex shrink-0 items-center whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.25em] text-background/80">
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
