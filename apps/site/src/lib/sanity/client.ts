import { createClient, type SanityClient } from "@sanity/client";

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || "production";
const apiVersion = import.meta.env.PUBLIC_SANITY_API_VERSION || "2025-02-01";

if (!projectId) {
  throw new Error(
    "Missing PUBLIC_SANITY_PROJECT_ID. Copy .env.example to .env and fill it in."
  );
}

interface SanityRuntimeEnv {
  SANITY_API_READ_TOKEN?: string;
}

// The site renders on Cloudflare Workers via SSR — every page queries
// Sanity fresh, per request, instead of once at build time. The read token
// is therefore a Worker runtime secret (see env.d.ts's `CloudflareEnv`)
// rather than a build-time env var, so the client is built per request from
// `Astro.locals.runtime.env` instead of once at module load.
export function getSanityClient(env: SanityRuntimeEnv): SanityClient {
  return createClient({
    projectId,
    dataset,
    apiVersion,
    token: env.SANITY_API_READ_TOKEN,
    useCdn: false,
    perspective: "published",
  });
}
