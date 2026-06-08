import { siteConfig } from "./config";
import type { UtmParams } from "./utm";

/** Bare host for the greeting, e.g. "suslicketeam.com" (no protocol / trailing slash). */
const SITE_HOST = siteConfig.url.replace(/^https?:\/\//, "").replace(/\/+$/, "");

/**
 * Compose a short, human-readable UTM summary for the default greeting,
 * e.g. "источник: instagram, кампания: jan".
 */
function summarizeUtm(utm: UtmParams): string {
  const labels: Partial<Record<keyof UtmParams, string>> = {
    utm_source: "источник",
    utm_medium: "канал",
    utm_campaign: "кампания",
    utm_content: "контент",
    utm_term: "запрос",
    gclid: "gclid",
    fbclid: "fbclid",
  };

  const parts: string[] = [];
  for (const key of Object.keys(labels) as (keyof UtmParams)[]) {
    const value = utm[key];
    if (value) {
      parts.push(`${labels[key]}: ${value}`);
    }
  }
  return parts.join(", ");
}

/**
 * Build the default Russian greeting that embeds the current page and a short
 * UTM summary when available.
 */
function defaultGreeting(page?: string, utm?: UtmParams): string {
  // Combine host + path into a single readable URL, e.g. "suslicketeam.com/ru/contact".
  const url = page ? `${SITE_HOST}${page}` : SITE_HOST;
  const utmSummary = utm ? summarizeUtm(utm) : "";
  const suffix = utmSummary ? ` (${utmSummary})` : "";
  return `Здравствуйте! Пишу с сайта ${url}${suffix}.`;
}

/**
 * Build a WhatsApp click-to-chat URL. The number is reduced to digits only so
 * inputs like "+7 706 699 88 79" work. When `text` is omitted, a default
 * Russian greeting is composed from `page` and `utm`.
 */
export function buildWhatsappUrl(opts: {
  number: string;
  text?: string;
  page?: string;
  utm?: UtmParams;
}): string {
  const digits = opts.number.replace(/\D/g, "");
  if (!digits) {
    throw new Error(
      `buildWhatsappUrl: number resolved to empty string from "${opts.number}"`,
    );
  }
  const text = opts.text ?? defaultGreeting(opts.page, opts.utm);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/**
 * Build a Telegram link from a username (leading `@` is stripped). Appends a
 * prefilled `?text=` (same default greeting as WhatsApp, with page + UTM) so the
 * chat opens with the message ready. If a Telegram client ignores the param it
 * harmlessly degrades to just opening the chat.
 */
export function buildTelegramUrl(opts: {
  username: string;
  text?: string;
  page?: string;
  utm?: UtmParams;
}): string {
  // Telegram usernames are alphanumeric + underscore only; strip a leading `@`
  // and any other characters so a dynamic source can't inject path traversal.
  const username = opts.username.replace(/^@/, "").replace(/[^A-Za-z0-9_]/g, "");
  if (!username) {
    throw new Error(
      `buildTelegramUrl: username resolved to empty from "${opts.username}"`,
    );
  }
  const text = opts.text ?? defaultGreeting(opts.page, opts.utm);
  return `https://t.me/${username}?text=${encodeURIComponent(text)}`;
}
