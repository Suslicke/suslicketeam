import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Minimal OpenNext Cloudflare config. The site is almost entirely static
// (SSG); only `/api/lead` is force-dynamic. We do not enable a KV/R2 ISR
// incremental cache here because there is no on-demand revalidation — static
// assets are served from the ASSETS binding. If ISR/revalidation is added
// later, wire up an incrementalCache override here (e.g. kvIncrementalCache)
// and add the matching KV namespace to wrangler.jsonc.
export default defineCloudflareConfig({});
