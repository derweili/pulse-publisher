# Cache-purge spike

Timeboxed to 30 minutes, per `docs/mos-integration-plan.md` Session 3. Goal: is `ctx.cache.purge({ tags })` reachable from Astro code via `Astro.locals.runtime.ctx`? Findings, not a shipped feature.

## Answer: yes, reachable — confirmed at the type level

`Astro.locals.runtime.ctx` is typed as `ExecutionContext` (`apps/site/src/env.d.ts` → `Runtime<CloudflareEnv>` → `@astrojs/cloudflare`'s `dist/utils/handler.d.ts`, which types `runtime.ctx: ExecutionContext` directly from `@cloudflare/workers-types`).

The installed `@cloudflare/workers-types` (`5.20260812.1`, matching this repo's `compatibility_date = "2026-08-12"`) types:

```ts
interface ExecutionContext<Props = unknown> {
  // ...
  cache?: CacheContext;
}
interface CacheContext {
  purge(options: CachePurgeOptions): Promise<CachePurgeResult>;
}
interface CachePurgeOptions {
  tags?: string[];
  pathPrefixes?: string[];
  purgeEverything?: boolean;
}
```

So the call site is:

```ts
await Astro.locals.runtime.ctx.cache?.purge({ tags: ["article:some-slug"] });
```

This is in the **stable** type surface (`@cloudflare/workers-types/index.d.ts`), not gated behind `/experimental` — same shape appears in both.

## A different, older mechanism exists — don't reach for it by mistake

The same types file also has `RequestInitCfProperties.cacheTags` — a `cf` property on outbound `fetch()` requests, explicitly documented as **"Only available for Enterprise customers"**. That's Cloudflare's legacy *zone-level* "Purge by Cache Tag" (the CDN cache in front of a whole zone). It is **not** what `[cache] enabled = true` + `ctx.cache.purge()` uses — that's the newer, per-Worker Workers Cache this session turns on. The two are separate products with separate purge paths. If a future session reaches for cache-tag purging, this is `ctx.cache.purge`, not `cf.cacheTags`.

## What's not confirmed

Type definitions prove the call is reachable and type-correct; they don't prove the runtime behavior — specifically, whether the per-Worker Workers Cache automatically indexes cached entries by the `Cache-Tag` **response header** our `middleware.ts` sets (the natural assumption, and the reason the route table assigns a `Cache-Tag` to every cacheable response), or requires something else to associate a cached entry with a tag. Confirming that needs a live deploy + a real cached request + a real `purge({ tags })` call + a follow-up request to check for a cache miss — out of scope for a doc-only spike. Recommended next step, not a Session 3 blocker: do exactly that once `apps/site` is deployed with `[cache] enabled = true` live.

## Sketch: `/api/revalidate` (not implemented — sketch only, per the plan)

A Sanity webhook endpoint that purges exactly the tags a changed document affects, using the same tag prefixes `middleware.ts` assigns (`article:`, `section:`, `author:`, `tag:`, `live:`, plus the static `home`/`feed`/`static` buckets):

```
POST /api/revalidate
Headers: X-Sanity-Webhook-Secret: <shared secret, checked against an env var>
Body: Sanity webhook payload — _type, slug, section, authors, tags of the changed document

1. Verify the shared-secret header; 401 if missing/wrong.
2. Switch on payload._type:
   - "article": tags = [`article:${slug}`, `section:${section.slug}`,
     ...authors.map(a => `author:${a.slug}`), ...tags.map(t => `tag:${t}`),
     "home"]  (homepage features/lists articles, so it's always invalidated
     too — cheap, and avoids a stale homepage after every publish)
   - "section" / "author" changes: [`section:${slug}`] / [`author:${slug}`]
   - anything else (siteSettings, etc.): fall back to `purgeEverything: true`
     or a conservative fixed set (["home", "feed", "static"]) — decide when
     this is actually built, not here.
3. await Astro.locals.runtime.ctx.cache?.purge({ tags })
4. Return 200 once purge resolves (or 202 if purge is fire-and-forget via
   ctx.waitUntil — worth deciding once the endpoint is real).
```

This endpoint doesn't exist yet. Building it needs: a `SANITY_API_WEBHOOK_SECRET`-style Worker secret (alongside the existing `SANITY_API_READ_TOKEN` pattern in `.dev.vars.example`), a Sanity webhook configured in `sanity.io/manage` pointed at it, and the live-test above done first so the tag-matching assumption is verified rather than assumed.

## Bottom line

Don't let this block Session 4. The route table's time-based `stale-while-revalidate` values (60s for articles, 30s for home, up to 24h for feeds) already give every route a working, deploy-free revalidation path — an editor's change is live within a minute, which is fine for a demo and fine for most publishers. Purge-on-publish is a nice-to-have fast-follow once the live test above confirms the tag-matching behavior, not a requirement to ship the paywall.
