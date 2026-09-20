# CLAUDE.md

Rules for this repo. These are constraints, not suggestions — violating any of them breaks the mOS integration (see `docs/mos-integration-plan.md` and `docs/mos-readiness.md` for the reasoning).

## Target architecture

```
reader ──► pulse.derweili.de ──► EDGE WORKER  "pulse-edge"   (apps/edge)  cache: DISABLED
                                 │
                                 ├─ /api/**                 → env.SITE.fetch(request)            cookies KEPT
                                 ├─ static/feeds/robots     → env.SITE.fetch(anonymize(request))  cookies STRIPPED
                                 └─ everything else (HTML)  → full mOS pipeline (auth read,
                                                               surface-decisions call, HTMLRewriter)
                                       │
                                       ▼ fetch(anonymize(request))
                              [ WORKERS CACHE ]  ← HIT: site Worker never runs
                                       │
                                       ▼
                               SITE WORKER  "pulse-today"   (apps/site)  cache: ENABLED
                                 · Astro SSR, renders identical HTML for every reader
                                 · queries apps/cms (Payload) live
                                 · NOT publicly reachable (service binding only)

editor ──► PULSE CMS (apps/cms, Payload) — separate deploy, unrelated to the proxy
```

- **`apps/site` ("pulse-today")** renders. It is auth-blind and reader-blind. It must never be publicly reachable — no `routes`, no `custom_domain`, `workers_dev = false`. It ships full premium article bodies in its response; if it is ever publicly reachable, the paywall is bypassed.
- **`apps/edge` ("pulse-edge")** is the only public entry point. It reads the reader's identity, calls the mOS Decision API, and rewrites HTML via `HTMLRewriter`. It reaches the site only through the `SITE` service binding.
- **`apps/cms`** is the Payload CMS — a separate Next.js deploy target (not part of the Cloudflare Workers pair above), untouched by any of the above. See `apps/cms/README.md`.

## Hard rules

- **Never add `clerkMiddleware()` to the site app, and never read `Astro.locals.auth` server-side there.** The moment that signal exists, `@clerk/astro`'s `<Show>` switches from its CSR variant to its SSR variant and starts rendering different HTML per reader. The origin must render byte-identical HTML for every reader, signed in or not. All reader variance belongs in the edge Worker, sourced from the mOS Decision API.
- **Every mOS hook is a stable `data-mos` (or `data-mos-*`) attribute on server-rendered HTML.** Never a Tailwind/utility class, never a hashed/generated class, never an `id`. Classes and ids are expected to change under refactors; `HTMLRewriter` selectors are not allowed to break when they do.
- **Never use `:last-child` (or any `:nth-*`/sibling-position pseudo-selector) in a selector intended for mOS.** `HTMLRewriter` does not support it and skips the rule silently — no error, no warning, just a behaviour that never fires.
- **Never add `<ClientRouter />` (view transitions) and never enable Astro `prefetch`.** Every navigation must stay a full, fresh HTTP request that the edge Worker can intercept. Client-side routing or prefetching lets pages appear without a matching request/response cycle through the proxy.
- **The site Worker (`apps/site`) must never set a `Set-Cookie` header on a cacheable route.** A `Set-Cookie` forces a cache bypass on that route. Cacheable routes are defined in `apps/site/src/middleware.ts`.
- **`apps/site` must never be publicly reachable.** No `routes`, no `custom_domain`, `workers_dev = false`, preview URLs disabled. It is reachable only via the `SITE` service binding from `apps/edge`.
- **No route under `/api/` may ever return article body content** — cards/metadata only. `/api/**` bypasses the entire mOS pipeline (no metering, no decision call, no rewriting), so anything it returns is effectively public.
- **Any request forwarded to `apps/site` for a publicly cached, non-HTML path (assets, feeds, robots, sitemap, search index) must have `Cookie` and `Authorization` stripped first.** Those responses are shared across all readers; forwarding reader-specific headers into them either fragments the cache or leaks one reader's data to another.

## Commands

**Site** (`apps/site`, `pulse-today`):
- dev: `npm run dev`
- build: `npm run build`
- deploy: `npm run deploy` (equivalent to `npm run build && wrangler deploy`)

**Edge** (`apps/edge`, `pulse-edge` — created in session 4):
- dev: `wrangler dev` from `apps/edge`
- deploy: `wrangler deploy` from `apps/edge`

**CMS** (`apps/cms`, Payload):
- dev: `npm run cms:dev` (or `npm run dev` from `apps/cms`)
- build: `npm run cms:build`
- deploy: see `apps/cms/README.md` (a standard Next.js app — Vercel is the path of least resistance)
- seed demo content: `npm run cms:seed`
