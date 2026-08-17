// frontend/app/size-guide/page.tsx

import type { Metadata } from "next";
import PolicyLayout from "@/components/layout/PolicyLayout";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Size Guide",
  description:
    "SDB WEAR size guide — find the right fit for moto suits, leather jackets, gloves, and riding footwear.",
  openGraph: {
    title: "Size Guide · SDB WEAR",
    description: "How to find the right size for SDB WEAR products.",
    type: "website",
  },
};

const SIZE_TABLES = [
  {
    title: "Leather Jackets & Vests",
    sizes: [
      { label: "S", chest: "36–38\"", waist: "30–32\"" },
      { label: "M", chest: "38–40\"", waist: "32–34\"" },
      { label: "L", chest: "40–42\"", waist: "34–36\"" },
      { label: "XL", chest: "42–44\"", waist: "36–38\"" },
      { label: "XXL", chest: "44–46\"", waist: "38–40\"" },
    ],
  },
  {
    title: "Moto Suits (One-Piece & Two-Piece)",
    sizes: [
      { label: "S", chest: "36–38\"", length: "58–62\"" },
      { label: "M", chest: "38–40\"", length: "62–66\"" },
      { label: "L", chest: "40–42\"", length: "66–70\"" },
      { label: "XL", chest: "42–44\"", length: "70–74\"" },
      { label: "XXL", chest: "44–46\"", length: "74–78\"" },
    ],
  },
  {
    title: "Moto Gloves & Handcrafted Gloves",
    sizes: [
      { label: "S", hand: "18–20 cm" },
      { label: "M", hand: "20–22 cm" },
      { label: "L", hand: "22–24 cm" },
      { label: "XL", hand: "24–26 cm" },
    ],
  },
  {
    title: "Moto Shoes & Boots",
    sizes: [
      { label: "EU 40", foot: "25.5 cm" },
      { label: "EU 42", foot: "26.5 cm" },
      { label: "EU 44", foot: "27.5 cm" },
      { label: "EU 46", foot: "28.5 cm" },
    ],
  },
];

export default function SizeGuidePage() {
  return (
    <PolicyLayout eyebrow="Help" title="Size guide">
      <p>
        Use the measurements below to find your best fit. All measurements are approximate and
        may vary slightly by product. If you&apos;re between sizes, we recommend sizing up for a
        more comfortable fit.
      </p>

      <p className="text-[12px] italic text-neutral-500">
        [SIZES ARE APPROXIMATE — BUSINESS TO CONFIRM with actual product spec sheets.]
      </p>

      {SIZE_TABLES.map((table) => (
        <Reveal key={table.title}>
          <section>
            <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
              {table.title}
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="py-2.5 pr-4 font-medium text-foreground">Size</th>
                    {"chest" in table.sizes[0] && (
                      <th className="py-2.5 pr-4 font-medium text-foreground">Chest</th>
                    )}
                    {"waist" in table.sizes[0] && (
                      <th className="py-2.5 pr-4 font-medium text-foreground">Waist</th>
                    )}
                    {"length" in table.sizes[0] && (
                      <th className="py-2.5 pr-4 font-medium text-foreground">Length</th>
                    )}
                    {"hand" in table.sizes[0] && (
                      <th className="py-2.5 pr-4 font-medium text-foreground">Hand circumference</th>
                    )}
                    {"foot" in table.sizes[0] && (
                      <th className="py-2.5 pr-4 font-medium text-foreground">Foot length</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {table.sizes.map((row) => (
                    <tr key={row.label} className="border-b border-neutral-100">
                      <td className="py-2.5 pr-4 font-medium">{row.label}</td>
                      {"chest" in row && (
                        <td className="py-2.5 pr-4 text-neutral-600">{row.chest}</td>
                      )}
                      {"waist" in row && (
                        <td className="py-2.5 pr-4 text-neutral-600">{row.waist}</td>
                      )}
                      {"length" in row && (
                        <td className="py-2.5 pr-4 text-neutral-600">{row.length}</td>
                      )}
                      {"hand" in row && (
                        <td className="py-2.5 pr-4 text-neutral-600">{row.hand}</td>
                      )}
                      {"foot" in row && (
                        <td className="py-2.5 pr-4 text-neutral-600">{row.foot}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </Reveal>
      ))}

      <section>
        <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
          How to measure
        </h2>
        <ul className="mt-3 space-y-2 text-[13px] leading-[1.7] text-neutral-600">
          <li>
            <strong>Chest:</strong> measure around the fullest part of your chest, keeping the
            tape level.
          </li>
          <li>
            <strong>Waist:</strong> measure around your natural waistline, the narrowest part of
            your torso.
          </li>
          <li>
            <strong>Length:</strong> measured from the highest point of the shoulder to the
            hem.
          </li>
        </ul>
      </section>

      <section>
        <p className="text-[13px] text-neutral-600">
          Need help choosing a size?{" "}
          <a href="/contact" className="underline underline-offset-2 transition-colors hover:text-foreground">
            Contact us
          </a>{" "}
          and we&apos;ll help you find the right fit.
        </p>
      </section>
    </PolicyLayout>
  );
}
