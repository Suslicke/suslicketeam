/**
 * Demo "client sites" served at /sites/<slug>.
 *
 * These are bespoke single-page landings we build for prospect businesses to
 * show them a real, working site under our domain. Unlike the marketing site,
 * copy lives INLINE here (per-field RU/KK/EN) rather than in messages/*.json —
 * each clinic is a one-off, so externalizing into the global i18n bundle would
 * force pointless parity churn. Adding a clinic = appending one `Site` object
 * (+ dropping photos in public/images/sites/<slug>/). That's the whole workflow.
 *
 * These pages are noindex (see app/sites/[slug]/page.tsx) — they are sales
 * drafts, not our own indexable content.
 */

/** A string in the three site locales. RU is authoritative. */
export interface Localized {
  ru: string;
  kk: string;
  en: string;
}

/** Shorthand for a {ru,kk,en} triple, to keep the data table readable. */
const L = (ru: string, kk: string, en: string): Localized => ({ ru, kk, en });

export type SiteLang = keyof Localized;
export const SITE_LANGS: readonly SiteLang[] = ["ru", "kk", "en"];

export interface SiteService {
  name: Localized;
  desc: Localized;
}

export interface Site {
  /** Routing key for /sites/<slug>. */
  slug: string;
  /** Brand name, rendered verbatim (not translated). */
  name: string;
  /** Short niche label, e.g. "Стоматология". */
  kind: Localized;
  /** One-line hero headline. */
  headline: Localized;
  /** Hero supporting sentence. */
  subhead: Localized;
  /** Brand accent color (any CSS color). Drives buttons/highlights via --accent. */
  accent: string;

  /** Contact + facts (structural, mostly verbatim). */
  city: Localized;
  address: Localized;
  /** Display phone, e.g. "+7 705 413 6955". */
  phone: string;
  /** WhatsApp number — any format; digits are extracted for wa.me. */
  whatsapp: string;
  /** Per-language WhatsApp prefill text. */
  whatsappPrefill: Localized;
  instagram?: string;
  twogis?: string;
  /** Human hours line, e.g. "Ежедневно 10:00–23:00". */
  hours: Localized;

  rating?: number;
  reviewsCount?: number;

  services: readonly SiteService[];
  /** public-relative photo paths, e.g. "/images/sites/<slug>/result-1.jpg". */
  photos: readonly string[];
}

export const sites: readonly Site[] = [
  {
    slug: "royal-stom",
    name: "Royal Stom",
    kind: L("Стоматология", "Стоматология", "Dental clinic"),
    headline: L(
      "Красивая улыбка начинается здесь",
      "Әдемі күлкі осы жерден басталады",
      "A beautiful smile starts here",
    ),
    subhead: L(
      "Терапия, имплантология, виниры, детская стоматология и хирургия. Приём по записи, первичная консультация — бесплатно.",
      "Терапия, имплантология, виниры, балалар стоматологиясы және хирургия. Алдын ала жазылу бойынша, алғашқы консультация — тегін.",
      "Therapy, implants, veneers, pediatric dentistry and surgery. By appointment, first consultation is free.",
    ),
    accent: "#0e7c6b",
    city: L("Алматы", "Алматы", "Almaty"),
    address: L(
      "ЖК Айнабулак, мкр. Айнабулак-2, 85Б",
      "Айнабұлақ ТК, Айнабұлақ-2 ы.а., 85Б",
      "Ainabulak, microdistrict Ainabulak-2, 85B",
    ),
    phone: "+7 705 413 6955",
    whatsapp: "+7 705 413 6955",
    whatsappPrefill: L(
      "Здравствуйте! Хочу записаться на консультацию в Royal Stom.",
      "Сәлеметсіз бе! Royal Stom-ға консультацияға жазылғым келеді.",
      "Hello! I'd like to book a consultation at Royal Stom.",
    ),
    instagram: "https://www.instagram.com/royalstom.ainabulak",
    twogis: "https://2gis.kz/almaty/firm/70000001060190121",
    hours: L(
      "Ежедневно, 10:00–23:00",
      "Күн сайын, 10:00–23:00",
      "Daily, 10:00–23:00",
    ),
    rating: 4.9,
    reviewsCount: 300,
    services: [
      {
        name: L("Терапия", "Терапия", "Therapy"),
        desc: L(
          "Лечение кариеса и эстетичная реставрация зубов.",
          "Тіс жегісін емдеу және тісті эстетикалық қалпына келтіру.",
          "Caries treatment and aesthetic tooth restoration.",
        ),
      },
      {
        name: L("Имплантология", "Имплантология", "Implants"),
        desc: L(
          "Восстановление утраченных зубов имплантами.",
          "Жоғалған тістерді имплантпен қалпына келтіру.",
          "Replacing missing teeth with implants.",
        ),
      },
      {
        name: L("Виниры", "Виниры", "Veneers"),
        desc: L(
          "Виниринг для идеальной и ровной улыбки.",
          "Мінсіз әрі тегіс күлкі үшін виниринг.",
          "Veneers for a flawless, even smile.",
        ),
      },
      {
        name: L("Детская стоматология", "Балалар стоматологиясы", "Pediatric dentistry"),
        desc: L(
          "Бережный приём для самых маленьких пациентов.",
          "Ең кішкентай пациенттерге ұқыпты қабылдау.",
          "Gentle care for the youngest patients.",
        ),
      },
      {
        name: L("Ортопедия", "Ортопедия", "Orthopedics"),
        desc: L(
          "Коронки, мосты и протезирование зубов.",
          "Коронкалар, көпірлер және тіс протездеу.",
          "Crowns, bridges and prosthetics.",
        ),
      },
      {
        name: L("Хирургия", "Хирургия", "Surgery"),
        desc: L(
          "Удаление зубов и сложные клинические случаи.",
          "Тіс жұлу және күрделі клиникалық жағдайлар.",
          "Tooth extraction and complex clinical cases.",
        ),
      },
      {
        name: L("Отбеливание", "Ағарту", "Whitening"),
        desc: L(
          "Профессиональное отбеливание до естественной белизны.",
          "Табиғи аққа дейін кәсіби ағарту.",
          "Professional whitening to a natural shade.",
        ),
      },
      {
        name: L("Профгигиена", "Кәсіби тазалау", "Hygiene"),
        desc: L(
          "Чистка и снятие налёта и зубного камня.",
          "Тазалау, қақ пен тіс тасын алып тастау.",
          "Cleaning and removal of plaque and tartar.",
        ),
      },
    ],
    photos: [
      "/images/sites/royal-stom/result-1.jpg",
      "/images/sites/royal-stom/result-2.jpg",
      "/images/sites/royal-stom/result-3.jpg",
      "/images/sites/royal-stom/result-4.jpg",
    ],
  },
];

export function getSite(slug: string): Site | undefined {
  return sites.find((s) => s.slug === slug);
}
