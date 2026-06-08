import type { UtmParams } from "./utm";

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
  const details: string[] = [];
  if (page) details.push(`страница: ${page}`);
  if (utm) {
    const summary = summarizeUtm(utm);
    if (summary) details.push(summary);
  }

  const suffix = details.length > 0 ? ` (${details.join(", ")})` : "";
  return `Здравствуйте! Пишу с сайта${suffix}.`;
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
 * Build a Telegram deep link from a username (leading `@` is stripped).
 *
 * Note: t.me does not reliably support prefilled message text via URL, so an
 * optional `text` is intentionally ignored — we just link to the profile.
 */
export function buildTelegramUrl(opts: {
  username: string;
  text?: string;
}): string {
  // Telegram usernames are alphanumeric + underscore only; strip a leading `@`
  // and any other characters so a dynamic source can't inject path traversal.
  const username = opts.username.replace(/^@/, "").replace(/[^A-Za-z0-9_]/g, "");
  if (!username) {
    throw new Error(
      `buildTelegramUrl: username resolved to empty from "${opts.username}"`,
    );
  }
  return `https://t.me/${username}`;
}
