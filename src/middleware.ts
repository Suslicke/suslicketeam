import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/**
 * Offline short-links (printed business cards, shirts, stickers): a short,
 * memorable locale-less path that 307-redirects to the homepage with campaign
 * UTMs attached, so first-touch attribution (`utm-capture`) records the source.
 *
 * The redirect targets `/` (not a locale), so the follow-up request is
 * localized normally by next-intl — which preserves the query string — landing
 * the visitor on e.g. `/en?utm_source=shirt…` in their detected language.
 *
 * Keys are lowercase, trailing-slash-stripped paths. Add new cards/merch here.
 */
const SHORT_LINKS: Record<string, string> = {
  "/card": "utm_source=shirt&utm_medium=offline&utm_campaign=networking",
};

export default function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/\/+$/, "").toLowerCase();
  const utm = SHORT_LINKS[path];

  if (utm) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = utm;
    return NextResponse.redirect(url, 307);
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/sites`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  // `/sites/*` are standalone, locale-less demo client landings (own root
  // layout) — exclude them so next-intl doesn't 307 them to `/en/sites/*`.
  matcher: "/((?!api|sites|_next|_vercel|.*\\..*).*)",
};
