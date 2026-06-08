const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
] as const;

type UtmKey = (typeof UTM_KEYS)[number];

export type UtmParams = Partial<Record<UtmKey, string>>;

const STORAGE_KEY = "sl_utm";

/**
 * Parse a query string (with or without leading `?`) into a whitelisted set of
 * UTM / click-id params. Empty or unknown values are dropped.
 */
export function parseUtm(search: string): UtmParams {
  const normalized = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(normalized);
  const result: UtmParams = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) {
      // Cap length so a manipulated inbound URL can't bloat the prefilled
      // messenger text past WhatsApp's ~4096-char limit (silent CTA failure).
      result[key] = value.slice(0, 200);
    }
  }

  return result;
}

/**
 * Parse the given search string and persist it to sessionStorage under
 * `sl_utm`. First-touch wins: if a non-empty value is already stored, it is not
 * overwritten. No-op during SSR.
 */
export function persistUtm(search: string): void {
  if (typeof window === "undefined") return;

  const existing = getStoredUtm();
  if (Object.keys(existing).length > 0) return;

  const parsed = parseUtm(search);
  if (Object.keys(parsed).length === 0) return;

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore storage failures (quota, disabled storage, etc.)
  }
}

/**
 * Read the stored UTM params from sessionStorage. Returns `{}` when absent,
 * invalid, or during SSR.
 */
export function getStoredUtm(): UtmParams {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    // Re-validate key/value shapes — a tampered storage entry on the same
    // origin must not produce an unsound UtmParams cast.
    const safe: UtmParams = {};
    for (const key of UTM_KEYS) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === "string" && value) safe[key] = value;
    }
    return safe;
  } catch {
    return {};
  }
}
