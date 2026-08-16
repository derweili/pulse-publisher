const TRACKING_PARAM_PREFIX = /^utm_/;
const TRACKING_PARAM_EXACT = new Set(["fbclid", "gclid"]);

/**
 * The origin response for anonymized requests is cached and shared globally
 * across all readers (Workers Cache on apps/site), so any reader-specific
 * input on the request either fragments that shared cache (a different entry
 * per visitor for what should be one shared response) or leaks one reader's
 * data into a response another reader will see. Strip everything that varies
 * by reader before the request reaches the origin.
 */
export function anonymize(request: Request): Request {
  const url = new URL(request.url);
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAM_PREFIX.test(key) || TRACKING_PARAM_EXACT.has(key)) {
      url.searchParams.delete(key);
    }
  }

  // `new Request(url, request)` copies method/headers/body/etc. from `request`
  // (per the Fetch API spec, and the same pattern @monetizationos/proxy's own
  // originRequest.js uses internally) — a `{...request}` spread would not work,
  // since Request's fields are prototype getters, not own-enumerable properties.
  const anonymized = new Request(url, request);
  anonymized.headers.delete("Cookie");
  anonymized.headers.delete("Authorization");
  return anonymized;
}
