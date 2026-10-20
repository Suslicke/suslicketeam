/**
 * Starting prices for the public /pricing page. Copy lives in the `pricing`
 * namespace in messages/{ru,kk,en}.json keyed by `slug`. Numbers here are the
 * single place to edit; `usd` is a rounded approximation of `kzt`.
 * Grounded in the real tiers quoted in docs/kp-booking-crm-bot.md.
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
  { slug: "website", kzt: 350_000, usd: 650, monthly: false, featured: false },
  { slug: "app", kzt: 550_000, usd: 1_000, monthly: false, featured: true },
  { slug: "system", kzt: 750_000, usd: 1_400, monthly: false, featured: false },
  { slug: "support", kzt: 30_000, usd: 55, monthly: true, featured: false },
];
