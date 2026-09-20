import { definePlugin } from "emdash";

// Replaces the old Sanity webhook (HMAC-signed POST to /api/revalidate) with
// an EmDash native plugin that reacts to content lifecycle hooks directly —
// EmDash has no separate "outbound webhook" feature, so a plugin hook is the
// supported way to react to a publish/unpublish/schedule change. See
// docs/emdash-migration-plan.md for the full rationale, including why this
// posts to the public edge domain rather than a direct URL to apps/site
// (which has no public URL by design — see CLAUDE.md).
//
// Config is passed as plain arguments from astro.config.mjs (`url`,
// `secret`), not read from a Worker runtime env binding: EmDash's
// `PluginContext` (confirmed against emdash@1.0.0's own
// `src/plugins/types.ts`) has no `ctx.env` — plugins get `ctx.http`,
// `ctx.kv`, `ctx.storage`, `ctx.log`, etc., but not raw environment access.
// astro.config.mjs itself runs in Node at BUILD time, so `url`/`secret` are
// baked into the built Worker bundle rather than injected per-request via
// `wrangler secret put` — see apps/cms/.env.example and
// docs/emdash-migration-plan.md for why that's an acceptable trade-off here
// (the bundle is already a trusted deploy artifact, not publicly
// downloadable) and what the alternative would need.
//
// Outbound HTTP needs the `network:fetch:any` capability — `network:fetch`
// alone requires a static `allowedHosts` allowlist, which doesn't fit a
// user-configured destination URL that can point at localhost in dev or the
// real domain in production.
//
// Verify after your first deploy: this plugin was written against EmDash's
// published docs and source without a live instance to run it against, so
// the exact shape of `event.content` for a custom field like `live_blog`
// should be confirmed — trigger a publish and check pulse-cms's own logs
// (`ctx.log`) for what actually got read. Nothing here is load-bearing for
// correctness: a failed or wrong-shaped notification only delays cache
// invalidation (pages still refresh on their own TTL — see
// apps/site/src/middleware.ts), it never breaks a save/publish.

const COLLECTIONS = new Set([
  "articles",
  "live_blogs",
  "live_blog_entries",
  "sections",
  "authors",
  "site_extras",
]);

/** Best-effort: reads a custom field off either the REST-style `{data: {...}}` envelope or a flat DB-row shape, since which one hooks receive isn't documented. */
function readField(content, key) {
  return content?.data?.[key] ?? content?.[key];
}

async function tryResolveParentSlug(ctx, http, id) {
  if (!id || !ctx?.content?.get) return undefined;
  try {
    const result = await ctx.content.get("live_blogs", id);
    return result?.slug ?? result?.data?.slug;
  } catch {
    return undefined;
  }
}

export function revalidateWebhookPlugin(options = {}) {
  const url = options.url ?? process.env.SITE_REVALIDATE_URL;
  const secret = options.secret ?? process.env.REVALIDATE_SECRET;

  async function notify(ctx, collection, eventName, event) {
    if (!url || !secret) {
      ctx?.log?.warn?.(
        "[revalidate] plugin configured without url/secret — skipping cache purge notification"
      );
      return;
    }
    if (!collection || !COLLECTIONS.has(collection)) return;

    const content = event?.content ?? {};
    const payload = {
      collection,
      event: eventName,
      id: content.id,
      slug: content.slug,
    };

    if (collection === "live_blog_entries") {
      payload.parentSlug = await tryResolveParentSlug(ctx, ctx?.http, readField(content, "live_blog"));
    }

    try {
      const res = await ctx.http.fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        ctx?.log?.warn?.(`[revalidate] site responded ${res.status} to ${eventName}/${collection}`);
      }
    } catch (err) {
      ctx?.log?.warn?.(`[revalidate] failed to notify site: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return definePlugin({
    id: "pulse-revalidate-webhook",
    version: "0.1.0",
    capabilities: ["network:fetch:any", "read:content"],
    hooks: {
      "content:afterPublish": (event, ctx) => notify(ctx, event?.collection, "publish", event),
      "content:afterUnpublish": (event, ctx) => notify(ctx, event?.collection, "unpublish", event),
      "content:afterSchedule": (event, ctx) => notify(ctx, event?.collection, "schedule", event),
      "content:afterUnschedule": (event, ctx) => notify(ctx, event?.collection, "unschedule", event),
      "content:afterDelete": (event, ctx) => notify(ctx, event?.collection, "delete", event),
      "content:afterRestore": (event, ctx) => notify(ctx, event?.collection, "restore", event),
    },
  });
}

export default revalidateWebhookPlugin;
