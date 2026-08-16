import { anonymize } from "./anonymize";
import type { Env } from "./env";
import { siteFetch } from "./siteFetch";

/** Reader-specific JSON. Safe to forward verbatim only because apps/site's
 * middleware sets `private, no-store` on every route under /api/. */
const READER_JSON = /^\/api\//;

/** Public non-HTML: cached and shared across all readers, so it must be
 * anonymized even though it bypasses the mOS pipeline entirely. */
const PUBLIC_STATIC = /^\/(_astro\/|favicon|robots\.txt|rss\.xml|sitemap\.xml|search-index\.json)/;

/**
 * Evaluated before the mOS proxy is constructed. Returns a Response for the
 * two groups that should never reach the pipeline (reader JSON, public
 * static/feeds), or `null` to fall through to the full mOS pipeline (HTML,
 * and /mos-endpoints/* — the proxy's own endpoint routing runs inside
 * `MOSProxy.handle()`, so it must never be intercepted here first).
 */
export function routeRequest(request: Request, env: Env): Promise<Response> | null {
  const { pathname } = new URL(request.url);

  if (READER_JSON.test(pathname)) {
    return siteFetch(request, env);
  }
  if (PUBLIC_STATIC.test(pathname)) {
    return siteFetch(anonymize(request), env);
  }
  return null;
}
