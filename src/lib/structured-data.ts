import { siteConfig } from "@/lib/config";

const SCHEMA_CONTEXT = "https://schema.org" as const;
const SITE_NAME = "suslicketeam";

const LANGUAGES = ["ru", "kk", "en"] as const;

/** Organization schema for the site owner. */
export function organizationLd() {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Organization",
    name: SITE_NAME,
    // Registered operator: individual entrepreneur (Georgia). Distinct from the
    // LocalBusiness node, which represents the Almaty/Kazakhstan service area.
    legalName: "Individual Entrepreneur ANDREI PUSTOVOI",
    identifier: "305638389",
    foundingDate: "2023-08-01",
    // Registered office of the legal entity (Georgia). The Almaty location lives
    // on the LocalBusiness node — that is a personal presence / service area,
    // not a registered place of business in Kazakhstan.
    address: {
      "@type": "PostalAddress",
      streetAddress: "Levan Mikeladze Street 19, Floor 15, Apartment 26",
      addressLocality: "Tbilisi",
      addressCountry: "GE",
    },
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.png`,
    sameAs: [
      "https://www.instagram.com/suslicke",
      "https://www.linkedin.com/in/suslicke",
      `https://t.me/${siteConfig.telegram}`,
      `https://wa.me/${siteConfig.whatsapp}`,
    ],
  };
}

/** LocalBusiness schema — Kazakhstan-based digital studio. */
export function localBusinessLd() {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "LocalBusiness",
    name: SITE_NAME,
    url: siteConfig.url,
    image: `${siteConfig.url}/icon.png`,
    areaServed: [
      { "@type": "City", name: "Almaty" },
      { "@type": "Country", name: "Kazakhstan" },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Алматы",
      addressCountry: "KZ",
    },
    inLanguage: [...LANGUAGES],
    telephone: `+${siteConfig.whatsapp}`,
  };
}

export interface DentistLdArgs {
  name: string;
  url: string;
  /** Display phone, e.g. "+7 705 413 6955". */
  telephone: string;
  /** Street/area address line. */
  streetAddress: string;
  addressLocality: string;
  /** Human hours line, e.g. "Ежедневно 10:00–23:00". */
  openingHours?: string;
  rating?: number;
  reviewsCount?: number;
  image?: string;
  sameAs?: string[];
}

/**
 * Dentist (LocalBusiness) schema for a demo client site at /sites/<slug>.
 * Describes the prospect clinic, not the studio. Lives in page source so a
 * generated site is genuinely SEO-complete even though the demo is noindex.
 */
export function dentistLd({
  name,
  url,
  telephone,
  streetAddress,
  addressLocality,
  openingHours,
  rating,
  reviewsCount,
  image,
  sameAs,
}: DentistLdArgs) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Dentist",
    name,
    url,
    telephone,
    address: {
      "@type": "PostalAddress",
      streetAddress,
      addressLocality,
      addressCountry: "KZ",
    },
    ...(image ? { image } : {}),
    ...(openingHours ? { openingHours } : {}),
    ...(rating && reviewsCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating,
            reviewCount: reviewsCount,
          },
        }
      : {}),
    ...(sameAs && sameAs.length ? { sameAs } : {}),
  };
}

/** Person schema for the founder. */
export function personLd() {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Person",
    name: "Andrei Pustovoi",
    jobTitle: "Founder & Tech Lead",
    url: siteConfig.url,
    worksFor: {
      "@type": "Organization",
      name: SITE_NAME,
    },
  };
}

/** WebSite schema. SearchAction omitted until a search page exists. */
export function websiteLd() {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteConfig.url,
    inLanguage: [...LANGUAGES],
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/** BreadcrumbList schema from an ordered list of items. */
export function breadcrumbLd(items: BreadcrumbItem[]) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export interface ServiceLdArgs {
  name: string;
  description: string;
  url: string;
}

/** Service schema for a single service offering. */
export function serviceLd({ name, description, url }: ServiceLdArgs) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Service",
    name,
    description,
    url,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteConfig.url,
    },
    areaServed: {
      "@type": "Country",
      name: "Kazakhstan",
    },
  };
}

export interface CreativeWorkLdArgs {
  /** Project name. */
  name: string;
  /** Short summary / abstract of the project. */
  description: string;
  /** Canonical URL of the case detail page. */
  url: string;
  /** Live production URL the project is about; omitted for confidential cases. */
  about?: string;
  /** Tech/stack keywords. */
  keywords: readonly string[];
  /** Year the project shipped. */
  year: number;
}

/**
 * CreativeWork schema for a portfolio project. `url` is the case detail page;
 * `sameAs` points at the live production site the work is about.
 */
export function creativeWorkLd({
  name,
  description,
  url,
  about,
  keywords,
  year,
}: CreativeWorkLdArgs) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "CreativeWork",
    name,
    description,
    url,
    // Only emit `about`/`sameAs` when there's a public production URL.
    ...(about ? { about, sameAs: about } : {}),
    keywords: [...keywords].join(", "),
    datePublished: String(year),
    creator: {
      "@type": "Organization",
      name: SITE_NAME,
      url: siteConfig.url,
    },
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** FAQPage schema from question/answer pairs. */
export function faqLd(qa: FaqItem[]) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "FAQPage",
    mainEntity: qa.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
