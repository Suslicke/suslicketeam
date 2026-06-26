"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";

import { buildWhatsappUrl } from "@/lib/messenger";
import {
  SITE_LANGS,
  type Localized,
  type Site,
  type SiteLang,
} from "@/content/sites";

/** UI chrome strings (everything not in the clinic data). RU authoritative. */
const UI: Record<string, Localized> = {
  book: { ru: "Записаться", kk: "Жазылу", en: "Book now" },
  call: { ru: "Позвонить", kk: "Қоңырау шалу", en: "Call" },
  draft: {
    ru: "Демонстрационный набросок сайта · сделано в",
    kk: "Сайттың демо-нобайы · жасаған",
    en: "Demo site draft · made by",
  },
  whatsapp: {
    ru: "Написать в WhatsApp",
    kk: "WhatsApp-қа жазу",
    en: "Message on WhatsApp",
  },
  twogis: { ru: "Открыть в 2ГИС", kk: "2ГИС-те ашу", en: "Open in 2GIS" },
  services: { ru: "Услуги", kk: "Қызметтер", en: "Services" },
  works: { ru: "Наши работы", kk: "Біздің жұмыстар", en: "Our work" },
  worksSub: {
    ru: "Реальные результаты наших пациентов",
    kk: "Пациенттеріміздің нақты нәтижелері",
    en: "Real results from our patients",
  },
  findUs: { ru: "Как нас найти", kk: "Бізді қалай табуға болады", en: "Find us" },
  addressLabel: { ru: "Адрес", kk: "Мекенжай", en: "Address" },
  hoursLabel: { ru: "Часы работы", kk: "Жұмыс уақыты", en: "Hours" },
  phoneLabel: { ru: "Телефон", kk: "Телефон", en: "Phone" },
  reviews: { ru: "отзывов в 2ГИС", kk: "2ГИС-те пікір", en: "reviews on 2GIS" },
  freeConsult: {
    ru: "Консультация бесплатно",
    kk: "Консультация тегін",
    en: "Free consultation",
  },
  byAppointment: {
    ru: "Приём по записи",
    kk: "Жазылу бойынша",
    en: "By appointment",
  },
  ctaTitle: {
    ru: "Готовы к здоровой улыбке?",
    kk: "Сау күлкіге дайынсыз ба?",
    en: "Ready for a healthy smile?",
  },
  ctaSub: {
    ru: "Напишите в WhatsApp — ответим и подберём удобное время.",
    kk: "WhatsApp-қа жазыңыз — жауап беріп, ыңғайлы уақыт таңдаймыз.",
    en: "Message us on WhatsApp — we'll reply and find a convenient time.",
  },
  madeBy: { ru: "Сделано в", kk: "Жасаған", en: "Made by" },
};

/** Decorative section numeral + label with a gold hairline rule. */
function SectionHead({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="font-display text-2xl text-[var(--gold)] tabular-nums">
        {num}
      </span>
      <span className="h-px flex-1 bg-[var(--gold)]/40" />
      <span className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--muted)]">
        {label}
      </span>
    </div>
  );
}

export function ClinicSite({ site }: { site: Site }) {
  const [lang, setLang] = useState<SiteLang>("ru");
  const t = (l: Localized) => l[lang];

  const waHref = buildWhatsappUrl({
    number: site.whatsapp,
    text: t(site.whatsappPrefill),
  });
  const telHref = `tel:${site.phone.replace(/[^\d+]/g, "")}`;

  const rootStyle = {
    "--accent": site.accent,
    "--gold": "#c2a36b",
    "--ink": "#17211e",
    "--muted": "#5f6b65",
    "--canvas": "#f7f5f0",
    "--font-display": "var(--font-playfair), Georgia, serif",
    "--font-sans": "var(--font-manrope), ui-sans-serif, system-ui, sans-serif",
  } as CSSProperties;

  // Primary action button (accent fill).
  const PrimaryCTA = ({ className = "" }: { className?: string }) => (
    <a
      href={waHref}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${className}`}
    >
      <WhatsAppGlyph className="size-4" />
      {t(UI.whatsapp)}
    </a>
  );

  return (
    <main
      style={rootStyle}
      className="min-h-screen bg-[var(--canvas)] font-sans text-[var(--ink)] selection:bg-[var(--accent)]/20"
    >
      {/* ── Demo-draft credit bar (honest framing for the prospect) ─ */}
      <div className="bg-[var(--ink)] px-5 py-2 text-center text-xs text-white/80">
        {t(UI.draft)}{" "}
        <a
          href="https://suslicketeam.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[var(--gold)] underline-offset-2 hover:underline"
        >
          suslicketeam
        </a>
      </div>

      {/* ── Top bar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-black/5 bg-[var(--canvas)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <span className="font-display text-xl font-semibold tracking-tight">
            {site.name}
          </span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-xs font-medium">
              {SITE_LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`rounded-full px-2.5 py-1 uppercase tracking-wide transition ${
                    lang === l
                      ? "bg-[var(--ink)] text-[var(--canvas)]"
                      : "text-[var(--muted)] hover:text-[var(--ink)]"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden rounded-full border border-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white sm:inline-block"
            >
              {t(UI.book)}
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 pb-16 pt-16 sm:pt-24">
        <div className="duration-700 animate-in fade-in slide-in-from-bottom-4">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[var(--accent)]">
            {t(site.kind)} · {t(site.city)}
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.05] sm:text-7xl">
            {t(site.headline)}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--muted)]">
            {t(site.subhead)}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <PrimaryCTA />
            <a
              href={telHref}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--ink)]/15 px-7 py-3.5 text-sm font-semibold transition hover:border-[var(--ink)]/40"
            >
              <PhoneGlyph className="size-4" />
              {t(UI.call)}
            </a>
          </div>
          {site.twogis && (
            <a
              href={site.twogis}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-medium text-[var(--accent)] underline-offset-4 hover:underline"
            >
              {t(UI.twogis)} →
            </a>
          )}
        </div>

        {/* Stat row — editorial, hairline-divided. `hours` is "<day>, <time>". */}
        <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-black/5 bg-black/5 sm:grid-cols-4">
          {site.rating != null && (
            <Stat
              value={`${site.rating} ★`}
              label={`${site.reviewsCount ?? ""}+ ${t(UI.reviews)}`}
            />
          )}
          <Stat value="0 ₸" label={t(UI.freeConsult)} />
          <Stat value="✓" label={t(UI.byAppointment)} />
          {(() => {
            const [day, time] = t(site.hours).split(/,\s*/);
            return <Stat value={time ?? day} label={time ? day : t(UI.hoursLabel)} />;
          })()}
        </dl>
      </section>

      {/* ── Services ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <SectionHead num="01" label={t(UI.services)} />
        <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-black/5 bg-black/5 sm:grid-cols-2 lg:grid-cols-3">
          {site.services.map((s) => (
            <div
              key={s.name.ru}
              className="group bg-white p-7 transition hover:bg-[color-mix(in_oklab,var(--accent)_5%,white)]"
            >
              <h3 className="font-display text-2xl">{t(s.name)}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {t(s.desc)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Results gallery ─────────────────────────────────────── */}
      {site.photos.length > 0 && (
        <section className="mx-auto max-w-5xl px-5 py-16">
          <SectionHead num="02" label={t(UI.works)} />
          <p className="mt-6 max-w-md font-display text-3xl leading-snug">
            {t(UI.worksSub)}
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {site.photos.map((src, i) => (
              <div
                key={src}
                className="relative aspect-[4/5] overflow-hidden rounded-xl border border-black/5 bg-black/5"
              >
                <Image
                  src={src}
                  alt={`${site.name} — ${t(UI.works)} ${i + 1}`}
                  fill
                  sizes="(min-width: 640px) 25vw, 50vw"
                  className="object-cover object-top transition duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Find us ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <SectionHead num="03" label={t(UI.findUs)} />
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          <Detail label={t(UI.addressLabel)} value={t(site.address)} />
          <Detail label={t(UI.hoursLabel)} value={t(site.hours)} />
          <Detail label={t(UI.phoneLabel)} value={site.phone} href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} />
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          {site.twogis && (
            <a
              href={site.twogis}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
            >
              {t(UI.twogis)} →
            </a>
          )}
          {site.instagram && (
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
            >
              Instagram →
            </a>
          )}
        </div>
      </section>

      {/* ── Final CTA band ──────────────────────────────────────── */}
      <section className="px-5 py-16">
        <div className="mx-auto max-w-5xl rounded-3xl bg-[var(--accent)] px-8 py-16 text-center text-white sm:py-20">
          <h2 className="mx-auto max-w-2xl font-display text-4xl leading-tight sm:text-5xl">
            {t(UI.ctaTitle)}
          </h2>
          <p className="mx-auto mt-5 max-w-md text-white/85">{t(UI.ctaSub)}</p>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-9 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-[var(--accent)] shadow-sm transition hover:bg-white/90"
          >
            <WhatsAppGlyph className="size-4" />
            {t(UI.whatsapp)}
          </a>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-black/5">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-10 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-base text-[var(--ink)]">{site.name}</p>
            <p className="mt-1">{t(site.address)} · {site.phone}</p>
          </div>
          <p>
            {t(UI.madeBy)}{" "}
            <a
              href="https://suslicketeam.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--ink)] underline-offset-4 hover:underline"
            >
              suslicketeam
            </a>
          </p>
        </div>
      </footer>

      {/* Spacer so the sticky bar never covers the footer on mobile. */}
      <div className="h-16 sm:hidden" />

      {/* ── Sticky bottom bar (mobile: book or call) ────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-black/10 bg-[var(--canvas)]/95 p-3 backdrop-blur-md sm:hidden">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white"
        >
          <WhatsAppGlyph className="size-4" />
          {t(UI.book)}
        </a>
        <a
          href={telHref}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--ink)]/15 py-3 text-sm font-semibold text-[var(--ink)]"
        >
          <PhoneGlyph className="size-4" />
          {t(UI.call)}
        </a>
      </div>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white px-5 py-6 text-center">
      <dt className="font-display text-2xl text-[var(--ink)]">{value}</dt>
      <dd className="mt-1 text-xs leading-tight text-[var(--muted)]">{label}</dd>
    </div>
  );
}

function Detail({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
        {label}
      </p>
      {href ? (
        <a href={href} className="mt-2 block text-lg hover:text-[var(--accent)]">
          {value}
        </a>
      ) : (
        <p className="mt-2 text-lg">{value}</p>
      )}
    </div>
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
