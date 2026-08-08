// frontend/app/checkout/page.tsx

import CheckoutForm from "@/components/CheckoutForm";

export default function CheckoutPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
