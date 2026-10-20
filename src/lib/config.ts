export const siteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://suslicketeam.com",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "77066998879",
  telegram: process.env.NEXT_PUBLIC_TELEGRAM_USERNAME ?? "suslicketeam",
  // Branded support mailbox (Stalwart on netcup). Shown in footer, /contact,
  // Organization/LocalBusiness schema and used as the support email for
  // payment providers (Creem).
  email: "admin@suslicketeam.com",
  locales: ["ru", "kk", "en"] as const,
  defaultLocale: "en" as const,
} as const;

export type Locale = (typeof siteConfig.locales)[number];
