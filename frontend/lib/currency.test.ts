// frontend/lib/currency.test.ts

import { describe, expect, it } from "vitest";
import { formatMoney, priceForCurrency } from "./currency";

describe("formatMoney", () => {
  it("formats USD cents as dollars with 2 decimals", () => {
    expect(formatMoney(0, "USD")).toBe("$0");
    expect(formatMoney(12345, "USD")).toBe("$123.45");
    expect(formatMoney(100000, "USD")).toBe("$1,000");
  });

  it("formats PKR paisa as rupees", () => {
    // Intl may emit a regular or non-breaking space between symbol and amount
    // PKR uses 2 decimal places in Intl formatting
    expect(formatMoney(0, "PKR")).toMatch(/^Rs\s0$/);
    expect(formatMoney(12345, "PKR")).toMatch(/^Rs\s123.45$/);
    expect(formatMoney(100000, "PKR")).toMatch(/^Rs\s1,000$/);
  });

  it("never produces floating point artifacts for minor units", () => {
    // 1.999 * 100 should not round-trip as $2.00 via float math on values
    expect(formatMoney(199, "USD")).toBe("$1.99");
    expect(formatMoney(995, "USD")).toBe("$9.95");
  });
});

describe("priceForCurrency", () => {
  it("picks the USD field when currency is USD", () => {
    expect(priceForCurrency("USD", 2500, 450000)).toBe(2500);
  });

  it("picks the PKR field when currency is PKR", () => {
    expect(priceForCurrency("PKR", 2500, 450000)).toBe(450000);
  });
});
