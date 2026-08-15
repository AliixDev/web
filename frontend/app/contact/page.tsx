// frontend/app/contact/page.tsx

"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Mail, MapPin, Phone } from "lucide-react";
import Reveal from "@/components/Reveal";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Contact form is presentational — no backend endpoint is wired yet.
    // When ready, connect to Supabase Edge Function or Resend.
    setSubmitted(true);
  }

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <p className="eyebrow">Get in touch</p>
            <h1 className="mt-3 text-[32px] font-light leading-[1.08] tracking-tight md:text-[42px]">
              Contact us
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.75] text-neutral-600">
              Have a question about an order, a product, or a wholesale inquiry? We&apos;re here to help.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl">
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
              {/* Contact form */}
              <Reveal>
                <div>
                  <h2 className="font-display text-xl font-medium tracking-tight">Send us a message</h2>
                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="contact-name"
                        className="text-[13px] font-medium text-neutral-700"
                      >
                        Full name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        className="h-11 w-full border border-neutral-200 bg-background px-3.5 text-[13px] placeholder:text-neutral-400 focus:border-foreground focus:outline-none focus:ring-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="contact-email"
                        className="text-[13px] font-medium text-neutral-700"
                      >
                        Email address
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        className="h-11 w-full border border-neutral-200 bg-background px-3.5 text-[13px] placeholder:text-neutral-400 focus:border-foreground focus:outline-none focus:ring-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="contact-subject"
                        className="text-[13px] font-medium text-neutral-700"
                      >
                        Subject
                      </label>
                      <input
                        id="contact-subject"
                        type="text"
                        required
                        placeholder="Order inquiry, product question, etc."
                        className="h-11 w-full border border-neutral-200 bg-background px-3.5 text-[13px] placeholder:text-neutral-400 focus:border-foreground focus:outline-none focus:ring-0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="contact-message"
                        className="text-[13px] font-medium text-neutral-700"
                      >
                        Message
                      </label>
                      <textarea
                        id="contact-message"
                        required
                        rows={5}
                        className="w-full border border-neutral-200 bg-background px-3.5 py-3 text-[13px] placeholder:text-neutral-400 focus:border-foreground focus:outline-none focus:ring-0"
                      />
                    </div>

                    {submitted ? (
                      <div className="flex items-center gap-2 text-[13px] text-neutral-600">
                        <Check className="h-4 w-4" aria-hidden /> Message noted — we&apos;ll get back
                        to you soon.
                      </div>
                    ) : (
                      <button
                        type="submit"
                        className="btn-press inline-flex h-11 items-center gap-2 bg-foreground px-6 text-[13px] font-medium text-background transition-opacity hover:opacity-85"
                      >
                        Send message <ArrowRight className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </form>
                </div>
              </Reveal>

              {/* Contact details */}
              <Reveal delay={80}>
                <div className="space-y-8">
                  <div>
                    <h2 className="font-display text-xl font-medium tracking-tight">Reach us directly</h2>
                    <p className="mt-3 text-[13px] leading-[1.7] text-neutral-600">
                      For order issues, product questions, or wholesale inquiries, use the details below.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-start gap-3.5">
                      <Mail className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" strokeWidth={1.25} aria-hidden />
                      <div>
                        <p className="text-[13px] font-medium">Email</p>
                        <p className="mt-0.5 text-[13px] text-neutral-600">[PRIVACY EMAIL]</p>
                        <p className="mt-0.5 text-[12px] text-neutral-400">
                          We aim to respond within 1–2 business days.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <Phone className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" strokeWidth={1.25} aria-hidden />
                      <div>
                        <p className="text-[13px] font-medium">Phone</p>
                        <p className="mt-0.5 text-[13px] text-neutral-600">[PHONE NUMBER]</p>
                        <p className="mt-0.5 text-[12px] text-neutral-400">
                          Available during business hours.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" strokeWidth={1.25} aria-hidden />
                      <div>
                        <p className="text-[13px] font-medium">Address</p>
                        <p className="mt-0.5 text-[13px] text-neutral-600">[BUSINESS ADDRESS]</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 pt-6">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                      Wholesale inquiries
                    </p>
                    <p className="mt-2 text-[13px] leading-[1.7] text-neutral-600">
                      For bulk or business orders, visit our{" "}
                      <a href="https://b2b.sdbbuy.com" className="underline underline-offset-2 transition-colors hover:text-foreground">
                        wholesale page
                      </a>{" "}
                      or email us directly.
                    </p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
