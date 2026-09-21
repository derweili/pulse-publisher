import type { APIContext } from "astro";
import { resolveRevalidationTags, type RevalidationPayload } from "../../lib/cache/resolveRevalidationTags";
import { AUTH_HEADER, isValidRevalidateAuth } from "../../lib/emdash/revalidateAuth";

/**
 * pulse-cms's revalidate-plugin target — purges the Workers Cache tags a
 * changed content item affects. See packages/emdash-revalidate-plugin and
 * docs/emdash-migration-plan.md for the shared-secret scheme this replaces
 * Sanity's HMAC-signed webhook with, and docs/cache-revalidation.md for the
 * tag scheme itself.
 *
 * Reachable only through apps/edge's `/api/**` passthrough (verbatim
 * forward, see apps/edge/src/router.ts) — this app is never publicly
 * reachable directly (see CLAUDE.md). Body content is never returned, so
 * this is compliant with the "/api/** never returns article body" rule even
 * though it bypasses the mOS pipeline like every other /api/ route.
 */
export async function POST(context: APIContext): Promise<Response> {
  const secret = context.locals.runtime.env.REVALIDATE_SECRET;
  if (!secret) {
    console.error("[revalidate] REVALIDATE_SECRET is not configured");
    return new Response("Not configured", { status: 500 });
  }

  const valid = isValidRevalidateAuth(context.request.headers.get(AUTH_HEADER), secret);
  if (!valid) {
    return new Response("Invalid credentials", { status: 401 });
  }

  let payload: RevalidationPayload;
  try {
    payload = (await context.request.json()) as RevalidationPayload;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  if (!payload.collection) {
    return new Response("Missing `collection`", { status: 400 });
  }

  const plan = resolveRevalidationTags(payload);
  const cache = context.locals.runtime.ctx.cache;

  if (plan.purgeEverything) {
    await cache?.purge({ purgeEverything: true });
  } else if (plan.tags.length > 0) {
    await cache?.purge({ tags: plan.tags });
  }

  return new Response(JSON.stringify(plan), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function GET(): Promise<Response> {
  return new Response("Method not allowed", { status: 405, headers: { Allow: "POST" } });
}
