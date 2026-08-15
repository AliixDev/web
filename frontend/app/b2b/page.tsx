// frontend/app/b2b/page.tsx

import type { Metadata } from "next";
import B2BShell from "@/components/b2b/B2BShell";

export const metadata: Metadata = {
  title: "Wholesale & B2B",
  description:
    "SDBBUY wholesale purchasing for businesses — leather garments, fashion apparel, boxing gear, and gym wear for retailers and distributors.",
  openGraph: {
    title: "SDBBUY Wholesale | B2B",
    description:
      "Wholesale and B2B purchasing from SDBBUY. Leather jackets, apparel, boxing gear, and accessories for businesses.",
    type: "website",
  },
};

export default function B2BPage() {
  return <B2BShell />;
}
