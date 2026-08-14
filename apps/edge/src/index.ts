import { MOSProxy, MOSProxyBuilder } from "@monetizationos/proxy";
import { anonymize } from "./anonymize";
import type { Env } from "./env";
import { createCloudflareHtmlRewriterAdapter } from "./htmlRewriterAdapter";
import { routeRequest } from "./router";

// `env` bindings aren't available at module-load time in Workers, so the
// proxy can't be built at the top level — but it only needs building once
// per isolate (config normalization + regex compilation, not per-request
// state), so it's memoized here rather than rebuilt on every request.
let proxy: MOSProxy | undefined;

function getProxy(env: Env): MOSProxy {
  if (!proxy) {
    proxy = new MOSProxyBuilder()
      .withConfig({
        originUrl: env.ORIGIN_URL,
        surfaceSlug: env.MOS_SURFACE_SLUG,
        mosHost: env.MOS_HOST,
        mosSecretKey: env.MOS_SECRET_KEY,
        anonymousSessionCookieName: "mos-anon",
        authenticatedUserJwtCookieName: "__session",
        // mosEndpointsPrefix left at its default ("/mos-endpoints/").
        // surfaceDecisionsIgnorePaths intentionally left unset — router.ts
        // already keeps non-HTML paths out of the pipeline; duplicating
        // that here would just be a second list that can drift from it.
      })
      .withOriginFetcher((request) => env.SITE.fetch(anonymize(request)))
      .withHtmlRewriter(createCloudflareHtmlRewriterAdapter())
      .build();
  }
  return proxy;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const routed = routeRequest(request, env);
    if (routed) return routed;
    return getProxy(env).handle(request);
  },
};
