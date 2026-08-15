// frontend/lib/seller.test.ts

import { describe, expect, it, vi } from "vitest";
import {
  dateRangeFor,
  downloadCSV,
  fromMinor,
  groupByDay,
  inRange,
  slugify,
  sumByCurrency,
  toCSV,
  toMinor,
} from "./seller";

const NOW = new Date(2026, 7, 11, 14, 30); // 11 Aug 2026

describe("sumByCurrency", () => {
  it("sums totals per currency", () => {
    const result = sumByCurrency([
      { currency: "USD", total_minor: 1000 },
      { currency: "USD", total_minor: 2500 },
      { currency: "PKR", total_minor: 50000 },
    ]);
    expect(result.USD).toBe(3500);
    expect(result.PKR).toBe(50000);
  });

  it("handles empty input", () => {
    const result = sumByCurrency([]);
    expect(result.USD).toBe(0);
    expect(result.PKR).toBe(0);
  });
});

describe("dateRangeFor", () => {
  it("today spans midnight to midnight", () => {
    const range = dateRangeFor("today", NOW);
    expect(range.start.toISOString()).toBe("2026-08-11T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-08-12T00:00:00.000Z");
  });

  it("yesterday covers the previous day", () => {
    const range = dateRangeFor("yesterday", NOW);
    expect(range.start.toISOString()).toBe("2026-08-10T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-08-11T00:00:00.000Z");
  });

  it("7d includes six prior days plus today", () => {
    const range = dateRangeFor("7d", NOW);
    expect(range.start.toISOString()).toBe("2026-08-05T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-08-12T00:00:00.000Z");
  });

  it("month starts at the first of the month", () => {
    const range = dateRangeFor("month", NOW);
    expect(range.start.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });
});

describe("inRange", () => {
  it("includes start and excludes end", () => {
    const range = dateRangeFor("today", NOW);
    expect(inRange("2026-08-11T00:00:00.000Z", range)).toBe(true);
    expect(inRange("2026-08-11T23:59:59.000Z", range)).toBe(true);
    expect(inRange("2026-08-12T00:00:00.000Z", range)).toBe(false);
  });
});

describe("groupByDay", () => {
  it("buckets values into one bucket per day in order", () => {
    const range = { start: new Date("2026-08-01T00:00:00Z"), end: new Date("2026-08-04T00:00:00Z") };
    const buckets = groupByDay(
      [
        { at: "2026-08-01T10:00:00Z", value: 10 },
        { at: "2026-08-01T22:00:00Z", value: 5 },
        { at: "2026-08-03T08:00:00Z", value: 20 },
        { at: "2026-08-05T08:00:00Z", value: 99 }, // outside range
      ],
      range,
    );
    expect(buckets).toHaveLength(3);
    expect(buckets[0].value).toBe(15);
    expect(buckets[1].value).toBe(0);
    expect(buckets[2].value).toBe(20);
  });
});

describe("money conversion", () => {
  it("converts major to minor with rounding", () => {
    expect(toMinor(29.0)).toBe(2900);
    expect(toMinor(0.99)).toBe(99);
    expect(toMinor(1249.99)).toBe(124999);
  });

  it("converts minor to major", () => {
    expect(fromMinor(2900)).toBe(29);
    expect(fromMinor(124999)).toBe(1249.99);
  });
});

describe("slugify", () => {
  it("lowercases and dashes", () => {
    expect(slugify("Embroidered Lawn Kurta")).toBe("embroidered-lawn-kurta");
    expect(slugify("  Wireless Earbuds Pro  ")).toBe("wireless-earbuds-pro");
    expect(slugify("Café (Special)")).toBe("caf-special");
  });
});

describe("toCSV", () => {
  it("emits a header row and escaped values", () => {
    const csv = toCSV([
      { name: "Kurta, Embroidered", qty: 2 },
      { name: "Rug", qty: null },
    ]);
    expect(csv).toBe('name,qty\n"Kurta, Embroidered",2\nRug,');
  });

  it("returns an empty string for no rows", () => {
    expect(toCSV([])).toBe("");
  });
});

describe("downloadCSV", () => {
  it("creates and clicks a download anchor", () => {
    const click = vi.fn();
    const originalCreate = document.createElement.bind(document);
    // jsdom doesn't implement object URLs — provide them when missing.
    if (typeof URL.createObjectURL !== "function") {
      (URL as unknown as { createObjectURL: () => string }).createObjectURL = () => "blob:mock";
    }
    if (typeof URL.revokeObjectURL !== "function") {
      (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = () => undefined;
    }
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = originalCreate(tag);
      if (tag === "a") el.click = click;
      return el;
    });
    downloadCSV("report.csv", "a,b\n1,2");
    expect(click).toHaveBeenCalledOnce();
    vi.restoreAllMocks();
  });
});
