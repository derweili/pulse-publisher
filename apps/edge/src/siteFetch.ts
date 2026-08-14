import type { Env } from "./env";

/**
 * The single place that decides how to reach apps/site. In every real
 * environment this is the `SITE` service binding. Locally, the service
 * binding only resolves if apps/site is also running via `wrangler dev` (it
 * registers itself in wrangler's local multi-worker registry) — plain
 * `astro dev` never does, so a fast HMR loop against `astro dev` needs a
 * plain HTTP fallback instead. `env.SITE_DEV_ORIGIN` (see env.ts) opts into
 * that fallback; it's never present outside of local dev.
 */
export function siteFetch(request: Request, env: Env): Promise<Response> {
  if (env.SITE_DEV_ORIGIN) {
    const url = new URL(request.url);
    const dev = new URL(env.SITE_DEV_ORIGIN);
    url.protocol = dev.protocol;
    url.host = dev.host; // includes port
    return fetch(new Request(url, request));
  }
  return env.SITE.fetch(request);
}
