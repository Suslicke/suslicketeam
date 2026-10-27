"use client";

import { Geologica, JetBrains_Mono, Onest } from "next/font/google";
import {
  AnimatePresence,
  motion,
  MotionConfig,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { buildWhatsappUrl } from "@/lib/messenger";
import { SITE_LANGS, type Localized, type Site, type SiteLang } from "@/content/sites";

/**
 * "Smile" landing template (Site.template === "smile" | "beauty").
 *
 * Direction: the clinic from the inside — porcelain + navy + gum-pink, a
 * Geologica display face with a mono utility face for shade codes and hours.
 * Signature: a VITA shade-guide fan in the hero that spreads on load and sweeps
 * from the darkest shade to BL1.
 *
 * "beauty" re-skins the same page through THEMES: the shade guide becomes a
 * gel-polish fan, plus a master-choice step in booking.
 *
 * Reduced motion: MotionConfig reducedMotion="user" (no render branching, so no
 * SSR/client hydration mismatch — unlike components/motion/{reveal,stagger}).
 */

const display = Geologica({ subsets: ["latin", "cyrillic"], weight: ["500", "700", "800"], variable: "--sm-display" });
const body = Onest({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600"], variable: "--sm-body" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], weight: ["500"], variable: "--sm-mono" });

const SMILE_C = {
  porcelain: "#F3F6F8",
  white: "#FFFFFF",
  navy: "#0A1B2E",
  slate: "#5A6B7D",
  gum: "#E8546B",
  ice: "#DCE8EF",
};

/** VITA-style shade tabs, darkest → lightest (approximate swatch colours). */
const SMILE_SHADES = [
  { code: "C2", hex: "#CDBB98" },
  { code: "A3.5", hex: "#D6B98C" },
  { code: "A3", hex: "#DFC79D" },
  { code: "B2", hex: "#E7D7B4" },
  { code: "A2", hex: "#EBDCBC" },
  { code: "A1", hex: "#F0E6CE" },
  { code: "B1", hex: "#F4EDDB" },
  { code: "BL1", hex: "#FAF8F2" },
];

const UI = {
  draft: {
    ru: "Демонстрационная версия сайта · подготовлено командой",
    kk: "Сайттың демонстрациялық нұсқасы · дайындаған команда —",
    en: "Demo version of this site · prepared by",
  },
  whatsapp: { ru: "Записаться в WhatsApp", kk: "WhatsApp арқылы жазылу", en: "Book on WhatsApp" },
  book: { ru: "Записаться", kk: "Жазылу", en: "Book now" },
  call: { ru: "Позвонить", kk: "Қоңырау шалу", en: "Call" },
  shadeCaption: {
    ru: "Подбираем оттенок по шкале VITA",
    kk: "Реңкті VITA шкаласы бойынша таңдаймыз",
    en: "Shade-matched on the VITA scale",
  },
  free: { ru: "Консультация — 0 ₸", kk: "Консультация — 0 ₸", en: "Consultation — 0 ₸" },
  services: { ru: "Что лечим", kk: "Не емдейміз", en: "What we treat" },
  visit: { ru: "Как проходит первый визит", kk: "Алғашқы келу қалай өтеді", en: "Your first visit" },
  ctaTitle: { ru: "Запишитесь за минуту", kk: "Бір минутта жазылыңыз", en: "Book in a minute" },
  ctaSub: {
    ru: "Напишите в WhatsApp — ответим и подберём удобное время.",
    kk: "WhatsApp-қа жазыңыз — жауап беріп, ыңғайлы уақыт таңдаймыз.",
    en: "Message us on WhatsApp — we'll reply and find a convenient time.",
  },
  contacts: { ru: "Контакты", kk: "Байланыс", en: "Contacts" },
  address: { ru: "Адрес", kk: "Мекенжай", en: "Address" },
  hours: { ru: "Часы", kk: "Уақыты", en: "Hours" },
  phone: { ru: "Телефон", kk: "Телефон", en: "Phone" },
  madeBy: { ru: "Сделано в", kk: "Жасаған", en: "Made by" },
  bookTitle: { ru: "Запишитесь онлайн — в любое время", kk: "Онлайн жазылыңыз — кез келген уақытта", en: "Book online — any time" },
  bookService: { ru: "Услуга", kk: "Қызмет", en: "Service" },
  bookDay: { ru: "День", kk: "Күн", en: "Day" },
  bookTime: { ru: "Время", kk: "Уақыт", en: "Time" },
  bookMaster: { ru: "Мастер", kk: "Шебер", en: "Master" },
  bookName: { ru: "Имя", kk: "Аты", en: "Name" },
  bookPhone: { ru: "Телефон (WhatsApp)", kk: "Телефон (WhatsApp)", en: "Phone (WhatsApp)" },
  bookSubmit: { ru: "Записаться", kk: "Жазылу", en: "Book" },
  bookDone: { ru: "Заявка отправлена", kk: "Өтінім жіберілді", en: "Request sent" },
  bookDoneSub: {
    ru: "Подтверждение придёт в WhatsApp, а за день до приёма — напоминание.",
    kk: "Растау WhatsApp-қа келеді, ал қабылдаудан бір күн бұрын — еске салу.",
    en: "A confirmation arrives on WhatsApp, and a reminder the day before.",
  },
  bookAgain: { ru: "Новая запись", kk: "Жаңа жазылу", en: "New booking" },
  bookDemo: {
    ru: "Демо: заявка никуда не отправляется.",
    kk: "Демо: өтінім ешқайда жіберілмейді.",
    en: "Demo: the request isn't sent anywhere.",
  },
};

const DAYS: Localized[] = [
  { ru: "Сегодня", kk: "Бүгін", en: "Today" },
  { ru: "Завтра", kk: "Ертең", en: "Tomorrow" },
  { ru: "Послезавтра", kk: "Бүрсігүні", en: "In 2 days" },
];
/** Demo slots; `busy` ones render disabled so the grid reads like a real schedule. */
const SLOTS = [
  { time: "10:00" },
  { time: "11:30", busy: true },
  { time: "13:00" },
  { time: "15:00" },
  { time: "16:30", busy: true },
  { time: "18:00" },
  { time: "19:30" },
];
/** "Today" hides slots already past in Almaty (only evaluated after a click, so no SSR mismatch). */
const isPast = (hhmm: string) => hhmm <= new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Almaty", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());

/** The first-visit sequence — order is the information, hence the numbering. */
const STEPS: { title: Localized; text: Localized }[] = [
  {
    title: { ru: "Запись онлайн или в WhatsApp", kk: "Онлайн немесе WhatsApp арқылы жазылу", en: "Book online or on WhatsApp" },
    text: {
      ru: "Подтверждение и напоминание придут в WhatsApp.",
      kk: "Растау мен еске салу WhatsApp-қа келеді.",
      en: "Confirmation and a reminder arrive on WhatsApp.",
    },
  },
  {
    title: { ru: "Бесплатная консультация", kk: "Тегін консультация", en: "Free consultation" },
    text: {
      ru: "Осмотр, снимок при необходимости и понятный план лечения.",
      kk: "Тексеру, қажет болса сурет және түсінікті емдеу жоспары.",
      en: "A check-up, an X-ray if needed, and a clear treatment plan.",
    },
  },
  {
    title: { ru: "Цена — до начала", kk: "Баға — басталмай тұрып", en: "Price agreed upfront" },
    text: {
      ru: "Вы знаете стоимость заранее, без сюрпризов.",
      kk: "Құнын алдын ала білесіз, тосынсыйсыз.",
      en: "You know the cost before we start — no surprises.",
    },
  },
  {
    title: { ru: "Лечение в удобное время", kk: "Ыңғайлы уақытта емдеу", en: "Treatment when it suits you" },
    text: { ru: "", kk: "", en: "" }, // filled from site.hours at render
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

type Theme = {
  c: typeof SMILE_C;
  shades: { code: string; hex: string }[];
  /** border-radius of a swatch tab: a tooth crown or a nail tip */
  tab: string;
  Glyph: (p: { className?: string }) => ReactNode;
  ui: Record<keyof typeof UI, Localized>;
  steps: typeof STEPS;
  masters?: Localized[];
};

const THEMES: Record<"smile" | "beauty", Theme> = {
  smile: { c: SMILE_C, shades: SMILE_SHADES, tab: "44% 44% 40% 40% / 32% 32% 68% 68%", Glyph: ToothGlyph, ui: UI, steps: STEPS },
  beauty: {
    c: { porcelain: "#FBF4F2", white: "#FFFFFF", navy: "#2A1720", slate: "#7A6670", gum: "#B4436C", ice: "#F3DCE3" },
    // gel-polish swatches; the sweep ends on the salon's berry
    shades: [
      { code: "K20", hex: "#2B1D24" },
      { code: "P11", hex: "#6B1E3A" },
      { code: "W09", hex: "#9E2A4B" },
      { code: "R14", hex: "#C73E4F" },
      { code: "R05", hex: "#D98E8A" },
      { code: "N03", hex: "#E8B9A8" },
      { code: "M01", hex: "#F2D7CF" },
      { code: "B07", hex: "#B4436C" },
    ],
    tab: "50% 50% 16% 16% / 42% 42% 12% 12%",
    Glyph: SparkGlyph,
    ui: {
      ...UI,
      shadeCaption: { ru: "Подбираем оттенок гель-лака", kk: "Гель-лак реңкін таңдаймыз", en: "Matching your gel-polish shade" },
      free: { ru: "Запись онлайн 24/7", kk: "Онлайн жазылу 24/7", en: "Online booking 24/7" },
      services: { ru: "Услуги", kk: "Қызметтер", en: "Services" },
      visit: { ru: "Как проходит визит", kk: "Келу қалай өтеді", en: "Your visit" },
      bookDoneSub: {
        ru: "Подтверждение придёт в WhatsApp, а перед визитом — напоминание.",
        kk: "Растау WhatsApp-қа келеді, ал келер алдында — еске салу.",
        en: "A confirmation arrives on WhatsApp, and a reminder before your visit.",
      },
    },
    steps: [
      STEPS[0],
      {
        title: { ru: "Выбираете мастера", kk: "Шеберді таңдайсыз", en: "Pick your master" },
        text: { ru: "Свободные окна каждого мастера видно сразу.", kk: "Әр шебердің бос уақыты бірден көрінеді.", en: "Every master's free slots, at a glance." },
      },
      STEPS[2],
      { title: { ru: "Визит в удобное время", kk: "Ыңғайлы уақытта келу", en: "Come when it suits you" }, text: STEPS[3].text },
    ],
    masters: [
      { ru: "Алия", kk: "Әлия", en: "Aliya" },
      { ru: "Дина", kk: "Дина", en: "Dina" },
      { ru: "Любой мастер", kk: "Кез келген шебер", en: "Any master" },
    ],
  },
};
const ThemeCtx = createContext<Theme>(THEMES.smile);
const useTheme = () => useContext(ThemeCtx);

export function SmileSite({ site }: { site: Site }) {
  const th = THEMES[site.template === "beauty" ? "beauty" : "smile"];
  return (
    <ThemeCtx.Provider value={th}>
      <Page site={site} />
    </ThemeCtx.Provider>
  );
}

function Page({ site }: { site: Site }) {
  const { c: C, ui } = useTheme();
  const [lang, setLang] = useState<SiteLang>("ru");
  const t = (l: Localized) => l[lang];
  const waHref = buildWhatsappUrl({ number: site.whatsapp, text: t(site.whatsappPrefill) });
  const telHref = `tel:${site.phone.replace(/[^\d+]/g, "")}`;

  const vars = {
    "--porcelain": C.porcelain,
    "--navy": C.navy,
    "--slate": C.slate,
    "--gum": C.gum,
    "--ice": C.ice,
  } as CSSProperties;

  return (
    <MotionConfig reducedMotion="user">
      <main
        style={vars}
        className={`${display.variable} ${body.variable} ${mono.variable} relative min-h-screen overflow-x-clip bg-[var(--porcelain)] font-[family-name:var(--sm-body)] text-[var(--navy)] selection:bg-[var(--gum)]/20`}
      >
        {/* Honest demo strip */}
        <p className="bg-[var(--navy)] px-4 py-2 text-center text-[11px] text-white/75">
          {t(ui.draft)} <span className="font-semibold text-white">suslicketeam</span>
        </p>

        <Header site={site} lang={lang} setLang={setLang} waHref={waHref} />

        <Hero site={site} t={t} waHref={waHref} telHref={telHref} />

        <Marquee items={site.services.map((s) => t(s.name))} />

        <Booking site={site} t={t} />

        <Services site={site} t={t} />

        <Visit site={site} t={t} />

        <Cta t={t} waHref={waHref} />

        <Contacts site={site} t={t} telHref={telHref} />

        <footer className="mx-auto flex max-w-6xl items-center justify-between px-5 pb-28 pt-6 text-sm text-[var(--slate)] sm:pb-10">
          <span className="font-[family-name:var(--sm-display)] font-bold text-[var(--navy)]">{site.name}</span>
          <span>
            {t(ui.madeBy)} <span className="font-semibold text-[var(--navy)]">suslicketeam</span>
          </span>
        </footer>

        {/* Mobile sticky booking bar */}
        <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 p-3 sm:hidden">
          <div className="absolute inset-0 -z-10 bg-[var(--porcelain)]/80 backdrop-blur-xl" />
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-[var(--gum)] py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_var(--gum)]"
          >
            <WhatsAppGlyph className="size-4" />
            {t(ui.book)}
          </a>
          <a
            href={telHref}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-semibold ring-1 ring-[var(--navy)]/10"
          >
            <PhoneGlyph className="size-4" />
            {t(ui.call)}
          </a>
        </div>
      </main>
    </MotionConfig>
  );
}

type T = (l: Localized) => string;

function Header({
  site,
  lang,
  setLang,
  waHref,
}: {
  site: Site;
  lang: SiteLang;
  setLang: (l: SiteLang) => void;
  waHref: string;
}) {
  const { Glyph } = useTheme();
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--navy)]/5 bg-[var(--porcelain)]/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <span className="flex items-center gap-2 font-[family-name:var(--sm-display)] text-lg font-bold tracking-tight">
          <Glyph className="size-6 text-[var(--gum)]" />
          {site.name}
        </span>
        <div className="flex items-center gap-3">
          <div className="flex rounded-full bg-white p-1 ring-1 ring-[var(--navy)]/5" role="group" aria-label="Language">
            {SITE_LANGS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className="relative rounded-full px-2.5 py-1 font-[family-name:var(--sm-mono)] text-[11px] uppercase focus-visible:outline-2 focus-visible:outline-[var(--gum)]"
              >
                {lang === l && (
                  <motion.span
                    layoutId="sm-lang"
                    className="absolute inset-0 rounded-full bg-[var(--navy)]"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <span className={`relative ${lang === l ? "text-white" : "text-[var(--slate)]"}`}>{l}</span>
              </button>
            ))}
          </div>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="hidden size-9 place-items-center rounded-full bg-[var(--gum)] text-white sm:grid"
          >
            <WhatsAppGlyph className="size-4" />
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero({ site, t, waHref, telHref }: { site: Site; t: T; waHref: string; telHref: string }) {
  const { ui } = useTheme();
  const words = t(site.headline).split(" ");
  return (
    <section className="relative isolate mx-auto grid max-w-6xl items-center gap-8 px-5 pb-16 pt-10 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:pt-20">
      {/* soft ice glow behind the fan (-z-10: grid `order` repaints the fan before this node) */}
      <div aria-hidden className="pointer-events-none absolute right-0 top-10 -z-10 size-[420px] rounded-full bg-[var(--ice)] blur-3xl lg:size-[560px]" />

      <div className="relative">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="font-[family-name:var(--sm-mono)] text-xs uppercase tracking-[0.2em] text-[var(--gum)]"
        >
          {t(site.kind)} — {t(site.city)}
        </motion.p>

        <h1
          key={t(site.headline)}
          className="mt-5 font-[family-name:var(--sm-display)] text-[clamp(2.75rem,11vw,4.75rem)] font-extrabold leading-[0.95] tracking-[-0.04em]"
        >
          {words.map((w, i) => (
            <span key={i} className="mr-[0.22em] inline-block overflow-hidden pb-[0.08em] align-bottom">
              <motion.span
                className="inline-block"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.1 + i * 0.08 }}
              >
                {w}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.45 }}
          className="mt-6 max-w-md text-[17px] leading-relaxed text-[var(--slate)]"
        >
          {t(site.subhead)}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.6 }}
          className="mt-8 flex flex-wrap gap-3"
        >
          <motion.a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2.5 rounded-full bg-[var(--gum)] px-7 py-4 font-semibold text-white shadow-[0_18px_40px_-14px_var(--gum)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--navy)]"
          >
            <WhatsAppGlyph className="size-5" />
            {t(ui.whatsapp)}
          </motion.a>
          <motion.a
            href={telHref}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 font-semibold ring-1 ring-[var(--navy)]/10 focus-visible:outline-2 focus-visible:outline-[var(--gum)]"
          >
            <PhoneGlyph className="size-4" />
            {t(ui.call)}
          </motion.a>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex flex-wrap gap-2 font-[family-name:var(--sm-mono)] text-[11px] uppercase tracking-wider text-[var(--slate)]"
        >
          {[t(ui.free), t(site.hours), "RU · KK · EN"].map((x) => (
            <li key={x} className="rounded-full bg-white/70 px-3 py-1.5 ring-1 ring-[var(--navy)]/5">
              {x}
            </li>
          ))}
        </motion.ul>
      </div>

      <ShadeFan caption={t(ui.shadeCaption)} />
    </section>
  );
}

/** Signature: VITA shade tabs fan out, then a highlight sweeps dark → BL1. */
function ShadeFan({ caption }: { caption: string }) {
  const { c: C, shades: SHADES, tab } = useTheme();
  const reduce = useReducedMotion();
  const [active, setActive] = useState(-1);

  useEffect(() => {
    if (reduce) {
      setActive(SHADES.length - 1);
      return;
    }
    const timers = SHADES.map((_, i) => setTimeout(() => setActive(i), 1300 + i * 260));
    return () => timers.forEach(clearTimeout);
  }, [reduce, SHADES]);

  const mid = (SHADES.length - 1) / 2;
  return (
    <figure className="relative order-first mx-auto w-full max-w-[440px] lg:order-none lg:origin-bottom lg:scale-[1.3]">
      {/* All tabs pivot on one rivet at the bottom centre, like a real shade guide. */}
      <div className="relative h-[290px]">
        <span className="absolute bottom-[-9px] left-1/2 z-30 -ml-[11px] size-[22px] rounded-full bg-[var(--navy)] ring-4 ring-[var(--porcelain)]" />
        {SHADES.map((s, i) => {
          const angle = (i - mid) * 11;
          const on = i === active;
          return (
            <motion.div
              key={s.code}
              className="absolute bottom-0 left-1/2 -ml-[28px] flex w-[56px] origin-bottom flex-col items-center"
              initial={{ rotate: 0, opacity: 0, y: 60 }}
              animate={{ rotate: angle, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 16, delay: 0.35 + i * 0.06 }}
              style={{ zIndex: on ? 20 : i }}
            >
              <motion.div
                animate={{ y: on ? -18 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex flex-col items-center"
              >
                {/* crown */}
                <div
                  className="relative h-[70px] w-[50px] shadow-[inset_0_-10px_18px_rgba(0,0,0,.08),0_10px_24px_-10px_rgba(10,27,46,.35)] transition-[box-shadow] duration-300"
                  style={{
                    borderRadius: tab,
                    background: `radial-gradient(circle at 35% 28%, rgba(255,255,255,.95), transparent 42%), ${s.hex}`,
                    boxShadow: on ? `0 0 0 3px ${C.gum}, 0 16px 34px -10px ${C.gum}` : undefined,
                  }}
                />
                {/* holder with the shade code */}
                <div className="flex h-[190px] w-[18px] justify-center rounded-b-full bg-gradient-to-b from-[#1d3350] to-[var(--navy)] pt-2">
                  <span
                    className={`rotate-180 font-[family-name:var(--sm-mono)] text-[10px] leading-none [writing-mode:vertical-rl] ${on ? "text-[var(--gum)]" : "text-white/75"}`}
                  >
                    {s.code}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
      <figcaption className="mt-8 flex items-center justify-center gap-2 font-[family-name:var(--sm-mono)] text-xs text-[var(--slate)]">
        <span className="inline-block size-2 rounded-full bg-[var(--gum)]" />
        {caption} · <span className="text-[var(--navy)]">{SHADES[Math.max(active, 0)].code}</span>
      </figcaption>
    </figure>
  );
}

function Marquee({ items }: { items: string[] }) {
  const { Glyph } = useTheme();
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-[var(--navy)]/8 bg-white py-5" aria-hidden>
      <div className="flex w-max animate-[sm-marquee_28s_linear_infinite] gap-10 motion-reduce:animate-none">
        {row.map((x, i) => (
          <span key={i} className="flex items-center gap-10 font-[family-name:var(--sm-display)] text-3xl font-bold tracking-tight">
            {x}
            <Glyph className="size-5 text-[var(--gum)]" />
          </span>
        ))}
      </div>
      <style>{`@keyframes sm-marquee{to{transform:translateX(-50%)}}`}</style>
    </div>
  );
}

/** Online booking: service → day → time → contact → confirmation. Front-end only on the demo. */
function Booking({ site, t }: { site: Site; t: T }) {
  const { c: C, ui, masters } = useTheme();
  const [service, setService] = useState<number | null>(null);
  const [master, setMaster] = useState<number | null>(null);
  const [day, setDay] = useState<number | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const ready = service !== null && (!masters || master !== null) && day !== null && time !== null && name.trim() !== "" && phone.replace(/\D/g, "").length >= 10;

  const reset = () => {
    setService(null);
    setMaster(null);
    setDay(null);
    setTime(null);
    setName("");
    setPhone("");
    setSent(false);
  };

  return (
    <section id="booking" className="mx-auto max-w-6xl px-5 pt-20">
      <SectionTitle>{t(ui.bookTitle)}</SectionTitle>
      <div className="relative mt-10 overflow-hidden rounded-[2rem] bg-white p-5 ring-1 ring-[var(--navy)]/5 sm:p-8">
        <AnimatePresence mode="wait" initial={false}>
          {sent ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: EASE }}
              className="flex flex-col items-center py-10 text-center"
              role="status"
            >
              <svg viewBox="0 0 52 52" className="size-20" aria-hidden>
                <circle cx="26" cy="26" r="25" fill={C.gum} />
                <motion.path
                  d="M15 27 l7 7 l15 -16"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
                />
              </svg>
              <h3 className="mt-6 font-[family-name:var(--sm-display)] text-3xl font-extrabold tracking-tight">{t(ui.bookDone)}</h3>
              <p className="mt-2 font-[family-name:var(--sm-mono)] text-sm text-[var(--navy)]">
                {service !== null && t(site.services[service].name)}
                {masters && master !== null && ` · ${t(masters[master])}`} · {day !== null && t(DAYS[day])} · {time}
              </p>
              <p className="mt-3 max-w-sm text-[var(--slate)]">{t(ui.bookDoneSub)}</p>
              <button type="button" onClick={reset} className="mt-6 text-sm font-semibold text-[var(--gum)] underline-offset-4 hover:underline">
                {t(ui.bookAgain)}
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              onSubmit={(e) => {
                e.preventDefault();
                if (ready) setSent(true);
              }}
              className="space-y-7"
            >
              <Pick label={t(ui.bookService)} group="service">
                {site.services.map((s, i) => (
                  <Choice key={s.name.ru} group="service" on={service === i} onClick={() => setService(i)}>
                    {t(s.name)}
                  </Choice>
                ))}
              </Pick>
              {masters && (
                <Pick label={t(ui.bookMaster)} group="master">
                  {masters.map((m, i) => (
                    <Choice key={m.ru} group="master" on={master === i} onClick={() => setMaster(i)}>
                      {t(m)}
                    </Choice>
                  ))}
                </Pick>
              )}
              <Pick label={t(ui.bookDay)} group="day">
                {DAYS.map((d, i) => (
                  <Choice
                    key={d.ru}
                    group="day"
                    on={day === i}
                    onClick={() => {
                      setDay(i);
                      if (i === 0 && time && isPast(time)) setTime(null);
                    }}
                  >
                    {t(d)}
                  </Choice>
                ))}
              </Pick>
              <Pick label={t(ui.bookTime)} group="time">
                {SLOTS.filter((s) => day !== 0 || !isPast(s.time)).map((s) => (
                  <Choice key={s.time} group="time" mono on={time === s.time} disabled={s.busy} onClick={() => setTime(s.time)}>
                    {s.time}
                  </Choice>
                ))}
              </Pick>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t(ui.bookName)} value={name} onChange={setName} autoComplete="given-name" />
                <Field label={t(ui.bookPhone)} value={phone} onChange={setPhone} type="tel" autoComplete="tel" placeholder="+7 7__ ___ __ __" />
              </div>
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <motion.button
                  type="submit"
                  disabled={!ready}
                  whileTap={ready ? { scale: 0.96 } : undefined}
                  className="rounded-full bg-[var(--gum)] px-8 py-4 font-semibold text-white shadow-[0_18px_40px_-14px_var(--gum)] transition-opacity disabled:opacity-35 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--navy)]"
                >
                  {t(ui.bookSubmit)}
                </motion.button>
                <span className="text-xs text-[var(--slate)]">{t(ui.bookDemo)}</span>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Pick({ label, group, children }: { label: string; group: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 font-[family-name:var(--sm-mono)] text-xs uppercase tracking-wider text-[var(--slate)]">{label}</legend>
      <div className="flex flex-wrap gap-2" data-group={group}>
        {children}
      </div>
    </fieldset>
  );
}

/** Selectable chip; the selected fill slides between chips of one group (shared layoutId). */
function Choice({
  group,
  on,
  disabled,
  mono,
  onClick,
  children,
}: {
  group: string;
  on: boolean;
  disabled?: boolean;
  mono?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={`relative rounded-full px-4 py-2.5 text-sm font-medium ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gum)] disabled:cursor-not-allowed disabled:text-[var(--slate)]/40 disabled:line-through ${
        on ? "text-white ring-transparent" : "bg-[var(--porcelain)] text-[var(--navy)] ring-[var(--navy)]/5 hover:ring-[var(--navy)]/20"
      } ${mono ? "font-[family-name:var(--sm-mono)]" : ""}`}
    >
      {on && (
        <motion.span
          layoutId={`sm-pick-${group}`}
          className="absolute inset-0 rounded-full bg-[var(--navy)]"
          transition={{ type: "spring", stiffness: 500, damping: 36 }}
        />
      )}
      <span className="relative">{children}</span>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-[family-name:var(--sm-mono)] text-xs uppercase tracking-wider text-[var(--slate)]">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl bg-[var(--porcelain)] px-4 py-3.5 text-[var(--navy)] ring-1 ring-[var(--navy)]/5 outline-none placeholder:text-[var(--slate)]/50 focus:ring-2 focus:ring-[var(--gum)]"
      />
    </label>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.6, ease: EASE }}
      className="font-[family-name:var(--sm-display)] text-[clamp(2rem,8vw,3.5rem)] font-extrabold leading-none tracking-[-0.03em]"
    >
      {children}
    </motion.h2>
  );
}

function Services({ site, t }: { site: Site; t: T }) {
  const { c: C, ui, shades: SHADES, tab } = useTheme();
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <SectionTitle>{t(ui.services)}</SectionTitle>
      <motion.ul
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="mt-10 grid gap-3 sm:grid-cols-2"
      >
        {site.services.map((s, i) => (
          <motion.li
            key={s.name.ru}
            variants={{
              hidden: { opacity: 0, y: 24, scale: 0.98 },
              show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
            }}
            whileHover="hover"
            className="group flex items-center gap-4 rounded-3xl bg-white p-5 ring-1 ring-[var(--navy)]/5"
          >
            <span
              className="size-11 shrink-0"
              style={{ borderRadius: tab, background: `radial-gradient(circle at 35% 28%, #fff, transparent 45%), ${SHADES[SHADES.length - 1 - (i % SHADES.length)].hex}` }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-[family-name:var(--sm-display)] text-xl font-bold tracking-tight">{t(s.name)}</h3>
              <p className="mt-0.5 text-sm text-[var(--slate)]">{t(s.desc)}</p>
            </div>
            <motion.span
              variants={{ hover: { rotate: -45, backgroundColor: C.gum, color: "#fff" } }}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--porcelain)] text-[var(--navy)]"
            >
              →
            </motion.span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}

function Visit({ site, t }: { site: Site; t: T }) {
  const { ui, steps: STEPS } = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <SectionTitle>{t(ui.visit)}</SectionTitle>
      <div ref={ref} className="relative mt-12 pl-12">
        {/* track + scroll-linked fill */}
        <div className="absolute bottom-2 left-[15px] top-2 w-[2px] rounded bg-[var(--navy)]/10" />
        <motion.div
          style={{ scaleY: scrollYProgress }}
          className="absolute bottom-2 left-[15px] top-2 w-[2px] origin-top rounded bg-[var(--gum)]"
        />
        <ol className="space-y-12">
          {STEPS.map((s, i) => (
            <Step
              key={i}
              n={i + 1}
              title={t(s.title)}
              text={i === STEPS.length - 1 ? t(site.hours) : t(s.text)}
              progress={scrollYProgress}
              at={i / (STEPS.length - 1)}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

function Step({ n, title, text, progress, at }: { n: number; title: string; text: string; progress: MotionValue<number>; at: number }) {
  const { c: C } = useTheme();
  const lit = useTransform(progress, [Math.max(0, at - 0.08), at], [0, 1]);
  const bg = useTransform(lit, [0, 1], ["#FFFFFF", C.gum]);
  const fg = useTransform(lit, [0, 1], [C.slate, "#FFFFFF"]);
  const scale = useTransform(lit, [0, 0.5, 1], [1, 1.15, 1]);
  const opacity = useTransform(lit, [0, 1], [0.45, 1]);
  return (
    <li className="relative">
      <motion.span
        style={{ backgroundColor: bg, color: fg, scale }}
        className="absolute -left-12 top-0 grid size-8 place-items-center rounded-full font-[family-name:var(--sm-mono)] text-xs ring-1 ring-[var(--navy)]/10"
      >
        {n}
      </motion.span>
      <motion.div style={{ opacity }}>
        <h3 className="font-[family-name:var(--sm-display)] text-2xl font-bold tracking-tight">{title}</h3>
        <p className="mt-1 text-[var(--slate)]">{text}</p>
      </motion.div>
    </li>
  );
}

function Cta({ t, waHref }: { t: T; waHref: string }) {
  const { c: C, ui } = useTheme();
  return (
    <section className="px-3 py-10 sm:px-5">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-[var(--navy)] px-6 py-16 text-center text-white sm:py-20">
        <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-[var(--gum)]/30 blur-3xl" />
        {/* smile arc draws itself */}
        <svg viewBox="0 0 200 60" className="relative mx-auto mb-8 w-40" fill="none" aria-hidden>
          <motion.path
            d="M10 12 Q100 80 190 12"
            stroke={C.gum}
            strokeWidth="7"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 1.1, ease: EASE }}
          />
        </svg>
        <h2 className="relative font-[family-name:var(--sm-display)] text-[clamp(2.25rem,9vw,4rem)] font-extrabold leading-none tracking-[-0.03em]">
          {t(ui.ctaTitle)}
        </h2>
        <p className="relative mx-auto mt-5 max-w-sm text-white/70">{t(ui.ctaSub)}</p>
        <motion.a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="relative mt-9 inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-4 font-semibold text-[var(--navy)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gum)]"
        >
          <WhatsAppGlyph className="size-5 text-[var(--gum)]" />
          {t(ui.whatsapp)}
        </motion.a>
      </div>
    </section>
  );
}

function Contacts({ site, t, telHref }: { site: Site; t: T; telHref: string }) {
  const { ui } = useTheme();
  const rows: [string, string, string?][] = [
    [t(ui.address), `${t(site.city)}, ${t(site.address)}`],
    [t(ui.hours), t(site.hours)],
    [t(ui.phone), site.phone, telHref],
  ];
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <SectionTitle>{t(ui.contacts)}</SectionTitle>
      <dl className="mt-8 divide-y divide-[var(--navy)]/8 rounded-3xl bg-white px-6 ring-1 ring-[var(--navy)]/5">
        {rows.map(([k, v, href]) => (
          <div key={k} className="flex flex-col gap-1 py-5 sm:flex-row sm:items-baseline sm:justify-between">
            <dt className="font-[family-name:var(--sm-mono)] text-xs uppercase tracking-wider text-[var(--slate)]">{k}</dt>
            <dd className="text-lg font-medium">
              {href ? (
                <a href={href} className="hover:text-[var(--gum)]">
                  {v}
                </a>
              ) : (
                v
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ToothGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M7.2 2.5c-2.6 0-4.7 2-4.7 5 0 2.3.9 3.6 1.6 5.2.6 1.4.8 3 1.1 4.9.3 2 .8 3.9 2.2 3.9 1.6 0 1.6-2.4 2.2-4.4.3-1.1.8-1.800 2.4-1.8s2.1.7 2.4 1.8c.6 2 .6 4.4 2.2 4.4 1.4 0 1.9-1.9 2.2-3.9.3-1.9.5-3.5 1.1-4.9.7-1.6 1.6-2.9 1.6-5.2 0-3-2.1-5-4.7-5-1.9 0-2.9 1-4.8 1s-2.9-1-4.8-1z" />
    </svg>
  );
}

function SparkGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 2l2.1 6.6L21 10.5l-6.9 1.9L12 22l-2.1-9.6L3 10.5l6.9-1.9z" />
    </svg>
  );
}

function PhoneGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.2 2.2z" />
    </svg>
  );
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.477-.911zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}
