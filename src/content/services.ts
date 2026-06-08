/**
 * Structural data for the studio's service offerings. Translatable copy lives in
 * the `services` namespace in messages/{ru,kk,en}.json keyed by `slug` (e.g.
 * `services.landing.title`). This keeps i18n centralized and structure typed.
 *
 * `icon` is a lucide-react icon name; consumers map it to a component (see
 * `src/components/sections/services-overview.tsx`). `order` controls display
 * sequence; `featured` flags the headline services.
 */
export type ServiceSlug = "landing" | "web-apps" | "ai" | "mobile" | "seo";

export interface Service {
  slug: ServiceSlug;
  /** lucide-react icon name. */
  icon: string;
  order: number;
  featured: boolean;
}

export const services: readonly Service[] = [
  { slug: "landing", icon: "Rocket", order: 1, featured: true },
  { slug: "web-apps", icon: "LayoutDashboard", order: 2, featured: true },
  { slug: "ai", icon: "Sparkles", order: 3, featured: true },
  { slug: "mobile", icon: "Smartphone", order: 4, featured: false },
  { slug: "seo", icon: "Search", order: 5, featured: false },
] as const;
