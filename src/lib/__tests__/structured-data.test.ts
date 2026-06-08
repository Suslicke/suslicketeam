import { describe, expect, test } from "vitest";

import {
  breadcrumbLd,
  faqLd,
  localBusinessLd,
  organizationLd,
  personLd,
  serviceLd,
  websiteLd,
} from "../structured-data";

const builders = {
  organizationLd: organizationLd(),
  localBusinessLd: localBusinessLd(),
  personLd: personLd(),
  websiteLd: websiteLd(),
};

describe("structured-data builders", () => {
  for (const [name, ld] of Object.entries(builders)) {
    test(`${name} has @context and @type`, () => {
      expect(ld["@context"]).toBe("https://schema.org");
      expect(typeof ld["@type"]).toBe("string");
      expect(ld["@type"].length).toBeGreaterThan(0);
    });
  }

  test("organizationLd is an Organization", () => {
    expect(organizationLd()["@type"]).toBe("Organization");
  });

  test("localBusinessLd serves Kazakhstan in ru/kk/en", () => {
    const ld = localBusinessLd();
    expect(ld["@type"]).toBe("LocalBusiness");
    expect(ld.areaServed.name).toBe("Kazakhstan");
    expect(ld.inLanguage).toEqual(["ru", "kk", "en"]);
  });

  test("personLd founder is Andrei Pustovoi", () => {
    const ld = personLd();
    expect(ld["@type"]).toBe("Person");
    expect(ld.name).toBe("Andrei Pustovoi");
  });

  test("websiteLd has no SearchAction", () => {
    const ld = websiteLd();
    expect(ld["@type"]).toBe("WebSite");
    expect("potentialAction" in ld).toBe(false);
  });

  test("breadcrumbLd builds an ordered ListItem list", () => {
    const ld = breadcrumbLd([
      { name: "Home", url: "https://suslicketeam.com/en" },
      { name: "Services", url: "https://suslicketeam.com/en/services" },
    ]);

    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement).toHaveLength(2);
    expect(ld.itemListElement[0]).toMatchObject({
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://suslicketeam.com/en",
    });
    expect(ld.itemListElement[1].position).toBe(2);
  });

  test("serviceLd carries name/description/url and provider", () => {
    const ld = serviceLd({
      name: "Landing pages",
      description: "Fast landings",
      url: "https://suslicketeam.com/en/services/landing",
    });

    expect(ld["@type"]).toBe("Service");
    expect(ld.name).toBe("Landing pages");
    expect(ld.description).toBe("Fast landings");
    expect(ld.url).toBe("https://suslicketeam.com/en/services/landing");
    expect(ld.provider["@type"]).toBe("Organization");
  });

  test("faqLd builds a Question/Answer mainEntity list", () => {
    const ld = faqLd([
      { question: "Q1?", answer: "A1" },
      { question: "Q2?", answer: "A2" },
    ]);

    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(2);
    expect(ld.mainEntity[0]).toMatchObject({
      "@type": "Question",
      name: "Q1?",
      acceptedAnswer: { "@type": "Answer", text: "A1" },
    });
  });
});
