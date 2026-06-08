import { describe, expect, test } from "vitest";

import {
  getCaseBySlug,
  getCases,
  getFeaturedCases,
  getServiceBySlug,
  getServices,
} from "../content";

describe("services content", () => {
  test("returns all 5 services", () => {
    expect(getServices()).toHaveLength(5);
  });

  test("services are sorted by order", () => {
    const orders = getServices().map((s) => s.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  test("getServiceBySlug finds a known service", () => {
    expect(getServiceBySlug("ai")?.slug).toBe("ai");
  });

  test("getServiceBySlug returns undefined for unknown slug", () => {
    expect(getServiceBySlug("nope")).toBeUndefined();
  });
});

describe("cases content", () => {
  test("returns all 8 cases", () => {
    expect(getCases()).toHaveLength(8);
  });

  test("returns exactly 4 featured cases", () => {
    const featured = getFeaturedCases().map((c) => c.slug).sort();
    expect(featured).toEqual([
      "ai-diagnostic",
      "exchange-bridge",
      "loyrush",
      "xaid",
    ]);
  });

  test("featured cases are all flagged featured", () => {
    expect(getFeaturedCases().every((c) => c.featured)).toBe(true);
  });

  test("getCaseBySlug finds a known case", () => {
    expect(getCaseBySlug("loyrush")?.url).toBe("https://loyrush.com");
  });

  test("getCaseBySlug returns undefined for unknown slug", () => {
    expect(getCaseBySlug("nope")).toBeUndefined();
  });
});
