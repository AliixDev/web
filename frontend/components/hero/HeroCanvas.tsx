// frontend/components/hero/HeroCanvas.tsx
"use client";

import { useEffect, useRef, useCallback } from "react";

interface HeroCanvasProps {
  progress: number;
  width: number;
  height: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  wobble: number;
}

export default function HeroCanvas({ progress, width, height }: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  // Initialize particles once
  useEffect(() => {
    if (particlesRef.current.length > 0) return;
    particlesRef.current = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0004,
      vy: (Math.random() - 0.5) * 0.0003,
      size: Math.random() * 80 + 30,
      opacity: Math.random() * 0.06 + 0.02,
      wobble: Math.random() * Math.PI * 2,
    }));
  }, []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, p: number, w: number, h: number) => {
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const motorcycleY = h * 0.58;

      // ── Background ──
      const bg = ctx.createRadialGradient(cx, h * 0.55, 0, cx, h * 0.55, w * 0.85);
      bg.addColorStop(0, "#1a1a1a");
      bg.addColorStop(0.5, "#0d0d0d");
      bg.addColorStop(1, "#040404");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // ── Fog particles ──
      particlesRef.current.forEach((pt) => {
        pt.x = ((pt.x + pt.vx + 1) % 1);
        pt.y = ((pt.y + pt.vy + 1) % 1);
        const fx = pt.x * w;
        const fy = pt.y * h;
        const fogAlpha = pt.opacity * (1 + p * 0.5) * (0.5 + 0.5 * Math.sin(pt.wobble + p * 2));
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, pt.size);
        g.addColorStop(0, `rgba(180,180,180,${fogAlpha})`);
        g.addColorStop(1, "rgba(180,180,180,0)");
        ctx.fillStyle = g;
        ctx.fillRect(fx - pt.size, fy - pt.size, pt.size * 2, pt.size * 2);
      });

      // ── Headlight glow (pre-ignition ambient) ──
      const preGlow = ctx.createRadialGradient(cx, motorcycleY - 5, 0, cx, motorcycleY - 5, w * 0.35);
      preGlow.addColorStop(0, `rgba(255,200,100,${0.02 + p * 0.12})`);
      preGlow.addColorStop(0.5, `rgba(255,150,50,${0.01 + p * 0.05})`);
      preGlow.addColorStop(1, "rgba(255,100,0,0)");
      ctx.fillStyle = preGlow;
      ctx.fillRect(0, 0, w, h);

      // ── Motorcycle body (geometric composition) ──
      ctx.save();
      ctx.translate(cx, motorcycleY);

      // Ground shadow
      const shadow = ctx.createRadialGradient(0, 55, 10, 0, 55, w * 0.32);
      shadow.addColorStop(0, "rgba(0,0,0,0.35)");
      shadow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = shadow;
      ctx.beginPath();
      ctx.ellipse(0, 55, w * 0.32, 18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main body block
      ctx.fillStyle = "#0e0e0e";
      ctx.strokeStyle = "rgba(60,60,60,0.35)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-110, -15);
      ctx.quadraticCurveTo(-115, -50, -75, -65);
      ctx.quadraticCurveTo(-30, -80, 10, -82);
      ctx.quadraticCurveTo(65, -78, 100, -65);
      ctx.quadraticCurveTo(130, -50, 125, -15);
      ctx.lineTo(115, 45);
      ctx.lineTo(-100, 45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Seat
      ctx.fillStyle = "#111111";
      ctx.beginPath();
      ctx.moveTo(-45, -62);
      ctx.quadraticCurveTo(-10, -72, 55, -62);
      ctx.quadraticCurveTo(80, -55, 80, -40);
      ctx.lineTo(-40, -40);
      ctx.closePath();
      ctx.fill();

      // Tank detail
      ctx.fillStyle = "#141414";
      ctx.beginPath();
      ctx.ellipse(20, -65, 65, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(55,55,55,0.4)";
      ctx.stroke();

      // Wheels
      [-90, 90].forEach((wx) => {
        ctx.beginPath();
        ctx.arc(wx, 48, 32, 0, Math.PI * 2);
        ctx.fillStyle = "#080808";
        ctx.fill();
        ctx.strokeStyle = "rgba(50,50,50,0.5)";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(wx, 48, 20, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(40,40,40,0.35)";
        ctx.lineWidth = 1;
        ctx.stroke();
        // Spokes
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(wx, 48);
          ctx.lineTo(wx + Math.cos(angle) * 28, 48 + Math.sin(angle) * 28);
          ctx.strokeStyle = "rgba(50,50,50,0.3)";
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      });

      // Exhaust pipes
      ctx.strokeStyle = "rgba(55,55,55,0.45)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(70, 20);
      ctx.quadraticCurveTo(120, 25, 130, 15);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(70, 28);
      ctx.quadraticCurveTo(125, 33, 135, 22);
      ctx.stroke();

      // Handlebars
      ctx.strokeStyle = "rgba(60,60,60,0.5)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-85, -40);
      ctx.lineTo(-110, -75);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-85, -40);
      ctx.lineTo(-65, -75);
      ctx.stroke();

      ctx.restore();

      // ── Rider silhouette (behind motorcycle, grows with scroll) ──
      const riderH = 50 + p * 50;
      const riderOp = 0.15 + p * 0.25;
      ctx.save();
      ctx.globalAlpha = riderOp;
      ctx.fillStyle = "#080808";
      ctx.beginPath();
      ctx.moveTo(cx - 25, motorcycleY - 80);
      // Head
      ctx.arc(cx, motorcycleY - 80 - riderH * 0.85, 18, 0, Math.PI * 2);
      ctx.fill();
      // Body
      ctx.beginPath();
      ctx.moveTo(cx - 28, motorcycleY - 80);
      ctx.quadraticCurveTo(cx - 42, motorcycleY - 40, cx - 35, motorcycleY - 10);
      ctx.lineTo(cx + 35, motorcycleY - 10);
      ctx.quadraticCurveTo(cx + 42, motorcycleY - 40, cx + 28, motorcycleY - 80);
      ctx.closePath();
      ctx.fill();
      // Shoulders
      ctx.beginPath();
      ctx.moveTo(cx - 28, motorcycleY - 75);
      ctx.quadraticCurveTo(cx - 65, motorcycleY - 70, cx - 80, motorcycleY - 50);
      ctx.quadraticCurveTo(cx - 75, motorcycleY - 40, cx - 35, motorcycleY - 55);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + 28, motorcycleY - 75);
      ctx.quadraticCurveTo(cx + 65, motorcycleY - 70, cx + 80, motorcycleY - 50);
      ctx.quadraticCurveTo(cx + 75, motorcycleY - 40, cx + 35, motorcycleY - 55);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // ── Rim lighting ──
      const rimGrad = ctx.createLinearGradient(0, motorcycleY - 100, 0, motorcycleY + 100);
      rimGrad.addColorStop(0, `rgba(120,120,120,${0.03 + p * 0.07})`);
      rimGrad.addColorStop(0.5, `rgba(80,80,80,${0.02 + p * 0.04})`);
      rimGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = rimGrad;
      ctx.fillRect(cx - w * 0.28, motorcycleY - 95, w * 0.56, 190);

      // ── Headlight beam (increases with scroll) ──
      const beamIntensity = Math.min(p * 2, 1);
      if (beamIntensity > 0) {
        ctx.save();

        // Wide outer glow
        const outerGlow = ctx.createRadialGradient(cx, motorcycleY - 5, 0, cx, motorcycleY - 5, w * 0.45);
        outerGlow.addColorStop(0, `rgba(255,220,150,${0.08 * beamIntensity})`);
        outerGlow.addColorStop(0.4, `rgba(255,180,80,${0.04 * beamIntensity})`);
        outerGlow.addColorStop(1, "rgba(255,150,50,0)");
        ctx.fillStyle = outerGlow;
        ctx.fillRect(0, 0, w, h);

        // Core beam (cone upward)
        ctx.globalAlpha = beamIntensity * 0.3;
        const beamGrad = ctx.createLinearGradient(cx, motorcycleY - 15, cx, motorcycleY - h * 0.55);
        beamGrad.addColorStop(0, "rgba(255,240,200,0.35)");
        beamGrad.addColorStop(0.3, "rgba(255,220,150,0.12)");
        beamGrad.addColorStop(1, "rgba(255,200,100,0)");
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(cx - 30, motorcycleY - 15);
        ctx.lineTo(cx - w * 0.35, motorcycleY - h * 0.55);
        ctx.lineTo(cx + w * 0.35, motorcycleY - h * 0.55);
        ctx.lineTo(cx + 30, motorcycleY - 15);
        ctx.closePath();
        ctx.fill();

        // Bright center point
        const core = ctx.createRadialGradient(cx, motorcycleY - 5, 0, cx, motorcycleY - 5, 8);
        core.addColorStop(0, `rgba(255,255,240,${0.7 * beamIntensity})`);
        core.addColorStop(1, "rgba(255,255,240,0)");
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(cx, motorcycleY - 5, 8, 0, Math.PI * 2);
        ctx.fill();

        // Lens flare
        ctx.globalAlpha = beamIntensity * 0.2;
        const flare = ctx.createRadialGradient(cx, motorcycleY - 5, 0, cx, motorcycleY - 5, 60);
        flare.addColorStop(0, "rgba(255,255,255,0.25)");
        flare.addColorStop(0.15, "rgba(255,240,200,0.12)");
        flare.addColorStop(1, "rgba(255,200,100,0)");
        ctx.fillStyle = flare;
        ctx.beginPath();
        ctx.arc(cx, motorcycleY - 5, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // ── Floor reflection ──
      ctx.save();
      ctx.globalAlpha = 0.04 + p * 0.03;
      const floor = ctx.createLinearGradient(0, motorcycleY + 55, 0, motorcycleY + 160);
      floor.addColorStop(0, "rgba(100,100,100,0.25)");
      floor.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = floor;
      ctx.fillRect(cx - w * 0.35, motorcycleY + 55, w * 0.7, 105);
      ctx.restore();

      // ── Dust particles (rise with scroll) ──
      if (p > 0.05) {
        ctx.save();
        const dustCount = Math.floor(15 + p * 20);
        for (let i = 0; i < dustCount; i++) {
          const seed = i * 137.508 + p * 300;
          const dx = ((Math.sin(seed) * 0.5 + 0.5) * w * 0.7) + w * 0.15;
          const dy = ((Math.cos(seed * 0.7) * 0.5 + 0.5) * h * 0.4) + h * 0.1;
          const ds = 1 + Math.sin(seed * 0.3) * 0.5;
          const da = 0.08 * p * (0.3 + 0.7 * Math.sin(seed * 0.5));
          ctx.fillStyle = `rgba(200,200,200,${da})`;
          ctx.beginPath();
          ctx.arc(dx, dy, ds, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // ── Subtle vignette (always present, deepens slightly) ──
      const vignette = ctx.createRadialGradient(cx, h * 0.5, w * 0.3, cx, h * 0.5, w * 0.8);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(0.7, `rgba(0,0,0,${0.15 + p * 0.1})`);
      vignette.addColorStop(1, `rgba(0,0,0,${0.35 + p * 0.15})`);
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    },
    [],
  );

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

    draw(ctx, progress, width, height);
  }, [progress, width, height, draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ width, height }}
      aria-hidden
    />
  );
}
