import { describe, expect, test } from "vitest";

import { formatTelegramMessage } from "../lead-format";
import type { LeadInput } from "../lead-schema";

const base: LeadInput = {
  name: "Иван Петров",
  contact: "+77066998879",
  projectType: "landing",
};

describe("formatTelegramMessage", () => {
  test("includes name, contact and project type", () => {
    const msg = formatTelegramMessage(base);
    expect(msg).toContain("Иван Петров");
    expect(msg).toContain("+77066998879");
    expect(msg).toContain("landing");
  });

  test("includes the message when present", () => {
    const msg = formatTelegramMessage({ ...base, message: "Нужен лендинг" });
    expect(msg).toContain("Нужен лендинг");
  });

  test("includes the page when present", () => {
    const msg = formatTelegramMessage({ ...base, page: "/ru/contact" });
    expect(msg).toContain("/ru/contact");
  });

  test("includes utm_source and utm_campaign when present", () => {
    const msg = formatTelegramMessage({
      ...base,
      utm: { utm_source: "instagram", utm_campaign: "jan" },
    });
    expect(msg).toContain("instagram");
    expect(msg).toContain("jan");
  });

  test("omits optional rows when absent", () => {
    const msg = formatTelegramMessage(base);
    // No bare "undefined" / "null" leaking into the plain-text message.
    expect(msg).not.toContain("undefined");
    expect(msg).not.toContain("null");
  });

  test("is plain text with no markdown control characters that could break parsing", () => {
    // We send with no parse_mode (plain text), so even injection-y input is
    // rendered verbatim and cannot break Telegram's formatter.
    const msg = formatTelegramMessage({
      ...base,
      name: "*_`[]() inject",
      message: "<b>html?</b> _italic_ *bold*",
    });
    expect(msg).toContain("*_`[]() inject");
    expect(msg).toContain("<b>html?</b> _italic_ *bold*");
  });

  test("returns a non-empty single string", () => {
    expect(typeof formatTelegramMessage(base)).toBe("string");
    expect(formatTelegramMessage(base).length).toBeGreaterThan(0);
  });
});
