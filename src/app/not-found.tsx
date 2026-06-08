import Link from "next/link";

import { siteConfig } from "@/lib/config";

/**
 * Root-level 404 fallback. Rendered for paths that never reach the `[locale]`
 * segment (e.g. a top-level unmatched URL), so there is no locale context and
 * no root layout — this file must supply its own <html>/<body>. We default to
 * English (the default locale) with a Russian line for RU visitors.
 */
export default function RootNotFound() {
  return (
    <html lang={siteConfig.defaultLocale}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#0a0a0a",
          color: "#fafafa",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "32rem", textAlign: "center" }}>
          <p style={{ fontSize: "3.5rem", fontWeight: 700, margin: 0 }}>404</p>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: "1rem" }}>
            Page not found
          </h1>
          <p style={{ marginTop: "0.75rem", opacity: 0.7 }}>
            Страница не найдена. The link may be outdated.
          </p>
          <p style={{ marginTop: "1.5rem" }}>
            <Link
              href={`/${siteConfig.defaultLocale}`}
              style={{ color: "#fafafa", textDecoration: "underline" }}
            >
              Go home / На главную
            </Link>
          </p>
        </div>
      </body>
    </html>
  );
}
