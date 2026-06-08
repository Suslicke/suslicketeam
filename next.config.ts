import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // The OpenNext Cloudflare adapter does not run Next.js' built-in image
  // optimizer (/_next/image returns 400 on Workers). Serve images as-is.
  // Our images (founder photo, etc.) are already sized/compressed at source.
  images: {
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);

// Initialize the OpenNext Cloudflare context for local `next dev` so that
// Cloudflare bindings (env vars, ASSETS, etc.) are available during development.
// This is a no-op outside of `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();
