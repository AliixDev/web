// frontend/app/size-guide/page.tsx

import type { Metadata } from "next";
import PolicyLayout from "@/components/layout/PolicyLayout";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Size Guide",
  description:
    "SDBBUY size guide — find the right fit for leather garments, motorbike gear, boxing gear, and gym wear.",
  openGraph: {
    title: "Size Guide · SDBBUY",
    description: "How to find the right size for SDBBUY products.",
    type: "website",
  },
};

const SIZE_TABLES = [
  {
    title: "Leather Jackets & Outerwear",
    sizes: [
      { label: "S", chest: "36–38\"", waist: "30–32\"" },
      { label: "M", chest: "38–40\"", waist: "32–34\"" },
      { label: "L", chest: "40–42\"", waist: "34–36\"" },
      { label: "XL", chest: "42–44\"", waist: "36–38\"" },
      { label: "XXL", chest: "44–46\"", waist: "38–40\"" },
    ],
  },
  {
    title: "T-Shirts & Tops",
    sizes: [
      { label: "S", chest: "34–36\"", length: "27\"" },
      { label: "M", chest: "38–40\"", length: "28\"" },
      { label: "L", chest: "42–44\"", length: "29\"" },
      { label: "XL", chest: "44–46\"", length: "30\"" },
    ],
  },
  {
    title: "Boxing Gloves",
    sizes: [
      { label: "8 oz", weight: "Junior / petite frames" },
      { label: "10 oz", weight: "Competition / light training" },
      { label: "12 oz", weight: "General training" },
      { label: "14 oz", weight: "Sparring" },
      { label: "16 oz", weight: "Heavy sparring / larger frames" },
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
                    {"weight" in table.sizes[0] && (
                      <th className="py-2.5 pr-4 font-medium text-foreground">Recommended for</th>
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
                      {"weight" in row && (
                        <td className="py-2.5 pr-4 text-neutral-600">{row.weight}</td>
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
