import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

import type { Locale } from "@/lib/config";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// NOTE: Uses the standard Next.js `ImageResponse`. OG generation must be
// re-validated under OpenNext / Cloudflare (edge runtime compat) in Phase 7.

export const alt = "suslicketeam — web development and digital solutions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand palette (matches globals.css): dark bg oklch(0.145 0 0) ≈ #0a0a0a,
// violet accent oklch(0.54 0.23 280) ≈ #6d3fd6.
const BG = "#0a0a0a";
const ACCENT = "#6d3fd6";
const FG = "#fafafa";
const MUTED = "#a1a1aa";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale: locale as Locale, namespace: "meta" });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: BG,
          padding: "96px",
          position: "relative",
        }}
      >
        {/* Subtle accent glow in the corner. */}
        <div
          style={{
            position: "absolute",
            top: "-160px",
            right: "-160px",
            width: "520px",
            height: "520px",
            borderRadius: "9999px",
            background: ACCENT,
            opacity: 0.35,
            filter: "blur(40px)",
            display: "flex",
          }}
        />
        {/* Accent bar. */}
        <div
          style={{
            width: "120px",
            height: "10px",
            borderRadius: "9999px",
            backgroundColor: ACCENT,
            marginBottom: "40px",
            display: "flex",
          }}
        />
        <div
          style={{
            fontSize: "104px",
            fontWeight: 700,
            color: FG,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            display: "flex",
          }}
        >
          suslicketeam
        </div>
        <div
          style={{
            marginTop: "32px",
            fontSize: "44px",
            color: MUTED,
            maxWidth: "900px",
            lineHeight: 1.25,
            display: "flex",
          }}
        >
          {t("og_tagline")}
        </div>
      </div>
    ),
    { ...size },
  );
}
