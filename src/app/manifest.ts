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
      // TODO: add real PWA icons (192x192, 512x512, maskable PNGs) once assets exist.
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
