// frontend/components/hero/HeroLoading.tsx
"use client";

export default function HeroLoading({ progress }: { progress: number }) {
  const pct = Math.round(progress * 100);

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#000000]"
      role="status"
      aria-label={`Loading experience: ${pct}%`}
    >
      <p className="font-display text-[28px] font-light tracking-tight text-white sm:text-[36px]">
        RACE<span className="text-neutral-500">VOR</span>
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-600">
        Motorcycle Protection
      </p>

      <div className="mt-10 w-48">
        <div className="h-px w-full overflow-hidden bg-neutral-800">
          <div
            className="h-full bg-white transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-600">
          Initializing ride experience
        </p>
        <p className="mt-1 text-center text-[11px] tabular-nums text-neutral-500">
          {pct}%
        </p>
      </div>
    </div>
  );
}
