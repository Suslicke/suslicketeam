import { describe, expect, test } from "vitest";

import {
  getCaseBySlug,
  getCases,
  getFeaturedCases,
  getPublicCases,
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
  test("returns all 11 cases", () => {
    expect(getCases()).toHaveLength(11);
  });

  test("the NDA case is confidential with no public url", () => {
    const nda = getCaseBySlug("nda-furniture");
    expect(nda?.nda).toBe(true);
    expect(nda?.url).toBe("");
  });

  test("getPublicCases excludes the NDA cases", () => {
    const publicCases = getPublicCases();
    expect(publicCases).toHaveLength(9);
    expect(publicCases.some((c) => c.slug === "nda-furniture")).toBe(false);
    expect(publicCases.some((c) => c.slug === "nda-school")).toBe(false);
    expect(publicCases.every((c) => c.url)).toBe(true);
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
