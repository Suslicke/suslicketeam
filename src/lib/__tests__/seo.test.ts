import { describe, expect, test } from "vitest";

import { buildMetadata } from "../seo";
import { siteConfig } from "../config";

describe("buildMetadata", () => {
  test("passes through title and description", () => {
    const meta = buildMetadata({
      locale: "ru",
      path: "",
      title: "Главная",
      description: "Описание",
    });

    expect(meta.title).toBe("Главная");
    expect(meta.description).toBe("Описание");
  });

  test("sets metadataBase from siteConfig.url", () => {
    const meta = buildMetadata({
      locale: "ru",
      path: "",
      title: "t",
      description: "d",
    });

    expect(meta.metadataBase).toBeInstanceOf(URL);
    expect(meta.metadataBase?.toString()).toBe(new URL(siteConfig.url).toString());
  });

  test("canonical points to /<locale><path>", () => {
    const meta = buildMetadata({
      locale: "en",
      path: "/services",
      title: "t",
      description: "d",
    });

    expect(meta.alternates?.canonical).toBe("/en/services");
  });

  test("canonical for home is just /<locale>", () => {
    const meta = buildMetadata({
      locale: "kk",
      path: "",
      title: "t",
      description: "d",
    });

    expect(meta.alternates?.canonical).toBe("/kk");
  });

  test("languages map contains every locale with correct paths", () => {
    const meta = buildMetadata({
      locale: "ru",
      path: "/cases/loyrush",
      title: "t",
      description: "d",
    });

    const languages = meta.alternates?.languages as Record<string, string>;
    expect(languages.ru).toBe("/ru/cases/loyrush");
    expect(languages.kk).toBe("/kk/cases/loyrush");
    expect(languages.en).toBe("/en/cases/loyrush");
  });

  test("languages map includes x-default pointing to the defaultLocale path", () => {
    const meta = buildMetadata({
      locale: "en",
      path: "/about",
      title: "t",
      description: "d",
    });

    const languages = meta.alternates?.languages as Record<string, string>;
    expect(languages["x-default"]).toBe(`/${siteConfig.defaultLocale}/about`);
  });

  test("openGraph carries title, description, url, siteName and og locale", () => {
    const meta = buildMetadata({
      locale: "kk",
      path: "/services",
      title: "Қызметтер",
      description: "Сипаттама",
    });

    expect(meta.openGraph?.title).toBe("Қызметтер");
    expect(meta.openGraph?.description).toBe("Сипаттама");
    expect(meta.openGraph?.url).toBe("/kk/services");
    expect(meta.openGraph?.siteName).toBe("suslicketeam");
    // kk maps to kk_KZ for OpenGraph locale.
    expect((meta.openGraph as { locale?: string }).locale).toBe("kk_KZ");
  });

  test("twitter uses summary_large_image and passes title/description", () => {
    const meta = buildMetadata({
      locale: "ru",
      path: "",
      title: "Главная",
      description: "Описание",
    });

    expect((meta.twitter as { card?: string }).card).toBe("summary_large_image");
    expect(meta.twitter?.title).toBe("Главная");
    expect(meta.twitter?.description).toBe("Описание");
  });

  test("defaults og image to per-locale opengraph-image route when none provided", () => {
    const meta = buildMetadata({
      locale: "en",
      path: "/services",
      title: "t",
      description: "d",
    });

    const images = meta.openGraph?.images as Array<{ url: string }>;
    expect(images[0].url).toBe("/en/opengraph-image");
  });

  test("passes through provided images", () => {
    const meta = buildMetadata({
      locale: "en",
      path: "/services",
      title: "t",
      description: "d",
      images: ["/custom-og.png"],
    });

    expect(meta.openGraph?.images).toEqual(["/custom-og.png"]);
    expect(meta.twitter?.images).toEqual(["/custom-og.png"]);
  });

  test("og locale mapping: ru -> ru_RU, en -> en_US", () => {
    expect(
      (
        buildMetadata({ locale: "ru", path: "", title: "t", description: "d" })
          .openGraph as { locale?: string }
      ).locale,
    ).toBe("ru_RU");
    expect(
      (
        buildMetadata({ locale: "en", path: "", title: "t", description: "d" })
          .openGraph as { locale?: string }
      ).locale,
    ).toBe("en_US");
  });
});
