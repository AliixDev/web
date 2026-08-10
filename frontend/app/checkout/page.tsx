// frontend/app/checkout/page.tsx

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import CheckoutForm from "@/components/CheckoutForm";

export default function CheckoutPage() {
  return (
    <div className="container py-10 md:py-14">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-neutral-400">
        <Link href="/" className="transition-colors hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" aria-hidden />
        <Link href="/cart" className="transition-colors hover:text-foreground">Cart</Link>
        <ChevronRight className="h-3 w-3" aria-hidden />
        <span className="text-foreground">Checkout</span>
      </nav>

      <div className="mt-6">
        <p className="eyebrow text-neutral-400">Almost there</p>
        <h1 className="mt-2 text-4xl font-light tracking-tight md:text-5xl">Checkout</h1>
      </div>

      <div className="mt-10">
        <CheckoutForm />
      </div>
    </div>
  );
}
