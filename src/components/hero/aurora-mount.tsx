"use client";

import dynamic from "next/dynamic";

/**
 * Client-only lazy mount for the aurora gradient layer. Mirrors
 * `constellation-mount`: `next/dynamic({ ssr: false })` keeps the heavy/animated
 * layer out of the server HTML so the hero headline (the LCP element) paints
 * first; the aurora hydrates in afterwards behind the content.
 */
const HeroAurora = dynamic(
  () => import("./aurora").then((m) => m.HeroAurora),
  { ssr: false },
);

export function AuroraMount() {
  return <HeroAurora />;
}
