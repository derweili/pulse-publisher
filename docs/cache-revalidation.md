# Cache revalidation

Implements the `/api/revalidate` endpoint sketched in `docs/cache-purge-spike.md`. Saving a document in apps/cms (Payload) fires an `afterChange`/`afterDelete` hook (see `apps/cms/src/hooks/revalidate.ts`) that purges exactly the Workers Cache tags that document affects, using the same tags `apps/site/src/middleware.ts` assigns (see `apps/site/src/lib/cache/tags.ts`, the shared source of truth for both sides).

Time-based `stale-while-revalidate` (60s for articles, up to 24h for feeds) is still the fallback — this purge is a fast-follow that makes a publish visible immediately instead of within a minute.

## Endpoint

```
POST https://pulse.derweili.de/api/revalidate
Header: webhook-signature: t=<unix seconds>,v1=<base64url HMAC-SHA256>
Body:   { type, slug?, sectionSlug?, authorSlugs?, tags? } as JSON
```

Reachable publicly at `pulse.derweili.de` because it's under `/api/`, which `apps/edge`'s router forwards verbatim (cookies and all headers intact, no mOS pipeline — see `apps/edge/src/router.ts`) to `apps/site` over the `SITE` service binding. That's also why the request must be authenticated by its own signature rather than relying on the edge Worker: `/api/**` bypasses mOS entirely by design (CLAUDE.md).

The purge itself (`Astro.locals.runtime.ctx.cache.purge(...)`) has to run inside `apps/site`, not `apps/edge` — Workers Cache is per-Worker, and `apps/site` is the Worker with `[cache] enabled = true`.

## The sending side (apps/cms)

`apps/cms/src/hooks/revalidate.ts` signs `<timestamp>.<raw JSON body>` with HMAC-SHA256 using `node:crypto`, sets the `webhook-signature` header, and POSTs it. It's wired into an `afterChange`/`afterDelete` hook on every collection that affects the site (`articles`, `authors`, `sections`, `live-blogs`) and the `site-settings` global — see each collection's `hooks` block in `apps/cms/src/collections/`.

Configure via two env vars in apps/cms (see `apps/cms/.env.example`):

| Env var | Value |
|---|---|
| `REVALIDATE_URL` | `https://pulse.derweili.de/api/revalidate` |
| `REVALIDATE_WEBHOOK_SECRET` | A generated shared secret — set the same value as apps/site's `PAYLOAD_WEBHOOK_SECRET` Worker secret (`wrangler secret put PAYLOAD_WEBHOOK_SECRET`, run from `apps/site`) |

For `articles`/`live-blogs` (both have drafts enabled), the hook only fires when the saved version's `_status` is `published` — an autosaved draft never triggers a purge.

**Payload payload shape** — one shape covers every collection/global that triggers this hook; fields a given `type` doesn't have simply come through as `null`/omitted. Deliberately excludes `body`/`bio`/`dek` and every other content field — the payload only needs to say *what changed*, not carry the changed content itself, matching the "cards/metadata only" spirit of every other `/api/` route:

```ts
{ type: "article" | "liveBlog" | "section" | "author" | "siteSettings", slug?, sectionSlug?, authorSlugs?, tags? }
```

## Tag resolution (`apps/site/src/lib/cache/resolveRevalidationTags.ts`)

| `type` | Tags purged |
|---|---|
| `article` | `article:<slug>`, `home`, `section:<sectionSlug>` (if set), `author:<slug>` for each author, `tag:<tag>` for each tag |
| `liveBlog` | `live:<slug>`, `home`, `section:<sectionSlug>` (if set) |
| `section` | `section:<slug>`, `home` |
| `author` | `author:<slug>` |
| `siteSettings` (or anything else this endpoint doesn't recognize) | `purgeEverything: true` — `site-settings` renders into every page's nav/footer/breaking-news banner via `Layout.astro`, so no narrower tag covers it; failing toward over-purging for an unrecognized `type` is deliberate (a cache refill beats leaving stale content live) |

`home` is included on every article/liveBlog/section change because the homepage lists articles by section — cheap to over-invalidate, and it avoids a stale homepage after every publish (same reasoning `cache-purge-spike.md` used).

## What's not handled

- **Slug renames.** If an editor changes an article's slug, the webhook only carries the *new* slug — the page at the *old* URL keeps serving its last cached response until `max-age` (60s) expires. Not fixed here — would need Payload's `req.context`/`previousDoc` to diff old vs. new slug and purge both, deferred until it's an actual problem.
- **Retry/delivery guarantees.** The hook logs a failed purge request but doesn't retry it or raise an alert — the time-based fallback is what keeps this non-critical.
