import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "suslicketeam",
    short_name: "suslicketeam",
    description:
      "suslicketeam builds websites, web apps and digital products end to end.",
    start_url: "/",
    display: "standalone",
    // Brand dark background (oklch(0.145 0 0)) and violet accent (oklch(0.54 0.23 280)).
    background_color: "#0a0a0a",
    theme_color: "#6d3fd6",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      // 512×512 PNG (public/icon.png, served at /icon.png) — strengthens the
      // favicon/PWA icon signal browsers and Google read. "any" purpose: the logo
      // is a round transparent mask, not padded for maskable safe-zone cropping.
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
