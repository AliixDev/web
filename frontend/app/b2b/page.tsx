// frontend/app/b2b/page.tsx

import type { Metadata } from "next";
import B2BShell from "@/components/b2b/B2BShell";

export const metadata: Metadata = {
  title: "Wholesale & B2B",
  description:
    "SDB WEAR wholesale purchasing for businesses — moto suits, moto gloves, moto shoes, leather jackets, and handcrafted stitched gloves for retailers and distributors.",
  openGraph: {
    title: "SDB WEAR Wholesale | B2B",
    description:
      "Wholesale and B2B purchasing from SDB WEAR. Premium motorcycle protection and leather gear for retailers and businesses.",
    type: "website",
  },
};

export default function B2BPage() {
  return <B2BShell />;
}
