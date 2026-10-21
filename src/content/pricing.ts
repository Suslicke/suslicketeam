/**
 * Starting prices for the public /pricing page. Copy lives in the `pricing`
 * namespace in messages/{ru,kk,en}.json keyed by `slug`. Numbers here are the
 * single place to edit; `usd` is a rounded approximation of `kzt`.
 * Entry-level "from" prices (simplest scope per tier); real quotes scale up
 * from here after the brief.
 */
export type PricingSlug = "website" | "app" | "system" | "support";

export interface PricingTier {
  slug: PricingSlug;
  /** Starting price in tenge ("from"). */
  kzt: number;
  /** Approximate USD equivalent, rounded. */
  usd: number;
  /** Billed per month (support) vs one-off (projects). */
  monthly: boolean;
  featured: boolean;
}

export const PRICING_TIERS: readonly PricingTier[] = [
  { slug: "website", kzt: 50_000, usd: 95, monthly: false, featured: false },
  { slug: "app", kzt: 150_000, usd: 280, monthly: false, featured: true },
  { slug: "system", kzt: 300_000, usd: 550, monthly: false, featured: false },
  { slug: "support", kzt: 10_000, usd: 20, monthly: true, featured: false },
];
