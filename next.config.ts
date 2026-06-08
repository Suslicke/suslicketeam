import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);

// Initialize the OpenNext Cloudflare context for local `next dev` so that
// Cloudflare bindings (env vars, ASSETS, etc.) are available during development.
// This is a no-op outside of `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();
