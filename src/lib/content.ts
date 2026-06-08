import { cases, type CaseItem, type CaseSlug } from "@/content/cases";
import { services, type Service, type ServiceSlug } from "@/content/services";

/** All services, ordered by their `order` field. */
export function getServices(): Service[] {
  return [...services].sort((a, b) => a.order - b.order);
}

/** Look up a single service by slug; `undefined` if unknown. */
export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === (slug as ServiceSlug));
}

/** All cases, newest first then by definition order. */
export function getCases(): CaseItem[] {
  return [...cases].sort((a, b) => b.year - a.year);
}

/** Cases flagged `featured`, preserving the sorted order. */
export function getFeaturedCases(): CaseItem[] {
  return getCases().filter((c) => c.featured);
}

/**
 * Public, verifiable cases only — excludes confidential (NDA) cases that have no
 * live URL. Used by the "open and verify" live-projects grid and the marquee.
 */
export function getPublicCases(): CaseItem[] {
  return getCases().filter((c) => !c.nda && c.url);
}

/** Look up a single case by slug; `undefined` if unknown. */
export function getCaseBySlug(slug: string): CaseItem | undefined {
  return cases.find((c) => c.slug === (slug as CaseSlug));
}
