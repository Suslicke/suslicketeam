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

/** Look up a single case by slug; `undefined` if unknown. */
export function getCaseBySlug(slug: string): CaseItem | undefined {
  return cases.find((c) => c.slug === (slug as CaseSlug));
}
