# Feature roadmap

PULSE is a demo publisher site meant to showcase the feature set a modern digital
publisher needs, blending patterns from top digital publishers (NYT, The Guardian,
WaPo, WSJ) rather than cloning one house style.

Two build passes have shipped so far:

- **SSR migration** — the site now renders on Cloudflare Workers via `@astrojs/cloudflare`
  (`output: 'server'`), querying Sanity live per request instead of only at build time.
- **Tier 1**: RSS feed, XML sitemap, JSON-LD structured data, tag archive pages, a
  live-editable breaking news banner, real (non-fake) search, social share buttons, a
  Clerk-metadata-backed reading list, and a broken-link fix.
- **Tier 2**: a trending/most-read module, a live blog document type with a
  newest-first reader page, a newsletter topic preference center, an image/video
  lightbox, font-size reading controls, a cookie consent banner, trust/transparency
  pages (About, Editorial Standards, Corrections, Contact), and a "For You"
  personalized rail driven by `localStorage` reading history.

What's below is the **backlog** — explicitly deferred items, not yet scheduled.

## Backlog

- **Real newsletter ESP integration** (Mailchimp/ConvertKit/Buttondown). Newsletter
  capture is currently simulated client-side only (validates the email, shows a fake
  success state, no data is actually sent anywhere).
- **Real comments platform** (e.g. a hosted comment service). Comments are currently
  a UI-only preview with hardcoded fake data and a no-op submit handler
  (`src/components/Comments.tsx`). Flagged as a possible later swap-in rather than
  something PULSE should build and host itself.
- **Paywall / registration-gated content.** `premium` is currently a display-only
  flag — premium articles show a "PULSE+" banner but the full article still renders.
  Actual gating is planned separately via monetisationOS, intentionally out of scope
  here.
- **Push notifications for breaking news** (Web Push). Needs real backend
  infrastructure (subscription storage, a push service) beyond what this project
  currently has.
- **Games/puzzles vertical** (NYT Wordle-style). Fun, but tangential to the core
  publisher story this demo is telling.
- **Markets/weather ticker** (WSJ-style). Niche fit for a generalist publisher across
  tech/culture/science/sports/business — revisit only if the Business section wants
  it specifically.
- **Real analytics** (Plausible/PostHog or similar). More of an operational/ownership
  concern than a reader-facing feature, so it wasn't prioritized alongside the
  reader-facing work above.

## Notes for whoever picks these up

- Newsletter/comments were deliberately kept simulated (no D1/KV, no API routes) per
  an earlier product decision — swapping in a real backend for either is a deliberate
  architecture change, not just "wire up the existing form."
- The site is fully SSR now (see `src/lib/sanity/client.ts`'s `getSanityClient`
  factory and `Astro.locals.runtime.env`), so any backlog item that needs its own
  backend can add Cloudflare Worker bindings (KV/D1) or new API routes the same way
  `src/pages/api/saved-articles.json.ts` and `src/pages/api/for-you.json.ts` already
  do.
