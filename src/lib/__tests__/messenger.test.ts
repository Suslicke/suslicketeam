import { describe, expect, test } from "vitest";
import { buildTelegramUrl, buildWhatsappUrl } from "../messenger";

describe("buildWhatsappUrl", () => {
  test("strips all non-digits from number", () => {
    const url = buildWhatsappUrl({ number: "+7 706 699 88 79", text: "hi" });
    expect(url.startsWith("https://wa.me/77066998879?text=")).toBe(true);
  });

  test("encodes provided text", () => {
    const text = "Привет, мир & co?";
    const url = buildWhatsappUrl({ number: "77066998879", text });
    const query = url.split("?text=")[1];
    expect(query).toBe(encodeURIComponent(text));
    expect(decodeURIComponent(query)).toBe(text);
  });

  test("default greeting embeds page and utm summary", () => {
    const url = buildWhatsappUrl({
      number: "77066998879",
      page: "/ru/services/ai",
      utm: { utm_source: "instagram", utm_campaign: "jan" },
    });
    const decoded = decodeURIComponent(url.split("?text=")[1]);
    expect(decoded).toContain("/ru/services/ai");
    expect(decoded).toContain("instagram");
    expect(decoded).toContain("jan");
  });

  test("default greeting works without page or utm", () => {
    const url = buildWhatsappUrl({ number: "77066998879" });
    const decoded = decodeURIComponent(url.split("?text=")[1]);
    expect(decoded.length).toBeGreaterThan(0);
    expect(url.startsWith("https://wa.me/77066998879?text=")).toBe(true);
  });

  test("explicit text overrides default greeting", () => {
    const url = buildWhatsappUrl({
      number: "77066998879",
      text: "custom",
      page: "/ru",
      utm: { utm_source: "x" },
    });
    expect(decodeURIComponent(url.split("?text=")[1])).toBe("custom");
  });

  test("throws when number has no digits", () => {
    expect(() => buildWhatsappUrl({ number: "N/A", text: "hi" })).toThrow();
    expect(() => buildWhatsappUrl({ number: "", text: "hi" })).toThrow();
  });
});

describe("buildTelegramUrl", () => {
  test("builds url from username", () => {
    expect(buildTelegramUrl({ username: "suslicketeam" })).toBe(
      "https://t.me/suslicketeam",
    );
  });

  test("strips leading @ from username", () => {
    expect(buildTelegramUrl({ username: "@suslicketeam" })).toBe(
      "https://t.me/suslicketeam",
    );
  });

  test("ignores text (t.me does not support prefilled text)", () => {
    expect(buildTelegramUrl({ username: "suslicketeam", text: "hi" })).toBe(
      "https://t.me/suslicketeam",
    );
  });

  test("sanitizes path-traversal / invalid characters", () => {
    expect(buildTelegramUrl({ username: "suslicketeam/../evil" })).toBe(
      "https://t.me/suslicketeamevil",
    );
    expect(() => buildTelegramUrl({ username: "@@@" })).toThrow();
  });
});
