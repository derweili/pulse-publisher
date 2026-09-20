export interface PayloadEnv {
  PAYLOAD_API_URL: string;
  PAYLOAD_API_KEY: string;
}

/**
 * The site renders on Cloudflare Workers via SSR — every page queries
 * Payload fresh, per request, instead of once at build time (same as the
 * old Sanity setup). `PAYLOAD_API_KEY` authenticates as the service account
 * Payload's `onInit` bootstraps (see apps/cms/README.md) — content reads
 * require it (see apps/cms's `authenticated` access rule) specifically so a
 * "premium" article's body can't be fetched directly from the CMS,
 * bypassing the paywall.
 */
export async function payloadFetch<T>(
  env: PayloadEnv,
  path: string,
  searchParams?: URLSearchParams
): Promise<T> {
  const url = new URL(path, env.PAYLOAD_API_URL);
  if (searchParams) url.search = searchParams.toString();

  const res = await fetch(url, {
    headers: { Authorization: `users API-Key ${env.PAYLOAD_API_KEY}` },
  });
  if (!res.ok) {
    throw new Error(`Payload request failed (${res.status}): ${url.pathname}${url.search}`);
  }
  return res.json() as Promise<T>;
}

export interface PayloadListResponse<T> {
  docs: T[];
  totalDocs: number;
}
