// Thin REST client for the EmDash CMS deployed as apps/cms ("pulse-cms").
//
// EmDash is normally used in-process (an Astro app mounts the `emdash()`
// integration itself and calls `getEmDashCollection()` etc. directly against
// its own database). CLAUDE.md requires apps/site to stay unreachable and
// auth-blind, which rules out mounting EmDash's admin (and its passkey auth)
// here — so apps/site instead reads PUBLISHED content from apps/cms over
// EmDash's documented REST API (https://docs.emdashcms.com/reference/rest-api/),
// the same relationship this app used to have with Sanity's hosted API. See
// docs/emdash-migration-plan.md for the full rationale.
//
// Query shape confirmed against EmDash 1.0.0's own source (`src/api/schemas/
// content.ts`'s `contentListQuery`): list endpoints take `status`, a single
// `orderBy` field name + `order` (asc/desc), and cursor pagination
// (`cursor`, `limit`, max 100) — there is no server-side `where`/filter
// parameter. content.ts therefore fetches full (paginated) collections and
// filters/joins client-side; see its module comment.
//
// The site renders via SSR on Cloudflare Workers — every page queries EmDash
// fresh, per request — so the client is built per request from
// `Astro.locals.runtime.env` (see env.d.ts's `CloudflareEnv`) rather than a
// module-level singleton.

export interface EmdashRuntimeEnv {
  EMDASH_URL: string;
  EMDASH_API_TOKEN: string;
}

interface EmdashSuccessEnvelope<T> {
  success: true;
  data: T;
}
interface EmdashErrorEnvelope {
  success: false;
  error: { code: string; message: string };
}

export class EmdashApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "EmdashApiError";
  }
}

export interface EmdashClient {
  readonly baseUrl: string;
  /** GET a JSON envelope from `/_emdash/api${path}` and unwrap `data`. Returns `undefined` on a 404 rather than throwing. */
  get<T>(path: string, query?: QueryParams): Promise<T | undefined>;
  /** Per-request memoization cache for expensive/repeated lookups (full collection fetches, media resolution, ...). */
  readonly cache: Map<string, unknown>;
}

export type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryValue>;

export function getEmdashClient(env: EmdashRuntimeEnv): EmdashClient {
  if (!env.EMDASH_URL) {
    throw new Error("Missing EMDASH_URL runtime env var. Copy .dev.vars.example to .dev.vars and fill it in.");
  }
  const baseUrl = env.EMDASH_URL.replace(/\/+$/, "");
  const token = env.EMDASH_API_TOKEN;
  const cache = new Map<string, unknown>();

  return {
    baseUrl,
    cache,
    async get<T>(path: string, query?: QueryParams): Promise<T | undefined> {
      const url = new URL(`${baseUrl}/_emdash/api${path}`);
      if (query) {
        for (const [key, value] of Object.entries(query)) {
          if (value === undefined || value === null) continue;
          url.searchParams.set(key, String(value));
        }
      }

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (res.status === 404) return undefined;

      let body: EmdashSuccessEnvelope<T> | EmdashErrorEnvelope | undefined;
      try {
        body = (await res.json()) as EmdashSuccessEnvelope<T> | EmdashErrorEnvelope;
      } catch {
        throw new EmdashApiError(`EmDash returned a non-JSON response (${res.status}) for ${path}`, res.status);
      }

      if (!res.ok || !body.success) {
        const message = !body.success ? body.error.message : `EmDash request failed (${res.status})`;
        const code = !body.success ? body.error.code : undefined;
        throw new EmdashApiError(message, res.status, code);
      }

      return body.data;
    },
  };
}
