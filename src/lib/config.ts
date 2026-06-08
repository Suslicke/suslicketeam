export const siteConfig = {
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://suslicketeam.com",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "77066998879",
  telegram: process.env.NEXT_PUBLIC_TELEGRAM_USERNAME ?? "suslicketeam",
  locales: ["ru", "kk", "en"] as const,
  defaultLocale: "ru" as const,
} as const;

export type Locale = (typeof siteConfig.locales)[number];
