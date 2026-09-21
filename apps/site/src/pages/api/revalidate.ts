import type { APIContext } from "astro";
import { resolveRevalidationTags, type RevalidationPayload } from "../../lib/cache/resolveRevalidationTags";
import { isValidWebhookSignature, SIGNATURE_HEADER } from "../../lib/payload/webhookSignature";

/**
 * apps/cms webhook target — purges the Workers Cache tags a changed
 * document affects. See docs/cache-revalidation.md and
 * apps/cms/src/hooks/revalidate.ts (the sender).
 *
 * Reachable only through apps/edge's `/api/**` passthrough (verbatim
 * forward, see apps/edge/src/router.ts) — this app is never publicly
 * reachable directly (see CLAUDE.md). Body content is never returned, so
 * this is compliant with the "/api/** never returns article body" rule even
 * though it bypasses the mOS pipeline like every other /api/ route.
 */
export async function POST(context: APIContext): Promise<Response> {
  const secret = context.locals.runtime.env.PAYLOAD_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[revalidate] PAYLOAD_WEBHOOK_SECRET is not configured");
    return new Response("Not configured", { status: 500 });
  }

  const body = await context.request.text();
  const valid = await isValidWebhookSignature(
    body,
    context.request.headers.get(SIGNATURE_HEADER),
    secret
  );
  if (!valid) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: RevalidationPayload;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }
  if (!payload.type) {
    return new Response("Missing `type`", { status: 400 });
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
