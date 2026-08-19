// frontend/components/hero/CinematicHero.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Shield, Wind, Target } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import HeroCanvas from "./HeroCanvas";
import HeroLoading from "./HeroLoading";

gsap.registerPlugin(ScrollTrigger);

function phaseProgress(progress: number, start: number, end: number) {
  return Math.min(1, Math.max(0, (progress - start) / (end - start)));
}

/* ── Component ────────────────────────────────────────────────── */
export default function CinematicHero() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

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

  // ── Simulated asset preloading (code-generated, so near-instant) ──
  useEffect(() => {
    let frame: number;
    let value = 0;
    function tick() {
      value = Math.min(1, value + 0.06 + Math.random() * 0.04);
      setLoadProgress(value);
      if (value < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        window.setTimeout(() => setLoading(false), 400);
      }
    }
    frame = window.requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  // ── GSAP ScrollTrigger setup (skipped for reduced motion) ──
  useEffect(() => {
    if (reducedMotion || loading) return;

    const hero = heroRef.current;
    const overlay = overlayRef.current;
    if (!hero || !overlay) return;

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

  /* ── Phase text calculations ── */
  const p1 = phaseProgress(progress, 0, 0.2);
  const p2 = phaseProgress(progress, 0.2, 0.4);
  const p3 = phaseProgress(progress, 0.4, 0.6);
  const p4 = phaseProgress(progress, 0.6, 0.8);
  const p5 = phaseProgress(progress, 0.8, 1);

  // ── Reduced motion: static hero (no scroll animation) ──
  if (reducedMotion) {
    return (
      <>
        {loading && <HeroLoading progress={loadProgress} />}
        <section
          className="relative h-screen w-full overflow-hidden bg-[#050505]"
          aria-label="Premium motorcycle gear — SDB WEAR"
        >
          <div className="absolute inset-0 bg-[#080808]">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/30 to-[#050505]" />
          </div>

          <div className="pointer-events-none absolute inset-0 z-10">
            {/* Navigation */}
            <nav className="pointer-events-auto absolute inset-x-0 top-0 z-20">
              <div className="container flex h-16 items-center justify-between px-4 md:px-8">
                <Link href="/" className="font-display text-[18px] font-medium tracking-tight text-white transition-opacity hover:opacity-70 md:text-[20px]">
                  SDB<span className="font-light text-neutral-500">WEAR</span>
                </Link>
              </div>
            </nav>

            {/* Static hero content */}
            <div className="absolute inset-0 flex items-end px-4 pb-20 md:px-8 md:pb-28">
              <div className="pointer-events-auto max-w-3xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
                  Premium Motorcycle Gear
                </p>
                <h1 className="mt-5 font-display text-[42px] font-light leading-[0.96] tracking-tighter text-white sm:text-[56px] md:text-[72px] lg:text-[88px]">
                  BUILT
                  <br />
                  <span className="text-neutral-400">FOR THE RIDE</span>
                </h1>
                <p className="mt-5 max-w-md text-[13px] leading-[1.75] text-white/50 sm:text-[14px]">
                  High-performance gear engineered for riders who demand more.
                </p>
                <Link
                  href="/shop?category=motorbike-gear"
                  className="pointer-events-auto mt-8 inline-flex h-12 items-center gap-2 border border-white/30 bg-white/5 px-8 text-[12px] font-medium uppercase tracking-[0.12em] text-white backdrop-blur-sm transition-all duration-300 hover:border-white/60 hover:bg-white/10"
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
      {loading && <HeroLoading progress={loadProgress} />}

      {/* 500vh scroll spacer for GSAP pinning */}
      <div
        ref={heroRef}
        className="bg-[#050505]"
        style={{ height: "500vh" }}
        aria-label="Cinematic motorcycle experience — scroll to explore"
      >
        {/* Pinned visual stage */}
        <div
          ref={stageRef}
          className="relative h-screen w-full overflow-hidden bg-[#050505]"
        >
          {dims.w > 0 && (
            <HeroCanvas progress={progress} width={dims.w} height={dims.h} />
          )}

          {/* Overlays */}
          <div ref={overlayRef} className="pointer-events-none absolute inset-0 z-10">
            {/* ── NAVIGATION OVERLAY ── */}
            <nav className="pointer-events-auto absolute inset-x-0 top-0 z-20">
              <div className="container flex h-16 items-center justify-between px-4 md:px-8">
                <Link href="/" className="font-display text-[18px] font-medium tracking-tight text-white transition-opacity hover:opacity-70 md:text-[20px]">
                  SDB<span className="font-light text-neutral-500">WEAR</span>
                </Link>
                <div className="hidden items-center gap-6 md:flex">
                  <Link href="/shop" className="text-[12px] font-medium uppercase tracking-[0.15em] text-white/60 transition-colors hover:text-white">Shop</Link>
                  <Link href="/shop?category=motorbike-gear" className="text-[12px] font-medium uppercase tracking-[0.15em] text-white/60 transition-colors hover:text-white">Moto Gear</Link>
                  <Link href="/shop?category=leather-jackets-biker-fashion" className="text-[12px] font-medium uppercase tracking-[0.15em] text-white/60 transition-colors hover:text-white">Leather</Link>
                  <Link href="/shop?category=handcrafted-gloves" className="text-[12px] font-medium uppercase tracking-[0.15em] text-white/60 transition-colors hover:text-white">Gloves</Link>
                  <Link href="/about" className="text-[12px] font-medium uppercase tracking-[0.15em] text-white/60 transition-colors hover:text-white">About</Link>
                </div>
              </div>
            </nav>

            {/* ── PHASE 1: IGNITION + BRANDING ── */}
            <div
              className="absolute inset-0 flex items-end px-4 pb-20 md:px-8 md:pb-28"
              style={{ opacity: 1 - p2 * 3 }}
            >
              <div className="pointer-events-auto max-w-3xl">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40"
                  style={{ opacity: Math.min(p1 * 4, 1) }}
                >
                  Premium Motorcycle Gear
                </p>
                <h1
                  className="mt-5 font-display text-[42px] font-light leading-[0.96] tracking-tighter text-white sm:text-[56px] md:text-[72px] lg:text-[88px]"
                  style={{
                    opacity: Math.min(p1 * 3, 1),
                    transform: `translateY(${(1 - Math.min(p1 * 3, 1)) * 20}px)`,
                  }}
                >
                  BUILT
                  <br />
                  <span className="text-neutral-400">FOR THE RIDE</span>
                </h1>
                <p
                  className="mt-5 max-w-md text-[13px] leading-[1.75] text-white/50 sm:text-[14px]"
                  style={{ opacity: Math.min(Math.max((p1 - 0.2) * 4, 0), 1) }}
                >
                  High-performance gear engineered for riders who demand more.
                </p>
                <Link
                  href="/shop?category=motorbike-gear"
                  className="pointer-events-auto mt-8 inline-flex h-12 items-center gap-2 border border-white/30 bg-white/5 px-8 text-[12px] font-medium uppercase tracking-[0.12em] text-white backdrop-blur-sm transition-all duration-300 hover:border-white/60 hover:bg-white/10"
                  style={{ opacity: Math.min(Math.max((p1 - 0.3) * 3, 0), 1) }}
                >
                  Shop Now <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>

            {/* ── PHASE 2: SUIT FOCUS ── */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: p2 * (1 - p3 * 2) }}
            >
              <div className="pointer-events-auto text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
                  Engineered Protection
                </p>
                <h2
                  className="mt-4 font-display text-[32px] font-light tracking-tight text-white sm:text-[40px] md:text-[48px]"
                  style={{ transform: `translateY(${(1 - p2) * 15}px)` }}
                >
                  Full-Grain Leather
                </h2>
                <p className="mt-3 max-w-sm text-[12px] leading-[1.7] text-white/40">
                  Premium abrasion-resistant construction with reinforced stitching at every critical zone.
                </p>
              </div>
            </div>

            {/* ── PHASE 3: MATERIAL + PROTECTION SPECS ── */}
            <div
              className="absolute inset-0 flex items-center justify-center px-4"
              style={{ opacity: p3 * (1 - p4 * 2) }}
            >
              <div className="pointer-events-auto grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
                {[
                  { icon: Shield, title: "FULL-GRAIN LEATHER", desc: "Premium abrasion-resistant construction." },
                  { icon: Target, title: "CE LEVEL 2 PROTECTION", desc: "Engineered impact protection at critical zones." },
                  { icon: Wind, title: "PRECISION FIT", desc: "Designed around the rider's natural position." },
                ].map((card, i) => (
                  <div
                    key={card.title}
                    className="border border-white/10 bg-black/60 p-6 backdrop-blur-md"
                    style={{
                      transform: `translateY(${(1 - Math.min(p3 * 2, 1)) * (20 + i * 8)}px)`,
                      opacity: Math.min(p3 * 2.5, 1),
                    }}
                  >
                    <card.icon className="h-5 w-5 text-white/30" strokeWidth={1.25} aria-hidden />
                    <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">{card.title}</h3>
                    <p className="mt-2 text-[12px] leading-[1.7] text-white/40">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── PHASE 4: AERODYNAMICS + SIDE PROFILE ── */}
            <div
              className="absolute inset-0 flex items-center justify-center px-4"
              style={{ opacity: p4 * (1 - p5 * 2) }}
            >
              <div className="pointer-events-auto text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">Aerodynamic Form</p>
                <h2
                  className="mt-4 font-display text-[32px] font-light tracking-tight text-white sm:text-[40px] md:text-[48px]"
                  style={{ transform: `translateY(${(1 - p4) * 12}px)` }}
                >
                  Built Around<br /><span className="text-neutral-400">The Rider</span>
                </h2>
                <p className="mt-4 max-w-sm text-[12px] leading-[1.7] text-white/40">Natural movement. Zero compromise.</p>
              </div>
            </div>

            {/* ── PHASE 5: FINAL CTA ── */}
            <div
              className="absolute inset-0 flex items-center justify-center px-4"
              style={{ opacity: p5 }}
            >
              <div className="pointer-events-auto text-center">
                <h2 className="font-display text-[36px] font-light tracking-tight text-white sm:text-[44px] md:text-[52px]">Ready to Ride?</h2>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Link href="/shop?category=motorbike-gear" className="inline-flex h-12 items-center gap-2 bg-white px-8 text-[12px] font-medium uppercase tracking-[0.12em] text-black transition-opacity hover:opacity-85">
                    Shop Moto Suits <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <Link href="/shop" className="inline-flex h-12 items-center gap-2 border border-white/30 px-8 text-[12px] font-medium uppercase tracking-[0.12em] text-white transition-all duration-300 hover:border-white hover:bg-white/5">
                    Explore Collection
                  </Link>
                </div>
              </div>
            </div>

            {/* ── Scroll hint (fades out on scroll) ── */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center"
              style={{ opacity: 1 - progress * 8 }}
            >
              <div className="flex flex-col items-center gap-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-white/30">Scroll to explore</p>
                <div className="h-8 w-px animate-pulse bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
