import { NextResponse } from "next/server";
import { z } from "zod";

// Always run server-side (never prerendered): the webhook fan-out and the
// in-memory rate-limit must execute per request.
export const dynamic = "force-dynamic";

// Stable answer keys mirror `qrWelcome.options.*` in the messages.
const ANSWERS = ["shirt", "met", "event", "friend", "other"] as const;

const surveySchema = z.object({
  answer: z.enum(ANSWERS),
  detail: z.string().max(500).optional(),
  source: z.string().max(100).optional(),
  campaign: z.string().max(100).optional(),
  page: z.string().max(300).optional(),
});

type SurveyInput = z.infer<typeof surveySchema>;

// --- Light rate limit (best-effort, per-instance memory) -----------------
const RATE_LIMIT_MAX = 8;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const buckets = new Map<string, { count: number; resetAt: number }>();

// Reject POSTs that don't originate from our own site (a same-origin browser
// fetch always sends Origin on POST; Referer is the fallback). Not a strong
// control on its own — a crafted request can forge these — but it cheaply
// blocks other websites' browsers and header-less bots. The Apps Script shared
// token (below, forwarded as `token`) is what actually protects the Sheet.
function isSameOrigin(request: Request): boolean {
  const host = request.headers.get("host");
  if (!host) return false;
  const origin =
    request.headers.get("origin") ?? request.headers.get("referer");
  if (!origin) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function getClientIp(request: Request): string {
  // Trust only proxy-set headers (Cloudflare sets cf-connecting-ip on every
  // request). X-Forwarded-For is client-controllable, so a spoofed value would
  // let an attacker rotate the rate-limit key — ignore it here.
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

// --- Google Sheet sink ---------------------------------------------------
// Apps Script runs doPost (the actual append) before returning its redirect, so
// a cold call can take several seconds — give it generous headroom.
const SINK_TIMEOUT_MS = 10000;

// Neutralise spreadsheet formula injection: a value a Sheet would interpret as
// a formula (leading = + - @ or a control char) is prefixed with an apostrophe
// so it's stored as literal text. Applied to every free-text field before it
// reaches the Google Sheet (answer is a fixed enum, receivedAt is server-set).
function deformula(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

async function sendToSheet(payload: SurveyInput): Promise<boolean> {
  const url = process.env.QR_SURVEY_WEBHOOK_URL;
  if (!url) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SINK_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // `signal` so the timeout actually aborts a hanging webhook (otherwise the
      // request could block for the full platform timeout).
      signal: controller.signal,
      body: JSON.stringify({
        // Shared secret the Apps Script verifies, so knowing the /exec URL
        // alone isn't enough to write to the Sheet.
        token: process.env.QR_SURVEY_TOKEN ?? "",
        answer: payload.answer,
        detail: deformula(payload.detail),
        source: deformula(payload.source),
        campaign: deformula(payload.campaign),
        page: deformula(payload.page),
        receivedAt: new Date().toISOString(),
      }),
    });
    return res.ok;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const parsed = surveySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429 },
    );
  }

  const url = process.env.QR_SURVEY_WEBHOOK_URL;
  if (!url) {
    // Dev / not configured: don't fail the user, but make the drop observable.
    console.warn("[qr-survey] no webhook configured, dropping response", {
      answer: parsed.data.answer,
    });
    return NextResponse.json({ ok: true, delivered: false }, { status: 200 });
  }

  let delivered = false;
  try {
    delivered = await sendToSheet(parsed.data);
  } catch (err) {
    console.warn("[qr-survey] sheet sink failed", err);
  }

  return NextResponse.json({ ok: true, delivered }, { status: 200 });
}
