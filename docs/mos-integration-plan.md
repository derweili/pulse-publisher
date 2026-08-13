# mOS integration plan — pulse-publisher

Built from the `mos-readiness.md` audit. Organised as seven Claude Code sessions, each with a scope, a prompt sketch, and acceptance criteria. Sessions 1–3 are independently shippable and safe to merge before mOS exists.

---

## Decisions this plan makes

The audit closed with three open questions. Here are the answers, plus two decisions the audit didn't raise.

### Q1 — Where does the auth signal come from? → **The proxy reads it. Do not add `clerkMiddleware()`.**

The mOS proxy resolves reader identity itself: it reads the JWT from the cookie named in `AUTHENTICATED_USER_JWT_COOKIE_NAME` (Clerk's `__session`) and verifies it against Clerk's JWKS, configured once in the mOS console.

This means the audit's "should we add `clerkMiddleware()`?" is not a coin flip — adding it would be actively harmful. The moment `Astro.locals.auth` exists, `@clerk/astro`'s `<Show>` switches from its CSR variant to its SSR variant and starts rendering **different HTML for signed-in and signed-out readers**. That destroys the single most valuable property the audit found: the origin byte stream is currently identical for every reader. Keep the origin auth-blind. All reader variance belongs in the proxy.

### Q2 — What is the free-preview boundary? → **Two server-rendered containers, plus an editor-controlled Sanity field.**

The audit recommends `data-mos-block="<index>"` on every block. I'd go a different way. An index attribute requires the rewriter to do numeric comparison to decide what to cut, and mOS component behaviours are *declarative selector + action* pairs — there's no "remove elements where index ≥ 3" in that model.

Instead, do the split server-side, exactly as the app already splits the body at its midpoint for ad insertion, and emit two containers:

```html
<div data-mos="article-body">
  <div data-mos="article-preview">   <!-- blocks 0..N-1 -->
  <div data-mos="article-locked">    <!-- blocks N..end -->
  <div data-mos="paywall-slot">      <!-- empty -->
</div>
```

The paywall then becomes two trivial behaviours: **remove** `[data-mos="article-locked"]`, **set inner content** of `[data-mos="paywall-slot"]`. No counting, no index arithmetic, no fragility when images and video embeds interleave with paragraphs.

Add `freePreviewBlocks` (number, default 3) to the Sanity article schema so editors control the cut per article. Keep `data-mos-block="<index>"` on individual blocks as well — it costs nothing, the index is already in hand during the `.map()`, and it gives you an escape hatch for behaviours nobody has thought of yet.

### Q3 — Caching strategy? → **Cache the anonymous origin HTML with the locked content in it. Personalise after the cache read.**

No fragmentation by decision outcome, no cache-key buckets. One entry per URL, shared globally. The proxy runs on every request regardless of cache state, so metering and surface decisions are never skipped by a hit.

The direct consequence, and the most important security item in this plan:

> **The site Worker ships full premium article bodies in its response. It must not be publicly reachable.**

Service binding only. `workers_dev = false`, no routes, preview URLs disabled. The audit notes `wrangler.toml` currently declares no routes at all — meaning the site is presumably live on a `workers.dev` subdomain right now. That URL becomes a complete paywall bypass the day the paywall exists.

Nice side benefit of Sanity over the earlier EmDash plan: Studio is a separate deploy target, so there's **no admin surface on the site Worker** and no second hostname to carve out.

### D4 — Two Workers. Confirmed, with a concrete reason the audit didn't have.

The audit is right, and here's the version-specific evidence: pointing `main` at a hand-written Worker and calling `handle()` from `@astrojs/cloudflare/handler` requires **Astro 6 + adapter v13**. This repo is on Astro 5.18.2 / adapter 12.6.13. The single-Worker option isn't merely awkward here — the supported entry point for it doesn't exist in the installed versions. Two Workers, service-bound.

(Upgrade path exists if you later want one deployment. Not during a PoC.)

### D5 — The edge Worker routes requests three ways. **The audit missed this and it will bite.**

`ForYouRail` and `SavedArticles` fire client-side `fetch()` calls to `/api/for-you.json` and `/api/saved-articles.json` on page load. Behind the proxy, each of those is a request that will trigger its own Surface Decision API call. Consequences: the metering counter increments two or three times per page view, free-article quotas burn on articles nobody opened, latency and cost triple, and the funnel numbers in your demo become nonsense.

Adding these to `SURFACE_DECISIONS_IGNORE_PATHS` skips the decision call but still runs the rest of the pipeline — origin fetch, response inspection, link rewriting, the `no-store` header. Non-HTML short-circuits early so it's cheap, but it's overhead for nothing. A true bypass is a check in our own code, before the proxy is constructed.

**Three groups, in this order:**

| Group | Paths | Handling |
|---|---|---|
| **1. Reader-specific JSON** | `^/api/` | `env.SITE.fetch(request)` — verbatim, **cookies kept** |
| **2. Public non-HTML** | `_astro/`, `favicon`, `robots.txt`, `rss.xml`, `sitemap.xml`, `search-index.json` | `env.SITE.fetch(anonymize(request))` — **cookies stripped** |
| **3. Everything else** | all HTML | full mOS pipeline |

The cookie difference between groups 1 and 2 is the part to get right. Group 1 keeps cookies because a future `/api/` endpoint may need the Clerk session, and it's safe only because the site middleware marks those responses `private, no-store`. Group 2 **must** be anonymized — those responses are cached and shared, so reader cookies reaching them either fragment the cache or trigger a bypass and destroy the hit rate on static assets.

Two consequences:

- **`SURFACE_DECISIONS_IGNORE_PATHS` ends up empty**, or close to it. What would remain is HTML you want proxied but not metered, and there probably isn't any at first. Better an empty config than the same regex duplicated in two places that can drift apart.
- **`/api/**` is now completely unwalled** — no metering, no decision, no rewriting. This needs a written rule (see session 4), because the failure mode is someone adding a convenient endpoint in six weeks and handing away the paywall.

`/subscription` and `/saved` stay in group 3. They're HTML, and `/subscription` is where mOS offers render. Being `no-store` in the site middleware is enough to keep them out of the cache.

---

## Target architecture

```
reader ──► www.pulse.today ──► EDGE WORKER  "pulse-edge"        cache: DISABLED
                                 │
                                 ├─ /api/**  ─────────────────────► fetch(request)
                                 │     reader-specific JSON,          cookies KEPT
                                 │     no decision, no rewrite
                                 │
                                 ├─ assets, feeds, robots ────────► fetch(anonymize(req))
                                 │     public non-HTML,               cookies STRIPPED
                                 │     no decision, no rewrite
                                 │
                                 └─ everything else (HTML)
                                       · reads __session, verifies vs Clerk JWKS
                                       · POST /api/v1/surface-decisions
                                       · HTMLRewriter applies behaviours
                                       · sets Cache-Control: no-store outbound
                                       │
                                       │  fetch(anonymize(request))
                                       ▼
                              [ WORKERS CACHE ]  ← HIT: site Worker never runs
                                       │
                                       ▼
                               SITE WORKER  "pulse-today"        cache: ENABLED
                                 · Astro SSR, adapter-generated entrypoint
                                 · queries Sanity live
                                 · renders identical HTML for every reader
                                 · NOT publicly reachable

editor ──► Sanity Studio (separate deploy, untouched by any of this)
```

All three branches reach the site Worker through the same `SITE` service binding; only the HTML branch goes through the mOS pipeline. Group 2 still benefits from Workers Cache — that's why it's anonymized rather than forwarded verbatim.

---

## Repo structure

On the `studio/` question: colocating Studio in the repo is the standard Sanity pattern and worth keeping — schema changes and the queries that consume them stay in one commit. What's actually odd is the *asymmetry*: Studio is a proper package while the site is loose at the root. Adding a third deployable makes that untenable.

```
pulse-publisher/
├─ package.json              npm workspaces root, private
├─ apps/
│  ├─ site/                  everything currently at root (src/, astro.config.mjs, wrangler.toml)
│  └─ edge/                  new — mOS proxy Worker
├─ studio/                   unchanged, just now a declared workspace
├─ docs/
│  ├─ mos-readiness.md
│  ├─ mos-selectors.md       the data-mos contract — single source of truth
│  └─ mos-integration-plan.md
└─ .github/workflows/
   ├─ deploy-site.yml        path-filtered: apps/site/**
   └─ deploy-edge.yml        path-filtered: apps/edge/**
```

Path-filtered workflows matter: you want to change a proxy behaviour without rebuilding and redeploying the whole Astro app.

---

## Session 1 — Restructure into workspaces

**Scope:** structure only. No mOS, no behaviour changes.

**Prompt sketch:**

> Convert this repo to npm workspaces. Move everything currently at the root that belongs to the Astro app (`src/`, `astro.config.mjs`, `wrangler.toml`, `tsconfig.json`, `public/`, app deps) into `apps/site/`. Keep `studio/` where it is but declare it as a workspace. Create an empty `apps/edge/` workspace with just a `package.json`.
>
> Fix every path this breaks: tsconfig paths and extends, Vite/Astro config, `wrangler.toml`'s `main` and `[assets].directory`, npm scripts, and the GitHub Actions workflow. Split `.github/workflows/deploy.yml` into `deploy-site.yml` and `deploy-edge.yml`, each with a `paths:` filter on its own app directory.
>
> Align Node: CI pins 20, the lockfile assumes 22. Add `.nvmrc` with 22 and update the workflow.
>
> Fix the stale comment in `.env.example` claiming the site is fully static — it's `output: 'server'`.
>
> Verify `npm run build` works from the root and from `apps/site` before finishing. Do not change any application code.

**Done when:** clean build from root; `wrangler deploy --dry-run` succeeds for the site; a real deploy to production still serves the site correctly. **Merge and deploy this before starting session 2.** A broken restructure tangled up with a broken proxy is a bad afternoon.

---

## Session 2 — Add the `data-mos` contract to the markup

**Scope:** markup attributes and the Sanity field. Still no proxy. Everything here is invisible to readers and safe to ship.

**Prompt sketch:**

> Add stable `data-mos` hooks to this Astro publisher app, per `docs/mos-selectors.md`. These are hooks for an HTMLRewriter-based proxy — they must be `data-` attributes on server-rendered elements, never classes.
>
> **Sanity schema:** add `freePreviewBlocks` (number, default 3, description "How many body blocks are visible before the paywall") to `studio/schemaTypes/documents/article.ts`. Add it to `articleBySlugQuery` in `src/lib/sanity/queries.ts`. Regenerate types.
>
> **Article body** (`articles/[slug].astro`, `portable-text/PortableText.astro`, `Block.astro`): wrap the body in `[data-mos="article-body"]`. Inside, split the block array at `freePreviewBlocks ?? 3` and render `[data-mos="article-preview"]` and `[data-mos="article-locked"]`. Add an empty `<div data-mos="paywall-slot">` after them. Add `data-mos-block="<index>"` to each rendered block.
>
> This must coexist with the existing midpoint ad split — the in-article ad slots stay where they are relative to content. Work out the interaction and explain your approach before writing code.
>
> **Cards:** add `data-mos="article-card"` and `data-premium="true|false"` to the root element of every `ArticleCard.astro` variant, and to the card roots in `SavedArticles.tsx` and `ForYouRail.tsx`. Add `data-mos="premium-badge"` to the badge span. While in there: the two React components don't render a premium badge at all — add one, matching the Astro card.
>
> **Other surfaces:** `data-mos="related"` on `RelatedRail.astro` and the "Keep reading" grid. `data-mos="newsletter"` alongside the existing `data-newsletter`. `data-mos="auth-actions"` on the header auth region. `data-mos="comments"` on the comments wrapper. `data-mos="meter-strip"` — a new empty `<div>` in `Layout.astro` directly below the header, rendering nothing today.
>
> **Do not touch** `[data-ad-slot]` — it's already the right shape.
>
> Then write `docs/mos-selectors.md`: a table of every selector, what it wraps, and what mOS is expected to do with it. This file is the contract between this repo and the mOS console configuration.

**Two constraints to state in the prompt:** never use `:last-child` in anything destined for a mOS selector — HTMLRewriter doesn't support it and skips it silently, no error. And every hook must survive a Tailwind class change, so no utility classes as selectors.

**Done when:** view-source on an article shows preview/locked/slot containers correctly split; `data-premium` present on every card variant; nothing changed visually.

---

## Session 3 — Cache headers and origin hardening

**Scope:** make the site Worker cacheable and unreachable. Still no proxy.

**Prompt sketch:**

> **Add `apps/site/src/middleware.ts`** setting `Cache-Control` and `Cache-Tag` per route. There is no middleware in this repo today, so this is a new file. Route rules:
>
> | Route | Cache-Control | Cache-Tag |
> |---|---|---|
> | `/articles/[slug]` | `public, max-age=60, stale-while-revalidate=86400` | `article:<slug>`, `section:<section>`, `author:<slug>` each |
> | `/` | `public, max-age=30, stale-while-revalidate=3600` | `home` |
> | `/sections/*`, `/tags/*`, `/authors/*` | `public, max-age=60, stale-while-revalidate=86400` | matching tag |
> | `/search-index.json`, `/rss.xml`, `/sitemap.xml` | `public, max-age=300, stale-while-revalidate=86400` | `feed` |
> | `/api/*` | `private, no-store` | — |
> | `/saved`, `/subscription` | `private, no-store` | — |
>
> Assert in the middleware that no response carries `Set-Cookie` on a cacheable route — a `Set-Cookie` forces a cache bypass. The audit confirms the app sets none today; this keeps it that way.
>
> **Enable Workers Cache** in `apps/site/wrangler.toml`: `[cache] enabled = true`. Read https://developers.cloudflare.com/workers/cache/ first and confirm the exact TOML key names against current docs before writing — this feature shipped July 2026 and is outside your training data.
>
> **Harden the origin:** `workers_dev = false`, no `routes`, no `custom_domain`, preview URLs disabled. After this the site Worker is only reachable via service binding. Note in the PR description that the production hostname moves to the edge Worker in session 4, so there is a deliberate window where nothing is publicly served.
>
> **Spike, timeboxed to 30 minutes** — write findings to `docs/cache-purge-spike.md`, don't force a solution: is `ctx.cache.purge({ tags })` reachable from Astro code via `Astro.locals.runtime.ctx`? If yes, sketch a `/api/revalidate` endpoint for a Sanity webhook. If no or unclear, say so — we fall back to time-based revalidation, which the 60s/24h SWR values above already give us.

**Done when:** `Cf-Cache-Status: HIT` on a repeat article request; the site is no longer reachable at its `workers.dev` URL.

**On the spike:** on-demand purge is a nice-to-have for a PoC. `max-age=60` means an editor's change is live within a minute, which is fine for a demo and honestly fine for most publishers. Don't let it block session 4.

---

## Session 4 — Build the edge Worker

**Scope:** the proxy itself. First session that needs mOS credentials.

**Prerequisites:** mOS account with a surface created, secret key, surface slug. Clerk JWKS URL configured in the mOS console.

**Prompt sketch:**

> Build `apps/edge` — a Cloudflare Worker that reverse-proxies `pulse-today` through the MonetizationOS proxy.
>
> **Read first, don't guess:** the `@monetizationos/proxy` package source and https://docs.monetizationos.com/. The builder API, config option names, and pipeline stages must come from actual source. Anything you can't verify, mark `UNKNOWN` and ask.
>
> `src/router.ts` — a three-way gate evaluated **before** the proxy is constructed, with unit tests:
>
> ```ts
> const READER_JSON = /^\/api\//;
> const PUBLIC_STATIC = /^\/(_astro\/|favicon|robots\.txt|rss\.xml|sitemap\.xml|search-index\.json)/;
>
> // 1. Reader-specific JSON — verbatim, cookies intact.
> //    Safe only because site middleware sets `private, no-store`.
> if (READER_JSON.test(pathname)) return env.SITE.fetch(request);
>
> // 2. Public non-HTML — bypass the pipeline but STILL anonymize:
> //    these responses are cached and shared across all readers.
> if (PUBLIC_STATIC.test(pathname)) return env.SITE.fetch(anonymize(request));
>
> // 3. HTML — full mOS pipeline.
> ```
>
> **Ordering constraint:** the mOS endpoint prefix (`/mos-endpoints/`, confirm the exact value from source) must be handled before or outside these checks. No collision exists today, but broadening a pattern later would silently break the proxy's own routing. Add a test that asserts an mOS endpoint path never falls into group 1 or 2.
>
> `src/index.ts`:
> - `MOSProxyBuilder` with `.withConfig()`, `.withHtmlRewriter()`, `.withOriginFetcher()`.
> - Origin fetcher: `(req) => env.SITE.fetch(anonymize(req))`.
> - `originUrl` set to the public site origin. It's cosmetic here since the fetcher ignores the host, but it lands in the URL Astro routes on and the cache keys on — so keep paths identical.
> - Cookie config: `__session` for the authenticated JWT, `mos-anon` for the anonymous session.
> - Leave `SURFACE_DECISIONS_IGNORE_PATHS` **empty**. The router already keeps non-HTML out of the pipeline; duplicating those regexes in mOS config gives two lists that can drift apart.
>
> `src/anonymize.ts`, with unit tests:
> - delete `Cookie` and `Authorization` headers
> - strip `utm_*`, `fbclid`, `gclid` from the query string
> - preserve path and all other query params exactly
> - a comment explaining why: the origin response is cached and shared globally, so any reader-specific input either fragments the cache or leaks between readers
>
> `wrangler.toml`: name `pulse-edge`, `[cache] enabled = false`, service binding `SITE` → `pulse-today`, and the production routes (moved off the site Worker in session 3).
>
> `deploy-edge.yml` mirroring the site workflow, path-filtered to `apps/edge/**`.
>
> **Add to `CLAUDE.md`:** every route under `/api/` bypasses mOS entirely — no metering, no surface decision, no HTML rewriting. **No route under `/api/` may return article body content, ever.** Today `/api/for-you.json` and `/api/saved-articles.json` return cards only, which is correct. Any new endpoint there must return metadata only. Also record that group-2 paths are cached and shared, so nothing under them may vary by reader.

**Done when:** the site serves through the edge Worker identically to before, with no mOS behaviours configured yet. `Cf-Cache-Status: HIT` on the inner call. `Cookie` verifiably absent from what the site Worker receives on group 2 and group 3, and verifiably **present** on group 1. Router unit tests green, including the mOS-endpoint ordering test.

**Verify the pass-through case before configuring a single behaviour.** If the proxy breaks the site with zero behaviours active, that's a plumbing bug, and you want to find it separately from a config bug.

---

## Session 5 — Configure mOS (console work, not code)

No Claude Code. This is the part that sells the project, and the point is that it involves no deploys.

**Features:** `read-article`, `ad-free`, `comments`, `save-articles`.

**Plans:** Anonymous (5 metered articles, ads) · Registered (20 metered, ads, comments, saves) · Subscriber (unlimited, ads) · Subscriber Ad-free (unlimited, no ads).

**Component behaviours:**

| Selector | Action | Applies to |
|---|---|---|
| `[data-mos="article-locked"]` | remove | anonymous over quota, registered on premium |
| `[data-mos="paywall-slot"]` | set content | same |
| `[data-ad-slot]` | remove | ad-free plan |
| `[data-mos="meter-strip"]` | set content | all — shows quota state |
| `[data-mos="comments"]` | remove | anonymous |
| `[data-mos="premium-badge"]` | remove | subscriber |

**Ignore paths:** leave empty (see D5). If you find yourself adding a path here, check first whether it belongs in the edge Worker's router instead — that's where non-HTML exclusions live, and having both lists is how they drift.

**Dynamic provisioning:** map Clerk JWT claims → plan. Configure Clerk to include `email` and subscription state as custom claims.

**Offers:** a subscription offer group rendered into `[data-mos="paywall-slot"]`, with Stripe test-mode products behind it.

**Sticky-ad caveat from the audit:** `StickyAd.astro` has a client script that toggles visibility via `IntersectionObserver`. Removing the DOM node should be enough, but verify the script doesn't throw on a missing element — a console error during the demo is avoidable.

---

## Session 6 — Close the leaks

Small fixes that only matter once a paywall exists.

- **`getRelatedArticles` doesn't filter by `premium`.** A free reader's related rail surfaces premium articles. Not a content leak (mOS gates the article itself) but it's a bad funnel — every related click hits a wall. Decide: filter them out, or keep them as deliberate upsell bait. Either is defensible; pick one on purpose.
- **`/rss.xml`** — confirm it emits `dek` only, never body. It's a paywall bypass if it ships full text.
- **`/search-index.json`** — same. Check what it contains.
- **`/api/for-you.json`** — returns article cards; verify it can't return body content.

All four of these now bypass mOS entirely (D5), so the proxy will never gate them. Whatever they return is public. Add a test asserting that no group-1 or group-2 response contains a string from a premium article's body — cheap, and it catches the regression that a code review won't.
- **Structured data for paywalled articles:** add `NewsArticle` JSON-LD with `isAccessibleForFree: false` and a `hasPart` block marking the paywalled section. Without this, Google reads a paywall as cloaking. Worth doing properly — it's the detail that convinces a publisher's SEO lead you've done this before.

---

## Session 7 — Demo instrumentation

PostHog funnel: anonymous → metered → wall shown → registration → offer view → checkout → subscriber. Three browser profiles. Rehearse the script.

**The closing move:** in the mOS console, change the free-article allowance from 5 to 3, reload the anonymous window, show it changed. No deploy, no developer, no release ticket. Everything before this is setup for that thirty seconds.

---

## Sequencing

Sessions 1, 2 and 3 need no mOS account and are individually shippable — start today. Session 4 is the first that needs credentials, so get the mOS account provisioned in parallel with session 1.

Rough sizing: S1 half a day · S2 one day · S3 half a day · S4 one to two days · S5 one to two days console work · S6 half a day · S7 half a day.

## Risks

**Surface Decision latency becomes your TTFB floor.** Once rendering is cached away, every page view still waits on a round trip to `api.monetizationos.com`. Measure it during session 4, before you've built anything on top of it. If it's 150ms, that's your homepage's TTFB forever and it's worth knowing early.

**The origin is unreachable by design after session 3.** If you need to debug the raw HTML, do it with a temporary preview deploy under a different name, not by re-enabling `workers_dev` on `pulse-today` and forgetting.

**`@clerk/astro` version bumps** could change the `<Show>` CSR/SSR branching behaviour, which would silently start varying the origin HTML by auth state and poison the shared cache. Pin the version and add a test in session 2 that asserts the signed-out and signed-in HTML byte streams are identical.
