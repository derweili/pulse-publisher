/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Cloudflare Worker runtime bindings/secrets — populated from `.dev.vars`
// locally (via the adapter's `platformProxy`) and from `wrangler secret put`
// / the Workers dashboard in production. Read per-request, not inlined at
// build time (unlike Sanity's PUBLIC_ vars, EmDash needs no build-time
// config at all — see lib/emdash/client.ts).
type CloudflareEnv = {
  /** Base URL of the deployed apps/cms ("pulse-cms") Worker, e.g. https://cms.pulse.derweili.de. Not a secret. */
  EMDASH_URL: string;
  /** pulse-cms personal access token, scoped to `content:read`. See docs/emdash-migration-plan.md. */
  EMDASH_API_TOKEN: string;
  /** Shared secret packages/emdash-revalidate-plugin sends as `Authorization: Bearer <value>` on POST /api/revalidate. */
  REVALIDATE_SECRET: string;
};

type Runtime = import('@astrojs/cloudflare').Runtime<CloudflareEnv>;

declare namespace App {
  interface Locals extends Runtime {}
}
