// Cloudflare's own `Fetcher` (the service-binding type) is aliased on import —
// `@monetizationos/proxy` exports a same-named `Fetcher` type
// (`(request: Request) => Promise<Response>`) for its origin/API fetcher adapters,
// and both are used together in index.ts.
import type { Fetcher as ServiceFetcher } from "@cloudflare/workers-types";

export interface Env {
  /** Service binding to `pulse-today` (apps/site). */
  SITE: ServiceFetcher;
  /** MonetizationOS secret key, format `sk_<env>_<suffix>`. Set via `wrangler secret put` / `.dev.vars`. */
  MOS_SECRET_KEY: string;
  MOS_SURFACE_SLUG: string;
  MOS_HOST: string;
  ORIGIN_URL: string;
}
