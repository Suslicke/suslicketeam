import { describe, expect, test } from "vitest";
import { leadSchema, type LeadInput } from "../lead-schema";

const valid = {
  name: "Иван",
  contact: "+77066998879",
  projectType: "landing" as const,
};

describe("leadSchema", () => {
  test("parses valid input", () => {
    const result = leadSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  test("parses valid input with optional fields", () => {
    const result = leadSchema.safeParse({
      ...valid,
      message: "Нужен лендинг",
      page: "/ru/services/landing",
      utm: { utm_source: "instagram" },
    });
    expect(result.success).toBe(true);
  });

  test("fails when name too short", () => {
    const result = leadSchema.safeParse({ ...valid, name: "И" });
    expect(result.success).toBe(false);
  });

  test("fails when contact missing", () => {
    const { contact: _omit, ...withoutContact } = valid;
    const result = leadSchema.safeParse(withoutContact);
    expect(result.success).toBe(false);
  });

  test("fails when contact empty", () => {
    const result = leadSchema.safeParse({ ...valid, contact: "" });
    expect(result.success).toBe(false);
  });

  test("fails on invalid projectType", () => {
    const result = leadSchema.safeParse({ ...valid, projectType: "nope" });
    expect(result.success).toBe(false);
  });

  test("accepts all known project types", () => {
    for (const projectType of [
      "landing",
      "web-apps",
      "ai",
      "mobile",
      "seo",
      "other",
    ]) {
      expect(leadSchema.safeParse({ ...valid, projectType }).success).toBe(true);
    }
  });

  test("fails when honeypot (company) filled", () => {
    const result = leadSchema.safeParse({ ...valid, company: "spam" });
    expect(result.success).toBe(false);
  });

  test("passes when honeypot empty", () => {
    expect(leadSchema.safeParse({ ...valid, company: "" }).success).toBe(true);
  });

  test("passes when honeypot absent", () => {
    expect(leadSchema.safeParse(valid).success).toBe(true);
  });

  test("LeadInput type is usable", () => {
    const input: LeadInput = valid;
    expect(input.name).toBe("Иван");
  });
});
