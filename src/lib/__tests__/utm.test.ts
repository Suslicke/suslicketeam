import { beforeEach, describe, expect, test } from "vitest";
import { getStoredUtm, parseUtm, persistUtm, type UtmParams } from "../utm";

describe("parseUtm", () => {
  test("extracts all known utm params", () => {
    const result = parseUtm(
      "?utm_source=instagram&utm_medium=social&utm_campaign=jan&utm_content=story&utm_term=ai",
    );
    expect(result).toEqual({
      utm_source: "instagram",
      utm_medium: "social",
      utm_campaign: "jan",
      utm_content: "story",
      utm_term: "ai",
    });
  });

  test("works without leading ?", () => {
    expect(parseUtm("utm_source=google")).toEqual({ utm_source: "google" });
  });

  test("extracts click ids gclid and fbclid", () => {
    expect(parseUtm("?gclid=abc123&fbclid=xyz789")).toEqual({
      gclid: "abc123",
      fbclid: "xyz789",
    });
  });

  test("ignores unknown params", () => {
    expect(parseUtm("?utm_source=instagram&foo=bar&ref=somewhere")).toEqual({
      utm_source: "instagram",
    });
  });

  test("drops empty values", () => {
    expect(parseUtm("?utm_source=&utm_medium=social")).toEqual({
      utm_medium: "social",
    });
  });

  test("returns empty object when none present", () => {
    expect(parseUtm("")).toEqual({});
    expect(parseUtm("?")).toEqual({});
    expect(parseUtm("?foo=bar")).toEqual({});
  });
});

describe("persistUtm / getStoredUtm", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test("persist then read roundtrip", () => {
    persistUtm("?utm_source=instagram&utm_campaign=jan");
    const stored = getStoredUtm();
    expect(stored).toEqual({
      utm_source: "instagram",
      utm_campaign: "jan",
    });
  });

  test("first-touch wins: does not overwrite existing", () => {
    persistUtm("?utm_source=instagram");
    persistUtm("?utm_source=google&utm_medium=cpc");
    expect(getStoredUtm()).toEqual({ utm_source: "instagram" });
  });

  test("overwrites when stored value is empty", () => {
    // empty parse should not lock out a later real value
    persistUtm("?foo=bar"); // parses to {}
    persistUtm("?utm_source=google");
    expect(getStoredUtm()).toEqual({ utm_source: "google" });
  });

  test("getStoredUtm returns {} when nothing stored", () => {
    expect(getStoredUtm()).toEqual({});
  });

  test("getStoredUtm returns {} on invalid JSON", () => {
    sessionStorage.setItem("sl_utm", "not-json{");
    expect(getStoredUtm()).toEqual({});
  });
});

describe("SSR guards", () => {
  test("persistUtm and getStoredUtm don't throw when window is undefined", () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error simulate SSR
    delete globalThis.window;
    try {
      expect(() => persistUtm("?utm_source=instagram")).not.toThrow();
      expect(getStoredUtm()).toEqual({});
    } finally {
      globalThis.window = originalWindow;
    }
  });
});

describe("UtmParams type", () => {
  test("is a partial record of known keys", () => {
    const p: UtmParams = { utm_source: "x" };
    expect(p.utm_source).toBe("x");
  });
});
