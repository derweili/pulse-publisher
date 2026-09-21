# Cache revalidation

Implements the `/api/revalidate` endpoint sketched in `docs/cache-purge-spike.md`. An editor publishing/unpublishing/scheduling/deleting content in pulse-cms fires a native EmDash plugin hook (`packages/emdash-revalidate-plugin`) that purges exactly the Workers Cache tags that content affects, using the same tags `apps/site/src/middleware.ts` assigns (see `apps/site/src/lib/cache/tags.ts`, the shared source of truth for both sides).

Time-based `stale-while-revalidate` (60s for articles, up to 24h for feeds) is still the fallback — this purge is a fast-follow that makes a publish visible immediately instead of within a minute.

This replaced a Sanity webhook (HMAC-signed per Sanity's webhook-signing scheme) during the EmDash migration — see `docs/emdash-migration-plan.md`. EmDash has no equivalent built-in "outbound webhook" feature, so the plugin hook is the supported way to react to a lifecycle event, and since both sides (`apps/cms` and `apps/site`) are infrastructure this repo owns, a shared secret is enough — there's no third-party signing scheme to interoperate with.

## Endpoint

```
POST https://pulse.derweili.de/api/revalidate
Header: Authorization: Bearer <REVALIDATE_SECRET>
Body:   { collection, event, id, slug, parentSlug? } — see resolveRevalidationTags.ts
```

Reachable publicly at `pulse.derweili.de` because it's under `/api/`, which `apps/edge`'s router forwards verbatim (cookies and all headers intact, no mOS pipeline — see `apps/edge/src/router.ts`) to `apps/site` over the `SITE` service binding. That's also why the request must be authenticated by its own shared secret rather than relying on the edge Worker: `/api/**` bypasses mOS entirely by design (CLAUDE.md). It's also why `packages/emdash-revalidate-plugin` posts here at all, rather than straight to `apps/site` — that Worker has no public URL (see CLAUDE.md), and EmDash plugins can only make outbound `fetch()` calls to allowlisted HTTPS hosts, not use a Cloudflare service binding.

The purge itself (`Astro.locals.runtime.ctx.cache.purge(...)`) has to run inside `apps/site`, not `apps/edge` — Workers Cache is per-Worker, and `apps/site` is the Worker with `[cache] enabled = true`.

## Plugin setup (`packages/emdash-revalidate-plugin`)

Registered in `apps/cms/astro.config.mjs` via `plugins: [revalidateWebhookPlugin()]` — no separate webhook UI to configure, unlike Sanity. It reads two Worker runtime vars/secrets on `apps/cms`:

| Var | Value |
|---|---|
| `SITE_REVALIDATE_URL` | `https://pulse.derweili.de/api/revalidate` in production |
| `REVALIDATE_SECRET` | A generated shared secret — set the same value as `apps/site`'s `REVALIDATE_SECRET` |

It hooks `content:afterPublish` / `afterUnpublish` / `afterSchedule` / `afterUnschedule` / `afterDelete` / `afterRestore` and POSTs `{ collection, event, id, slug }` (plus `parentSlug` for `live_blog_entries`, resolved best-effort from the entry's `live_blog` reference). See that package's `src/index.js` for the exact shape and the caveats around EmDash's undocumented in-hook APIs — this was written against EmDash's published docs without a live instance to introspect, so verify the actual payload shape (via `apps/cms`'s logs) after your first deploy.

Unlike the old Sanity webhook's GROQ projection, this payload does **not** carry the affected article's section/author/tags — the plugin only has cheap access to fields on the event itself. See the tag-resolution table below for how that trade-off plays out.

## Tag resolution (`apps/site/src/lib/cache/resolveRevalidationTags.ts`)

| `collection` | Tags purged |
|---|---|
| `articles` | `article:<slug>`, `home` |
| `live_blogs` | `live:<slug>`, `home` |
| `live_blog_entries` | `live:<parentSlug>`, `home` if the parent's slug was resolved; `purgeEverything: true` otherwise |
| `sections` | `purgeEverything: true` — renders into nav/footer/listings, not narrowly taggable from this payload |
| `authors` | `purgeEverything: true` |
| `site_extras` | `purgeEverything: true` — renders into every page's nav/footer/breaking-news banner via `Layout.astro` |
| anything else (a collection this endpoint doesn't recognize, or a payload missing the slug it expected) | `purgeEverything: true` — failing toward over-purging (a cache refill) beats leaving stale content live |

`home` is included on every article/live_blog change because the homepage lists articles by section — cheap to over-invalidate, and it avoids a stale homepage after every publish (same reasoning `cache-purge-spike.md` used).

A section/author/tag-listing page not being purged immediately on an article change (unlike the old Sanity-backed implementation) is an accepted trade-off — see above. Those pages still refresh within their own 60s `stale-while-revalidate` window (`middleware.ts`).

## What's not handled

- **Slug renames.** If an editor changes an article's slug, the plugin payload only carries the *new* slug — the page at the *old* URL keeps serving its last cached response until `max-age` (60s) expires. Not fixed here.
- **Retry/delivery guarantees.** The plugin makes a best-effort `fetch()` and logs a warning on failure; there's no retry, dead-letter queue, or alerting on a failed purge — the time-based fallback is what keeps this non-critical.
