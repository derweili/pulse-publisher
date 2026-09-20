/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_CLERK_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Cloudflare Worker runtime bindings/secrets/vars — populated from
// `.dev.vars` locally (via the adapter's `platformProxy`) and from
// `wrangler secret put` / the `[vars]` block in wrangler.toml / the
// Workers dashboard in production. Distinct from `ImportMetaEnv` above:
// these are read per-request at runtime, not inlined at build time.
type CloudflareEnv = {
  /** apps/cms's public URL, e.g. https://cms.pulse.derweili.de — a `[vars]` entry in wrangler.toml, not a secret. */
  PAYLOAD_API_URL: string;
  /** Authenticates as the service account apps/cms bootstraps — see apps/cms/README.md "Connecting apps/site". */
  PAYLOAD_API_KEY: string;
  /** Shared secret configured on apps/cms's revalidate webhook — verifies the `webhook-signature` header on POST /api/revalidate. See docs/cache-revalidation.md. */
  PAYLOAD_WEBHOOK_SECRET: string;
};

type Runtime = import('@astrojs/cloudflare').Runtime<CloudflareEnv>;

declare namespace App {
  interface Locals extends Runtime {}
}
