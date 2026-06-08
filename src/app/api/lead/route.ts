import { NextResponse } from "next/server";

import { formatTelegramMessage } from "@/lib/lead-format";
import { leadSchema, type LeadInput } from "@/lib/lead-schema";

// Force this route to run on every request (never statically prerendered) so
// the rate-limit map and env-based fan-out always execute server-side.
export const dynamic = "force-dynamic";

// --- Rate limiting -------------------------------------------------------
// Simple in-memory fixed-window limiter keyed by client IP.
//
// NOTE: this is best-effort only. On Cloudflare/serverless each instance has
// its own memory, so a determined client can exceed the limit by hitting
// different instances. For real protection this should move to a shared store
// (Cloudflare KV / Durable Object / Upstash) — tracked as a Phase 7 follow-up.
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // First hop is the original client.
    return forwarded.split(",")[0]!.trim();
  }
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

// --- Sink fan-out --------------------------------------------------------
const SINK_TIMEOUT_MS = 5000;

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SINK_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function sendToTelegram(lead: LeadInput): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  const res = await fetchWithTimeout(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      // No parse_mode: plain text, injection-safe (see lead-format.ts).
      body: JSON.stringify({
        chat_id: chatId,
        text: formatTelegramMessage(lead),
        disable_web_page_preview: true,
      }),
    },
  );
  return res.ok;
}

async function sendToSheet(lead: LeadInput): Promise<boolean> {
  const url = process.env.LEADS_SHEET_WEBHOOK_URL;
  if (!url) return false;

  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(lead),
  });
  return res.ok;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  // Honeypot check BEFORE schema validation: a bot that filled `company` gets a
  // fake success (200) and is silently dropped, so it can't tell it was caught.
  // A genuine validation error falls through to safeParse → 400 below.
  if (
    body !== null &&
    typeof body === "object" &&
    typeof (body as { company?: unknown }).company === "string" &&
    (body as { company: string }).company.length > 0
  ) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    // Do not echo zod internals back to the client.
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429 },
    );
  }

  const lead = parsed.data;

  const hasSink = Boolean(
    (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) ||
      process.env.LEADS_SHEET_WEBHOOK_URL,
  );

  if (!hasSink) {
    // Dev / e2e environment: nothing configured. Don't fail the user, but make
    // it observable that the lead wasn't actually delivered anywhere.
    console.warn("[lead] no sink configured, dropping lead", {
      projectType: lead.projectType,
      page: lead.page,
    });
    return NextResponse.json({ ok: true, delivered: false }, { status: 200 });
  }

  // Best-effort fan-out: a hanging or failing sink must not fail the user.
  const results = await Promise.allSettled([
    sendToTelegram(lead),
    sendToSheet(lead),
  ]);

  let delivered = false;
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      delivered = true;
    } else if (result.status === "rejected") {
      console.warn("[lead] sink failed", result.reason);
    }
  }

  return NextResponse.json({ ok: true, delivered }, { status: 200 });
}
