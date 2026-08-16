/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SANITY_PROJECT_ID: string;
  readonly PUBLIC_SANITY_DATASET: string;
  readonly PUBLIC_SANITY_API_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Cloudflare Worker runtime bindings/secrets — populated from `.dev.vars`
// locally (via the adapter's `platformProxy`) and from `wrangler secret put`
// / the Workers dashboard in production. Distinct from `ImportMetaEnv` above:
// these are read per-request at runtime, not inlined at build time.
type CloudflareEnv = {
  SANITY_API_READ_TOKEN: string;
  /** Shared secret configured on the Sanity webhook — verifies `sanity-webhook-signature` on POST /api/revalidate. See docs/cache-revalidation.md. */
  SANITY_API_WEBHOOK_SECRET: string;
};

type Runtime = import('@astrojs/cloudflare').Runtime<CloudflareEnv>;

declare namespace App {
  interface Locals extends Runtime {}
}
