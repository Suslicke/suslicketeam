import type { ReactNode } from "react";
import { Manrope, Playfair_Display } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";

import "../globals.css";

/**
 * Standalone root layout for demo client sites (/sites/<slug>).
 *
 * This is a SECOND root layout (sibling to [locale]/layout.tsx): it renders its
 * own <html>/<body> and shares none of the marketing-site chrome. It reuses the
 * Tailwind v4 token system from globals.css but swaps the fonts for an editorial
 * pairing (Playfair Display + Manrope, both Cyrillic-capable) so these pages
 * read as bespoke client work, not as our own site. Theme is forced light —
 * clinic landings want a bright, clinical canvas.
 */
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export default function SitesLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${manrope.variable} ${playfair.variable}`}
    >
      <body className="antialiased">
        <ThemeProvider forcedTheme="light">{children}</ThemeProvider>
      </body>
    </html>
  );
}
