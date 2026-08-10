// frontend/components/layout/AnnouncementBar.tsx

export default function AnnouncementBar() {
  const items = [
    "Cash on delivery across Pakistan",
    "Secure international checkout",
    "Handcrafted in Pakistan",
  ];

  return (
    <div className="bg-foreground text-background">
      <div className="relative flex h-9 overflow-hidden" aria-hidden>
        <p className="animate-marquee flex shrink-0 items-center whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.22em]">
          {[...items, ...items].map((item, i) => (
            <span key={i} className="flex items-center gap-10 pr-10">
              {item}
              <span className="text-background/50">✦</span>
            </span>
          ))}
        </p>
      </div>
    </div>
  );
}
