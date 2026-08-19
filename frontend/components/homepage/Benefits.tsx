// frontend/components/homepage/Benefits.tsx
"use client";

import { Truck, RotateCcw, Lock, Shield } from "lucide-react";
import Reveal from "@/components/Reveal";

const BENEFITS = [
  {
    icon: Truck,
    title: "Free Shipping",
    body: "On qualifying orders worldwide.",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    body: "30-day return policy on all gear.",
  },
  {
    icon: Lock,
    title: "Secure Payment",
    body: "Protected checkout via Stripe.",
  },
  {
    icon: Shield,
    title: "Premium Quality",
    body: "Built for serious riders.",
  },
] as const;

export default function Benefits() {
  return (
    <section className="border-b border-neutral-800 bg-[#080808]">
      <div className="container py-14 md:py-16">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((item, index) => (
            <Reveal key={item.title} delay={index * 80}>
              <div className="border-t border-neutral-700 pt-5">
                <item.icon className="h-5 w-5 text-neutral-500" strokeWidth={1.25} aria-hidden />
                <h3 className="mt-3 font-display text-[15px] font-medium tracking-tight text-white">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[12px] leading-[1.7] text-neutral-500">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
