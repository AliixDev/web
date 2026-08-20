// frontend/components/hero/HeroScene.tsx
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface HeroSceneProps {
  progress: number;
  width: number;
  height: number;
}

/** Image layer definition — each entry maps a photo to a scroll range. */
interface ImageLayer {
  src: string;
  /** When this image starts fading in (0–1). */
  inStart: number;
  /** When this image reaches full opacity (0–1). */
  inEnd: number;
  /** When this image starts fading out (0–1). */
  outStart: number;
  /** When this image is fully faded out (0–1). */
  outEnd: number;
  /** Optional base scale. */
  scale?: number;
  /** Additional vertical offset (px) driven by progress. */
  parallaxY?: number;
  /** Object-position override. */
  objectPosition?: string;
}

const LAYERS: ImageLayer[] = [
  {
    src: "/assets/racevor/front-motorcycle.png",
    inStart: 0,
    inEnd: 0.02,
    outStart: 0.22,
    outEnd: 0.32,
    scale: 1.0,
    parallaxY: -30,
    objectPosition: "center 55%",
  },
  {
    src: "/assets/racevor/workshop.png",
    inStart: 0.22,
    inEnd: 0.32,
    outStart: 0.38,
    outEnd: 0.45,
    scale: 1.05,
    parallaxY: -20,
    objectPosition: "center center",
  },
  {
    src: "/assets/racevor/motorcycle-suit.png",
    inStart: 0.38,
    inEnd: 0.48,
    outStart: 0.52,
    outEnd: 0.6,
    scale: 1.0,
    parallaxY: -15,
    objectPosition: "center center",
  },
  {
    src: "/assets/racevor/armor-protection.png",
    inStart: 0.52,
    inEnd: 0.6,
    outStart: 0.66,
    outEnd: 0.74,
    scale: 1.04,
    parallaxY: -20,
    objectPosition: "center center",
  },
  {
    src: "/assets/racevor/leather-detail.png",
    inStart: 0.66,
    inEnd: 0.74,
    outStart: 0.78,
    outEnd: 0.85,
    scale: 1.06,
    parallaxY: -10,
    objectPosition: "center center",
  },
  {
    src: "/assets/racevor/motorcycle-action.png",
    inStart: 0.78,
    inEnd: 0.88,
    outStart: 0.92,
    outEnd: 1.0,
    scale: 1.02,
    parallaxY: -25,
    objectPosition: "center center",
  },
];

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function layerOpacity(progress: number, layer: ImageLayer): number {
  if (progress < layer.inStart) return 0;
  if (progress < layer.inEnd) return clamp01((progress - layer.inStart) / (layer.inEnd - layer.inStart));
  if (progress <= layer.outStart) return 1;
  if (progress <= layer.outEnd) return 1 - clamp01((progress - layer.outStart) / (layer.outEnd - layer.outStart));
  return 0;
}

export default function HeroScene({ progress, width, height }: HeroSceneProps) {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; size: number; opacity: number; wobble: number }[]>([]);

  // Track which images are loaded
  const handleLoad = useCallback((src: string) => {
    setLoaded((prev) => ({ ...prev, [src]: true }));
  }, []);

  const handleErr = useCallback((src: string) => {
    // Silently mark as not loaded — canvas fallback will show
    setLoaded((prev) => ({ ...prev, [src]: false }));
  }, []);

  // Initialize fog particles once
  useEffect(() => {
    if (particlesRef.current.length > 0) return;
    particlesRef.current = Array.from({ length: 30 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0002,
      size: Math.random() * 60 + 30,
      opacity: Math.random() * 0.04 + 0.01,
      wobble: Math.random() * Math.PI * 2,
    }));
  }, []);

  // Canvas fallback drawing
  const drawCanvas = useCallback(
    (ctx: CanvasRenderingContext2D, p: number, w: number, h: number) => {
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const motorcycleY = h * 0.55;

      // Background
      const bg = ctx.createRadialGradient(cx, h * 0.5, 0, cx, h * 0.5, w * 0.85);
      bg.addColorStop(0, "#1a1a1a");
      bg.addColorStop(0.5, "#0d0d0d");
      bg.addColorStop(1, "#030303");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Fog
      particlesRef.current.forEach((pt) => {
        pt.x = ((pt.x + pt.vx + 1) % 1);
        pt.y = ((pt.y + pt.vy + 1) % 1);
        const fx = pt.x * w;
        const fy = pt.y * h;
        const fogAlpha = pt.opacity * (1 + p * 0.4) * (0.5 + 0.5 * Math.sin(pt.wobble + p * 2));
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, pt.size);
        g.addColorStop(0, `rgba(160,160,160,${fogAlpha})`);
        g.addColorStop(1, "rgba(160,160,160,0)");
        ctx.fillStyle = g;
        ctx.fillRect(fx - pt.size, fy - pt.size, pt.size * 2, pt.size * 2);
      });

      // Pre-glow
      const preGlow = ctx.createRadialGradient(cx, motorcycleY - 5, 0, cx, motorcycleY - 5, w * 0.35);
      preGlow.addColorStop(0, `rgba(255,200,100,${0.02 + p * 0.12})`);
      preGlow.addColorStop(0.5, `rgba(255,150,50,${0.01 + p * 0.04})`);
      preGlow.addColorStop(1, "rgba(255,100,0,0)");
      ctx.fillStyle = preGlow;
      ctx.fillRect(0, 0, w, h);

      // Motorcycle body
      ctx.save();
      ctx.translate(cx, motorcycleY);

      // Ground shadow
      const shadow = ctx.createRadialGradient(0, 50, 10, 0, 50, w * 0.3);
      shadow.addColorStop(0, "rgba(0,0,0,0.35)");
      shadow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = shadow;
      ctx.beginPath();
      ctx.ellipse(0, 50, w * 0.3, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main body
      ctx.fillStyle = "#0c0c0c";
      ctx.strokeStyle = "rgba(55,55,55,0.3)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-100, -12);
      ctx.quadraticCurveTo(-105, -45, -68, -58);
      ctx.quadraticCurveTo(-25, -72, 8, -74);
      ctx.quadraticCurveTo(58, -70, 90, -58);
      ctx.quadraticCurveTo(118, -45, 115, -12);
      ctx.lineTo(105, 42);
      ctx.lineTo(-92, 42);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Seat
      ctx.fillStyle = "#101010";
      ctx.beginPath();
      ctx.moveTo(-40, -56);
      ctx.quadraticCurveTo(-8, -65, 50, -56);
      ctx.quadraticCurveTo(72, -50, 72, -36);
      ctx.lineTo(-36, -36);
      ctx.closePath();
      ctx.fill();

      // Tank
      ctx.fillStyle = "#131313";
      ctx.beginPath();
      ctx.ellipse(18, -58, 58, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(50,50,50,0.35)";
      ctx.stroke();

      // Wheels
      [-82, 82].forEach((wx) => {
        ctx.beginPath();
        ctx.arc(wx, 44, 28, 0, Math.PI * 2);
        ctx.fillStyle = "#060606";
        ctx.fill();
        ctx.strokeStyle = "rgba(45,45,45,0.5)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(wx, 44, 17, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(35,35,35,0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5;
          ctx.beginPath();
          ctx.moveTo(wx, 44);
          ctx.lineTo(wx + Math.cos(angle) * 24, 44 + Math.sin(angle) * 24);
          ctx.strokeStyle = "rgba(45,45,45,0.25)";
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      });

      // Exhaust
      ctx.strokeStyle = "rgba(50,50,50,0.4)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(65, 18);
      ctx.quadraticCurveTo(108, 22, 118, 14);
      ctx.stroke();

      // Handlebars
      ctx.strokeStyle = "rgba(55,55,55,0.45)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-78, -36);
      ctx.lineTo(-98, -68);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-78, -36);
      ctx.lineTo(-58, -68);
      ctx.stroke();

      ctx.restore();

      // Rider silhouette
      const riderH = 45 + p * 45;
      const riderOp = 0.1 + p * 0.25;
      ctx.save();
      ctx.globalAlpha = riderOp;
      ctx.fillStyle = "#070707";
      ctx.beginPath();
      ctx.arc(cx, motorcycleY - 75 - riderH * 0.85, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 24, motorcycleY - 75);
      ctx.quadraticCurveTo(cx - 38, motorcycleY - 36, cx - 30, motorcycleY - 8);
      ctx.lineTo(cx + 30, motorcycleY - 8);
      ctx.quadraticCurveTo(cx + 38, motorcycleY - 36, cx + 24, motorcycleY - 75);
      ctx.closePath();
      ctx.fill();
      // Shoulders
      ctx.beginPath();
      ctx.moveTo(cx - 24, motorcycleY - 70);
      ctx.quadraticCurveTo(cx - 58, motorcycleY - 65, cx - 72, motorcycleY - 46);
      ctx.quadraticCurveTo(cx - 68, motorcycleY - 36, cx - 30, motorcycleY - 50);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 24, motorcycleY - 70);
      ctx.quadraticCurveTo(cx + 58, motorcycleY - 65, cx + 72, motorcycleY - 46);
      ctx.quadraticCurveTo(cx + 68, motorcycleY - 36, cx + 30, motorcycleY - 50);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Rim lighting
      const rimGrad = ctx.createLinearGradient(0, motorcycleY - 90, 0, motorcycleY + 90);
      rimGrad.addColorStop(0, `rgba(110,110,110,${0.02 + p * 0.06})`);
      rimGrad.addColorStop(0.5, `rgba(70,70,70,${0.01 + p * 0.03})`);
      rimGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rimGrad;
      ctx.fillRect(cx - w * 0.26, motorcycleY - 90, w * 0.52, 180);

      // Headlight
      const beamIntensity = Math.min(p * 2.5, 1);
      if (beamIntensity > 0) {
        ctx.save();

        // Outer glow
        const outerGlow = ctx.createRadialGradient(cx, motorcycleY - 5, 0, cx, motorcycleY - 5, w * 0.4);
        outerGlow.addColorStop(0, `rgba(255,220,150,${0.07 * beamIntensity})`);
        outerGlow.addColorStop(0.4, `rgba(255,180,80,${0.03 * beamIntensity})`);
        outerGlow.addColorStop(1, "rgba(255,150,50,0)");
        ctx.fillStyle = outerGlow;
        ctx.fillRect(0, 0, w, h);

        // Beam cone
        ctx.globalAlpha = beamIntensity * 0.25;
        const beamGrad = ctx.createLinearGradient(cx, motorcycleY - 12, cx, motorcycleY - h * 0.5);
        beamGrad.addColorStop(0, "rgba(255,240,200,0.3)");
        beamGrad.addColorStop(0.3, "rgba(255,220,150,0.1)");
        beamGrad.addColorStop(1, "rgba(255,200,100,0)");
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(cx - 26, motorcycleY - 12);
        ctx.lineTo(cx - w * 0.32, motorcycleY - h * 0.5);
        ctx.lineTo(cx + w * 0.32, motorcycleY - h * 0.5);
        ctx.lineTo(cx + 26, motorcycleY - 12);
        ctx.closePath();
        ctx.fill();

        // Core point
        const core = ctx.createRadialGradient(cx, motorcycleY - 5, 0, cx, motorcycleY - 5, 7);
        core.addColorStop(0, `rgba(255,255,240,${0.65 * beamIntensity})`);
        core.addColorStop(1, "rgba(255,255,240,0)");
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(cx, motorcycleY - 5, 7, 0, Math.PI * 2);
        ctx.fill();

        // Lens flare
        ctx.globalAlpha = beamIntensity * 0.18;
        const flare = ctx.createRadialGradient(cx, motorcycleY - 5, 0, cx, motorcycleY - 5, 50);
        flare.addColorStop(0, "rgba(255,255,255,0.22)");
        flare.addColorStop(0.15, "rgba(255,240,200,0.1)");
        flare.addColorStop(1, "rgba(255,200,100,0)");
        ctx.fillStyle = flare;
        ctx.beginPath();
        ctx.arc(cx, motorcycleY - 5, 50, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Floor reflection
      ctx.save();
      ctx.globalAlpha = 0.03 + p * 0.025;
      const floor = ctx.createLinearGradient(0, motorcycleY + 50, 0, motorcycleY + 140);
      floor.addColorStop(0, "rgba(90,90,90,0.2)");
      floor.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = floor;
      ctx.fillRect(cx - w * 0.32, motorcycleY + 50, w * 0.64, 90);
      ctx.restore();

      // Dust particles
      if (p > 0.04) {
        ctx.save();
        const dustCount = Math.floor(12 + p * 18);
        for (let i = 0; i < dustCount; i++) {
          const seed = i * 137.508 + p * 280;
          const dx = ((Math.sin(seed) * 0.5 + 0.5) * w * 0.65) + w * 0.175;
          const dy = ((Math.cos(seed * 0.7) * 0.5 + 0.5) * h * 0.35) + h * 0.12;
          const ds = 0.8 + Math.sin(seed * 0.3) * 0.4;
          const da = 0.07 * p * (0.3 + 0.7 * Math.sin(seed * 0.5));
          ctx.fillStyle = `rgba(180,180,180,${da})`;
          ctx.beginPath();
          ctx.arc(dx, dy, ds, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Vignette
      const vignette = ctx.createRadialGradient(cx, h * 0.5, w * 0.28, cx, h * 0.5, w * 0.75);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(0.7, `rgba(0,0,0,${0.12 + p * 0.08})`);
      vignette.addColorStop(1, `rgba(0,0,0,${0.3 + p * 0.12})`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    },
    [],
  );

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    drawCanvas(ctx, progress, width, height);
  }, [progress, width, height, drawCanvas]);

  const hasAnyImage = LAYERS.some((l) => loaded[l.src]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#030303]">
      {/* Image layers — cross-faded by scroll progress */}
      {LAYERS.map((layer) => {
        const opacity = layerOpacity(progress, layer);
        const baseScale = layer.scale ?? 1;
        const scale = baseScale + (progress * 0.03);
        const parallaxY = layer.parallaxY ? layer.parallaxY * progress : 0;

        // Only render if we've attempted to load (or are fading out)
        if (opacity <= 0 && !loaded[layer.src]) return null;

        return (
          <div
            key={layer.src}
            className="absolute inset-0"
            style={{
              opacity,
              transform: `scale(${scale}) translateY(${parallaxY}px)`,
              willChange: "opacity, transform",
            }}
          >
            <img
              src={layer.src}
              alt=""
              aria-hidden
              onLoad={() => handleLoad(layer.src)}
              onError={() => handleErr(layer.src)}
              className="h-full w-full object-cover"
              style={{ objectPosition: layer.objectPosition ?? "center center" }}
              draggable={false}
            />
          </div>
        );
      })}

      {/* Canvas fallback — always rendered underneath images */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{
          width,
          height,
          opacity: hasAnyImage ? 0 : 1,
          transition: "opacity 0.8s ease",
        }}
        aria-hidden
      />

      {/* Global atmospheric overlays */}
      <div className="pointer-events-none absolute inset-0">
        {/* Top-to-bottom gradient for text readability */}
        <div
          className="absolute inset-x-0 top-0 h-[40%]"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
          }}
        />
        {/* Bottom gradient */}
        <div
          className="absolute inset-x-0 bottom-0 h-[35%]"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
          }}
        />
        {/* Subtle vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
          }}
        />
      </div>
    </div>
  );
}
