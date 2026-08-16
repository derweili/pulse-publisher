# Cache revalidation

Implements the `/api/revalidate` endpoint sketched in `docs/cache-purge-spike.md`. An editor publishing/updating/deleting a document in Sanity fires a webhook that purges exactly the Workers Cache tags that document affects, using the same tags `apps/site/src/middleware.ts` assigns (see `apps/site/src/lib/cache/tags.ts`, the shared source of truth for both sides).

Time-based `stale-while-revalidate` (60s for articles, up to 24h for feeds) is still the fallback — this purge is a fast-follow that makes a publish visible immediately instead of within a minute.

## Endpoint

```
POST https://pulse.derweili.de/api/revalidate
Header: sanity-webhook-signature: t=<unix seconds>,v1=<base64url HMAC-SHA256>
Body:   the webhook projection below, as JSON
```

Reachable publicly at `pulse.derweili.de` because it's under `/api/`, which `apps/edge`'s router forwards verbatim (cookies and all headers intact, no mOS pipeline — see `apps/edge/src/router.ts`) to `apps/site` over the `SITE` service binding. That's also why the request must be authenticated by its own signature rather than relying on the edge Worker: `/api/**` bypasses mOS entirely by design (CLAUDE.md).

The purge itself (`Astro.locals.runtime.ctx.cache.purge(...)`) has to run inside `apps/site`, not `apps/edge` — Workers Cache is per-Worker, and `apps/site` is the Worker with `[cache] enabled = true`.

## Webhook setup (sanity.io/manage → API → Webhooks)

| Field | Value |
|---|---|
| Name | `pulse-cache-revalidate` |
| URL | `https://pulse.derweili.de/api/revalidate` |
| Dataset | `production` |
| Trigger on | Create, Update, Delete |
| Filter | see below |
| Projection | see below |
| HTTP method | `POST` |
| API version | matches `PUBLIC_SANITY_API_VERSION` |
| Secret | a generated shared secret — set the same value as the `SANITY_API_WEBHOOK_SECRET` Worker secret (`wrangler secret put SANITY_API_WEBHOOK_SECRET`, run from `apps/site`) |

**Filter** — only the document types the endpoint knows how to invalidate, and only published documents (the site reads with `perspective: "published"`, so draft edits shouldn't trigger a purge):

```groq
_type in ["article", "section", "author", "liveBlog", "siteSettings"]
&& !(_id in path("drafts.**"))
```

**Projection** — one shape covers every type in the filter; fields a given `_type` doesn't have simply come through `null`. Deliberately excludes `body`/`bio`/`dek` and every other content field — the webhook payload only needs to say *what changed*, not carry the changed content itself, matching the "cards/metadata only" spirit of every other `/api/` route:

```groq
{
  "type": _type,
  "slug": slug.current,
  "sectionSlug": section->slug.current,
  "authorSlugs": authors[]->slug.current,
  tags
}
```

## Tag resolution (`apps/site/src/lib/cache/resolveRevalidationTags.ts`)

| `_type` | Tags purged |
|---|---|
| `article` | `article:<slug>`, `home`, `section:<sectionSlug>` (if set), `author:<slug>` for each author, `tag:<tag>` for each tag |
| `liveBlog` | `live:<slug>`, `home`, `section:<sectionSlug>` (if set) |
| `section` | `section:<slug>`, `home` |
| `author` | `author:<slug>` |
| `siteSettings` | `purgeEverything: true` — renders into every page's nav/footer/breaking-news banner via `Layout.astro`, so no narrower tag covers it |
| anything else (a document type this endpoint doesn't recognize, or a payload missing the slug it expected) | `purgeEverything: true` — failing toward over-purging (a cache refill) beats leaving stale content live |

`home` is included on every article/liveBlog/section change because the homepage lists articles by section — cheap to over-invalidate, and it avoids a stale homepage after every publish (same reasoning `cache-purge-spike.md` used).

## What's not handled

- **Slug renames.** If an editor changes an article's slug, the webhook only carries the *new* slug — the page at the *old* URL keeps serving its last cached response until `max-age` (60s) expires. Not fixed here — would need Sanity's `before()`/`after()` projection functions to diff old vs. new slug, deferred until it's an actual problem.
- **Retry/delivery guarantees.** Sanity retries a webhook a few times on non-2xx, then gives up silently. There's no dead-letter queue or alerting on a failed purge — the time-based fallback is what keeps this non-critical.
