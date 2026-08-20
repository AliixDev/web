// frontend/components/hero/CinematicHero.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroScene from "./HeroScene";
import HeroLoading from "./HeroLoading";

gsap.registerPlugin(ScrollTrigger);

/* ── Helpers ───────────────────────────────────────────────────── */
function phaseProgress(progress: number, start: number, end: number) {
  return Math.min(1, Math.max(0, (progress - start) / (end - start)));
}

function easeOut(p: number) {
  return 1 - Math.pow(1 - p, 3);
}

/* ── Component ────────────────────────────────────────────────── */
export default function CinematicHero() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  // ── Reduced-motion detection ──
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // ── Responsive canvas dimensions ──
  useEffect(() => {
    function measure() {
      setDims({ w: window.innerWidth, h: window.innerHeight });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // ── Simulated asset preloading ──
  useEffect(() => {
    let frame: number;
    let value = 0;
    function tick() {
      value = Math.min(1, value + 0.05 + Math.random() * 0.04);
      setLoadProgress(value);
      if (value < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        window.setTimeout(() => setLoading(false), 350);
      }
    }
    frame = window.requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // ── GSAP ScrollTrigger (skipped for reduced motion) ──
  useEffect(() => {
    if (reducedMotion || loading) return;
    const hero = heroRef.current;
    if (!hero) return;

    let ctx: gsap.Context;
    let st: ScrollTrigger | null = null;

    const raf = window.requestAnimationFrame(() => {
      ctx = gsap.context(() => {
        st = ScrollTrigger.create({
          trigger: hero,
          start: "top top",
          end: "bottom bottom",
          pin: stageRef.current,
          scrub: 1,
          onUpdate: (self) => {
            setProgress(self.progress);
          },
        });
      }, hero);
    });

    return () => {
      cancelAnimationFrame(raf);
      st?.kill();
      ctx?.revert();
    };
  }, [reducedMotion, loading]);

  /* ── Phase calculations ── */
  const p1 = phaseProgress(progress, 0, 0.1);    // The Awakening
  const p2 = phaseProgress(progress, 0.1, 0.25);  // Brand Origin
  const p3 = phaseProgress(progress, 0.25, 0.4);  // Early Years
  const p4 = phaseProgress(progress, 0.4, 0.55);  // Suit Development
  const p5 = phaseProgress(progress, 0.55, 0.7);  // Protection Tech
  const p6 = phaseProgress(progress, 0.7, 0.8);   // Material Quality
  const p7 = phaseProgress(progress, 0.8, 0.9);   // Built Around Rider
  const p8 = phaseProgress(progress, 0.9, 1);     // Present / CTA

  // ── Reduced motion: static hero ──
  if (reducedMotion) {
    return (
      <>
        {loading && <HeroLoading progress={loadProgress} />}
        <section
          className="relative h-screen w-full overflow-hidden bg-[#000000]"
          aria-label="RACEVOR motorcycle protection gear"
        >
          <div className="absolute inset-0">
            <img
              src="/assets/racevor/front-motorcycle.png"
              alt="RACEVOR motorcycle rider in premium protection gear"
              className="h-full w-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/50" />

          <div className="pointer-events-none absolute inset-0 z-10">
            <div className="absolute inset-0 flex items-end px-6 pb-24 md:px-12 md:pb-32">
              <div className="pointer-events-auto max-w-3xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/35">
                  Established 2017
                </p>
                <h1 className="mt-5 font-display text-[48px] font-light leading-[0.92] tracking-tighter text-white sm:text-[64px] md:text-[80px] lg:text-[100px]">
                  BUILT
                  <br />
                  <span className="text-neutral-400">FOR THE RIDE</span>
                </h1>
                <p className="mt-6 max-w-lg text-[14px] leading-[1.8] text-white/45 sm:text-[15px]">
                  Born from a pursuit of better protection, better fit, and better riding performance.
                </p>
                <Link
                  href="/shop?category=motorbike-gear"
                  className="pointer-events-auto mt-8 inline-flex h-12 items-center gap-2 border border-white/25 bg-white/5 px-8 text-[12px] font-medium uppercase tracking-[0.12em] text-white backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-white/10"
                >
                  Shop Now <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  // ── Full cinematic experience ──
  return (
    <>
      {/* 500vh scroll spacer for GSAP pinning */}
      <div
        ref={heroRef}
        className="bg-[#000000]"
        style={{ height: "500vh" }}
        aria-label="RACEVOR cinematic motorcycle story — scroll to explore"
      >
        {/* Pinned visual stage */}
        <div
          ref={stageRef}
          className="relative h-screen w-full overflow-hidden bg-[#000000]"
        >
          {/* Image scene with cross-fades + canvas fallback */}
          {dims.w > 0 && (
            <HeroScene progress={progress} width={dims.w} height={dims.h} />
          )}

          {/* ── TEXT OVERLAY LAYER ── */}
          <div className="pointer-events-none absolute inset-0 z-10">

            {/* ── PHASE 1: THE AWAKENING (0%→10%) ── */}
            <div
              className="absolute inset-0 flex items-end px-6 pb-24 md:px-12 md:pb-32"
              style={{
                opacity: clamp(p1 * 3) * (1 - easeOut(p2) * 3),
                transform: `translateY(${(1 - clamp(p1 * 2)) * 20}px)`,
              }}
            >
              <div className="pointer-events-auto max-w-3xl">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30"
                  style={{ opacity: clamp(p1 * 4) }}
                >
                  RACEVOR — Motorcycle Protection
                </p>
                <h1
                  className="mt-5 font-display text-[48px] font-light leading-[0.92] tracking-tighter text-white sm:text-[64px] md:text-[80px] lg:text-[100px]"
                  style={{
                    opacity: clamp(p1 * 2.5),
                    transform: `translateY(${(1 - clamp(p1 * 2.5)) * 15}px)`,
                  }}
                >
                  BUILT
                  <br />
                  <span className="text-neutral-400">FOR THE RIDE</span>
                </h1>
                <p
                  className="mt-5 max-w-lg text-[14px] leading-[1.8] text-white/40 sm:text-[15px]"
                  style={{ opacity: clamp((p1 - 0.3) * 4) }}
                >
                  Born from a pursuit of better protection, better fit, and better riding performance.
                </p>
              </div>
            </div>

            {/* ── PHASE 2: BRAND ORIGIN (10%→25%) ── */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
              style={{
                opacity: clamp(p2 * 3) * (1 - easeOut(p3) * 3),
              }}
            >
              <div className="pointer-events-auto">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30"
                  style={{ opacity: clamp(p2 * 3) }}
                >
                  ESTABLISHED 2017
                </p>
                <h2
                  className="mt-4 font-display text-[32px] font-light tracking-tight text-white sm:text-[40px] md:text-[48px]"
                  style={{
                    opacity: clamp(p2 * 2.5),
                    transform: `translateY(${(1 - clamp(p2 * 2)) * 12}px)`,
                  }}
                >
                  THE BEGINNING
                </h2>
                <p
                  className="mt-4 max-w-sm text-[13px] leading-[1.7] text-white/35"
                  style={{ opacity: clamp((p2 - 0.3) * 4) }}
                >
                  We started with a question: what does real motorcycle protection look like?
                </p>
              </div>
            </div>

            {/* ── PHASE 3: EARLY YEARS / WORKSHOP (25%→40%) ── */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
              style={{
                opacity: clamp(p3 * 3) * (1 - easeOut(p4) * 3),
              }}
            >
              <div className="pointer-events-auto">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30"
                  style={{ opacity: clamp(p3 * 3) }}
                >
                  DEVELOPMENT
                </p>
                <h2
                  className="mt-4 font-display text-[32px] font-light tracking-tight text-white sm:text-[40px] md:text-[48px]"
                  style={{
                    opacity: clamp(p3 * 2.5),
                    transform: `translateY(${(1 - clamp(p3 * 2)) * 10}px)`,
                  }}
                >
                  PROTECTION<br />FIRST
                </h2>
                <p
                  className="mt-4 max-w-sm text-[13px] leading-[1.7] text-white/35"
                  style={{ opacity: clamp((p3 - 0.3) * 4) }}
                >
                  Leather, stitching, armor — every detail developed in-house since 2017.
                </p>
              </div>
            </div>

            {/* ── PHASE 4: MOTORCYCLE SUIT DEVELOPMENT (40%→55%) ── */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
              style={{
                opacity: clamp(p4 * 3) * (1 - easeOut(p5) * 3),
              }}
            >
              <div className="pointer-events-auto">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30"
                  style={{ opacity: clamp(p4 * 3) }}
                >
                  MOTORCYCLE SUITS
                </p>
                <h2
                  className="mt-4 font-display text-[32px] font-light tracking-tight text-white sm:text-[40px] md:text-[48px]"
                  style={{
                    opacity: clamp(p4 * 2.5),
                    transform: `translateY(${(1 - clamp(p4 * 2)) * 10}px)`,
                  }}
                >
                  ENGINEERED<br />PROTECTION
                </h2>
                <p
                  className="mt-4 max-w-sm text-[13px] leading-[1.7] text-white/35"
                  style={{ opacity: clamp((p4 - 0.3) * 4) }}
                >
                  Full motorcycle suits designed around the rider — shoulder, elbow, knee, back.
                </p>
              </div>
            </div>

            {/* ── PHASE 5: PROTECTION TECHNOLOGY (55%→70%) ── */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
              style={{
                opacity: clamp(p5 * 3) * (1 - easeOut(p6) * 3),
              }}
            >
              <div className="pointer-events-auto">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30"
                  style={{ opacity: clamp(p5 * 3) }}
                >
                  PROTECTION TECHNOLOGY
                </p>
                <h2
                  className="mt-4 font-display text-[32px] font-light tracking-tight text-white sm:text-[40px] md:text-[48px]"
                  style={{
                    opacity: clamp(p5 * 2.5),
                    transform: `translateY(${(1 - clamp(p5 * 2)) * 10}px)`,
                  }}
                >
                  ENGINEERED<br />FOR IMPACT
                </h2>
                <p
                  className="mt-4 max-w-sm text-[13px] leading-[1.7] text-white/35"
                  style={{ opacity: clamp((p5 - 0.3) * 4) }}
                >
                  CE Level 2 protection. Bio-Armor system. Multi-density energy-absorbing foam.
                </p>
              </div>
            </div>

            {/* ── PHASE 6: MATERIAL QUALITY (70%→80%) ── */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
              style={{
                opacity: clamp(p6 * 3) * (1 - easeOut(p7) * 3),
              }}
            >
              <div className="pointer-events-auto">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30"
                  style={{ opacity: clamp(p6 * 3) }}
                >
                  MATERIAL QUALITY
                </p>
                <h2
                  className="mt-4 font-display text-[32px] font-light tracking-tight text-white sm:text-[40px] md:text-[48px]"
                  style={{
                    opacity: clamp(p6 * 2.5),
                    transform: `translateY(${(1 - clamp(p6 * 2)) * 10}px)`,
                  }}
                >
                  FULL-GRAIN<br />LEATHER
                </h2>
                <p
                  className="mt-4 max-w-sm text-[13px] leading-[1.7] text-white/35"
                  style={{ opacity: clamp((p6 - 0.3) * 4) }}
                >
                  Premium abrasion-resistant leather with reinforced stitching at every critical zone.
                </p>
              </div>
            </div>

            {/* ── PHASE 7: BUILT AROUND THE RIDER (80%→90%) ── */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
              style={{
                opacity: clamp(p7 * 3) * (1 - easeOut(p8) * 3),
              }}
            >
              <div className="pointer-events-auto">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30"
                  style={{ opacity: clamp(p7 * 3) }}
                >
                  ERGONOMIC FIT
                </p>
                <h2
                  className="mt-4 font-display text-[32px] font-light tracking-tight text-white sm:text-[40px] md:text-[48px]"
                  style={{
                    opacity: clamp(p7 * 2.5),
                    transform: `translateY(${(1 - clamp(p7 * 2)) * 10}px)`,
                  }}
                >
                  BUILT AROUND<br />THE RIDER
                </h2>
                <p
                  className="mt-4 max-w-sm text-[13px] leading-[1.7] text-white/35"
                  style={{ opacity: clamp((p7 - 0.3) * 4) }}
                >
                  Protection should move with you, not against you. Aerodynamic form. Natural movement.
                </p>
              </div>
            </div>

            {/* ── PHASE 8: PRESENT / CTA (90%→100%) ── */}
            <div
              className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
              style={{ opacity: clamp(p8 * 3) }}
            >
              <div className="pointer-events-auto">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/30"
                  style={{ opacity: clamp(p8 * 4) }}
                >
                  RACEVOR — TODAY
                </p>
                <h2
                  className="mt-4 font-display text-[36px] font-light tracking-tight text-white sm:text-[44px] md:text-[52px]"
                  style={{
                    opacity: clamp(p8 * 3),
                    transform: `translateY(${(1 - clamp(p8 * 3)) * 12}px)`,
                  }}
                >
                  BUILT FOR THE RIDE
                </h2>
                <p
                  className="mt-4 max-w-md text-[13px] leading-[1.7] text-white/40"
                  style={{ opacity: clamp((p8 - 0.15) * 4) }}
                >
                  Explore the latest RACEVOR motorcycle protection gear.
                </p>
                <div
                  className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
                  style={{ opacity: clamp((p8 - 0.2) * 4) }}
                >
                  <Link
                    href="/shop?category=motorbike-gear"
                    className="pointer-events-auto inline-flex h-12 items-center gap-2 bg-white px-8 text-[12px] font-medium uppercase tracking-[0.12em] text-black transition-opacity hover:opacity-85"
                  >
                    Shop Motorcycle Suits <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <Link
                    href="/shop"
                    className="pointer-events-auto inline-flex h-12 items-center gap-2 border border-white/30 px-8 text-[12px] font-medium uppercase tracking-[0.12em] text-white transition-all duration-300 hover:border-white hover:bg-white/5"
                  >
                    Explore Collection
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Scroll indicator (fades out) ── */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center"
              style={{ opacity: 1 - progress * 8 }}
            >
              <div className="flex flex-col items-center gap-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/25">Scroll to begin</p>
                <div className="h-8 w-px animate-pulse bg-white/15" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Utility ── */
function clamp(v: number) {
  return Math.min(1, Math.max(0, v));
}
