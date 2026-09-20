# Sanity → EmDash migration

This repo's CMS moved from [Sanity](https://www.sanity.io/) to [EmDash](https://docs.emdashcms.com), a self-hosted, Astro-native CMS. This doc records the architecture decision, the content-model mapping from the old Sanity schema, and the handful of things worth double-checking after your first real deploy.

Most of the REST/plugin behavior below was verified directly against `emdash@1.0.0`'s published npm package (its source ships in the `src/` folder of the tarball, not just compiled `dist/`) rather than guessed from docs prose — where something is still a best-effort guess rather than a confirmed fact, it says so explicitly and points at the exact place to check.

## Why a separate `apps/cms` app, not EmDash's normal setup

EmDash's own docs lead with a single-app model: you add the `emdash()` integration directly to your Astro site, and that one Astro app serves both the public pages and the `/_emdash/admin` editor UI, querying its own database in-process via `getEmDashCollection()` / `getEmDashEntry()`.

That's incompatible with this repo's hard rules (`CLAUDE.md`):

- `apps/site` ("pulse-today") **must never be publicly reachable** and **must render byte-identical HTML for every reader**. Mounting EmDash's admin panel — and the passkey auth it needs for editors to sign in — directly contradicts both.
- The `emdash()` integration's in-process query API only works because it shares a process and database connection with the app it's mounted in. There's no supported way to mount EmDash in one Worker and query it in-process from a different one.

So this repo keeps EmDash in its own app, `apps/cms` ("pulse-cms") — a plain, single-app EmDash site exactly as EmDash's docs describe, just not the same app that renders reader-facing pages. It's a separate, publicly reachable Cloudflare Worker deploy, replacing the old `studio/` (Sanity Studio) in the project layout and in spirit.

`apps/site` reads **published** content from `apps/cms` over [EmDash's documented REST API](https://docs.emdashcms.com/reference/rest-api/) (`/_emdash/api/content/...`, `/_emdash/api/settings`, `/_emdash/api/menus/...`), using a personal access token scoped to `content:read` + `media:read`. This is explicitly the *supported external contract* — EmDash's docs call the OpenAPI-documented REST surface "the boundary of the supported REST API" — even though it's not the pattern EmDash's own guides lead with.

**Trade-off accepted:** the REST API (confirmed against `src/api/schemas/content.ts`'s `contentListQuery`) supports **no server-side filtering by custom fields** — only `status`, one `orderBy` field + `order`, and cursor pagination. There's no equivalent of the in-process API's `where: { category: "news" }`. `apps/site/src/lib/emdash/content.ts` therefore fetches whole (paginated) collections once per request and filters/joins them in memory — the same approach the old pre-Sanity mock-data layer (`src/data/content.ts`) used. Fine for this site's dataset size; would need a real backend rethink (EmDash's own `/search` endpoint, or something bigger) well before that stops being true.

## Content model

Defined in [`apps/cms/seed/seed.json`](../apps/cms/seed/seed.json). Collection and field slugs are `snake_case` throughout — confirmed against `src/seed/types.ts`'s `SeedField`/`SeedCollection`: slugs must match the pattern "lowercase letters, numbers, and underscores" (no hyphens, no camelCase). `content.ts` translates snake_case API fields back to the camelCase shape the rest of the app expects.

The seed file only sets the properties `SeedCollection` actually has (`slug, label, labelSingular, description, icon, supports, urlPattern, commentsEnabled, fields`) — things like a collection's admin-sidebar grouping, sort order, or hidden state aren't seed-file concepts in this version; set them by hand in **Content Types** in the admin after seeding if you want them.

| Old Sanity type | New EmDash shape | Why |
|---|---|---|
| `article` (document) | `articles` collection | `section` and `author` are `reference` fields; `body` is a `portableText` field. |
| `author` (document) | `authors` collection | **Not** EmDash's built-in Bylines feature — bylines have a fixed schema (name, bio, avatar, guest flag) with no room for `role` (job title) and `twitter`, so authors stayed a first-class collection. |
| `section` (document) | `sections` collection | **Not** an EmDash taxonomy (a different concept from EmDash's own "Sections" reusable-content-block feature, despite the name collision). Taxonomy terms only carry label/slug/description/parent; this site's sections need `tagline`, `accent_color` and a manual `display_order`, which only a real collection's custom fields give you. |
| `article.tags` (freeform string array) | `tag` taxonomy on `articles` | A good fit for EmDash's built-in taxonomy feature. **Behavior change:** tags are now a controlled vocabulary (an editor picks/creates a term in **Taxonomies**) rather than freeform per-article strings, and the URL/display string is the term's *slug*. |
| `article.authors[]` (array, multiple authors) | `articles.author` — a **single** `reference` field | Checked directly against `src/schema/types.ts`: a `reference` field's `allowMultiple` option is declared in the type but used nowhere else in the codebase — multi-value references aren't implemented in this EmDash version. Co-bylines are a real feature loss versus the old schema; `ArticleDetail.authors`/`ArticleCardData.authors` stay arrays in `apps/site`'s types for now (just always length ≤ 1) so component code didn't need to change, and to make it a one-line fix (populate more than one element) if/when EmDash adds multi-reference support. |
| `liveBlog` (document) | `live_blogs` collection | Direct mapping. |
| `liveBlog.entries[]` (array of `liveBlogEntry` objects) | `live_blog_entries` collection, referencing `live_blogs` via a `live_blog` field | Repeater fields cannot hold Portable Text or reference fields (confirmed: `RepeaterSubField.type` in `src/schema/types.ts` only allows string/text/url/number/integer/boolean/datetime/select) — and live blog entries need both (`body`, `author`). Modeled as its own collection instead; `apps/site` fetches the whole collection and filters by `live_blog` in memory, same as every other cross-collection query (see above). |
| `seo` object (on every document) | Explicit `seo_meta_title` / `seo_meta_description` / `seo_og_image` fields on every collection | EmDash does have a built-in per-entry SEO panel (confirmed in `src/api/schemas/content.ts`: `seo: { title, description, image, canonical, noIndex }` on every content item), but its `image` is a bare string (asset URL or ID, not a resolved `{width,height}` object) and enabling it costs a `supports: ["seo"]` flag with admin-UI behavior this repo didn't need to take on. Explicit fields kept full parity with the old Sanity `seo` object and stayed fully under this repo's control. |
| `siteSettings.title` / `.tagline` / `.logo` | EmDash's built-in **General** settings (`GET /_emdash/api/settings`) | Confirmed shape (`src/api/schemas/settings.ts`): `{title?, tagline?, logo?: {mediaId, alt?}, favicon?, url?, postsPerPage?, dateFormat?, timezone?, social?, seo?}`. `logo`/`favicon` are bare media references, not resolved image objects — `content.ts`'s `resolveMediaRef()` makes one extra `GET /media/{id}` call to turn `{mediaId}` into a usable URL, which is why the API token also needs `media:read`. |
| `siteSettings.mainNav` / `.footerLinkGroups` | EmDash's built-in **Menus** (`primary`, `footer`) | Confirmed shape (`src/api/schemas/menus.ts`): a menu's items are a **flat** list with `parent_id` links (not a nested `children` array as the JS-API docs example implied) and each item is either `custom_url` or a `reference_collection`/`reference_id` pair. `content.ts`'s `buildMenuTree()`/`resolveMenuItemUrl()` do that grouping and reference-resolution by hand. A footer group heading is a top-level menu item (label only, `custom_url` empty); its links are that item's children. |
| `siteSettings.socialLinks` / `.copyrightText` / `.defaultSeo` / `.breakingNews` | `site_extras` collection (single entry) | EmDash's built-in Social settings only cover `twitter, github, facebook, instagram, linkedin, youtube` (confirmed in `src/api/schemas/settings.ts`) — no `tiktok`, which this site uses — so these stayed in a small collection this repo fully controls, same reasoning as the SEO fields above. |

### Portable Text

EmDash's `portableText` field uses the same open [Portable Text](https://portabletext.org) spec Sanity used for the standard `block` type (paragraphs, headings, quotes, lists, links, marks), so `apps/site`'s renderer (`components/portable-text/`) needed no changes there.

The native inline **image** block and **embed** block shapes are confirmed against EmDash's own editor source (`src/components/InlinePortableTextEditor.tsx`, `Image.astro`, `Embed.astro`):

```jsonc
// image block
{ "_type": "image", "_key": "...", "asset": { "_ref": "<mediaId>", "url": "..." },
  "alt": "...", "caption": "...", "width": 1200, "height": 800 }

// embed block (video/audio)
{ "_type": "embed", "_key": "...", "url": "https://youtu.be/...", "provider": "...", "caption": "..." }
```

`content.ts`'s `normalizePortableText()` maps both into the same `imageBlock`/`videoEmbed` shapes the old Sanity-backed renderer used. `VideoEmbed.astro` extracts a YouTube/Vimeo video ID from whatever URL an editor pastes (matching EmDash's own `Embed.astro` logic) rather than assuming it's already a ready-to-embed `/embed/...` URL.

### Images

`apps/site/src/lib/emdash/image.ts` is a compatibility shim matching `@sanity/image-url`'s chainable API (`urlFor(img).width(w).height(h).fit("crop").url()`) so every call site needed zero changes. It currently returns the **original image, unresized** — real on-the-fly variants (Cloudflare Image Resizing against pulse-cms's media) are a deliberate follow-up; the shim's own comment has the steps to wire it up.

### Revalidation

See [`docs/cache-revalidation.md`](./cache-revalidation.md) for the full picture. In short: the Sanity webhook (HMAC-signed) became a native EmDash plugin (`packages/emdash-revalidate-plugin`) reacting to content lifecycle hooks, since EmDash has no separate outbound-webhook feature.

One real constraint shaped that plugin: EmDash's `PluginContext` (confirmed against `src/plugins/types.ts`) has **no `ctx.env`** — a native plugin gets `ctx.http`, `ctx.kv`, `ctx.storage`, `ctx.content`, `ctx.log`, etc., but no raw environment-variable access. So the plugin's destination URL and shared secret are passed as plain arguments from `apps/cms/astro.config.mjs`, which reads them from `process.env` **at build time** (`SITE_REVALIDATE_URL`, `REVALIDATE_SECRET` in `apps/cms/.env.example`) rather than as a `wrangler secret put` runtime secret. That means the secret is baked into the built Worker bundle — an accepted trade-off (the bundle is already a trusted deploy artifact), not an oversight.

## Package versions

`emdash` and `@emdash-cms/cloudflare` are pinned to the exact same version (`0.38.0` as of writing) rather than left on a `^` range: `@emdash-cms/cloudflare`'s own `package.json` pins an exact `emdash` dependency, one minor behind emdash's own latest (`1.0.0`) at the time this was built. Mixing `emdash@1.0.0` with `@emdash-cms/cloudflare@0.38.0` risks incompatible internal types (the D1/R2 adapters import types from `emdash` directly). Bump both together, checking `@emdash-cms/cloudflare`'s pinned `emdash` version first (`npm view @emdash-cms/cloudflare dependencies.emdash`).

`d1`/`r2` come from `@emdash-cms/cloudflare`'s top-level export, not `emdash/db` or `emdash/astro` — confirmed by inspecting the published package: `emdash/db` only exports `sqlite`/`libsql`/`postgres`.

## Known issue: `npm run build -w apps/cms` currently fails

Building `apps/site` and running its test suite both succeed as-is. `apps/cms`'s build does not, as of the exact dependency versions pinned here (`astro@7.3.3`, `@astrojs/cloudflare@14.3.2`, `emdash@0.38.0`, `@emdash-cms/cloudflare@0.38.0` — the latest published versions of each at the time this was built). This was reproduced directly, repeatedly, from a clean `dist/`/`.astro`/Vite-cache state; it is not a one-off.

**Symptom:** `astro build` (via `astro sync`'s internal dependency pre-bundling pass) fails with a batch of esbuild errors it cannot recover from:

```
✘ [ERROR] Could not resolve "astro:assets"
    node_modules/@astrojs/cloudflare/dist/utils/image-binding-transform.js:1:28
✘ [ERROR] Could not resolve "virtual:astro:assets/fonts/internal"
✘ [ERROR] Could not resolve "virtual:astro:assets/fonts/runtime/font-file-url-resolver"
✘ [ERROR] Could not resolve "astro:asset-imports"
✘ [ERROR] Could not resolve "virtual:astro:get-image"
```

These are all Astro build-time virtual modules that only resolve inside Astro's own Vite pipeline; something in this combination of `astro sync`'s temporary Vite server and `@astrojs/cloudflare`'s Vite-plugin-based integration (new in its v14 line) is sweeping a server-only file (`image-binding-transform.js`) into a dependency-optimization pass that can't see those virtual modules. It reproduces identically whether or not `astro.config.mjs` sets `imageService` explicitly, and across repeated attempts with all caches cleared (`dist/`, `.astro/`, `node_modules/.vite`) — so it isn't a stale-cache artifact.

A separate, smaller issue in the same area **is** fixed here: `@astrojs/cloudflare` validates that `wrangler.jsonc`'s `main` file already exists before `astro build` produces it, which fails on a true first build. `apps/cms/package.json`'s `prebuild` script (`mkdir -p dist/_worker.js && touch dist/_worker.js/index.js`) papers over that specific chicken-and-egg gap — confirmed working — and is unrelated to the `astro:assets` failure above, which persists regardless.

**What this means for you:** `apps/cms` is fully written and its config was validated as far as this environment allows — the `emdash()` integration loads, logs its version banner, and resolves `d1()`/`r2()`/the revalidate plugin without error; only the final Cloudflare-target production build step fails. Before deploying:

1. Check for newer patch/minor releases of `astro`, `@astrojs/cloudflare`, and `@emdash-cms/cloudflare` — pin the newest mutually-compatible set (keep `emdash` and `@emdash-cms/cloudflare` on the exact same version per the note above) and retry `npm run build -w apps/cms`.
2. Search EmDash's GitHub issues/Discord for `astro:assets` / `image-binding-transform` — given how specific the failing import is, this is likely either a known, already-fixed issue in a version newer than what was available here, or one worth reporting with the exact repro above.
3. If it persists, try `imageService: "passthrough"` in `astro.config.mjs` (documented as "the deliberate way out" when the Cloudflare Images binding path causes trouble) as a temporary unblock, accepting unresized images until the underlying issue is resolved.

## Things worth double-checking after your first deploy

None of these are load-bearing for correctness beyond their own feature — a wrong guess here drops one thing (an image block, a nav link's URL, a cache purge), it doesn't corrupt content or bypass the paywall (that logic lives entirely in `apps/edge`/`apps/site/src/middleware.ts`, untouched by any of this).

1. **`select` field seed syntax** — `live_blogs.status` and the `social_links` repeater's `platform` sub-field use `validation: { options: [...] }` / sub-field `options: [...]` (plain string arrays, confirmed against `src/schema/types.ts`'s `FieldValidation`/`RepeaterSubField`). Run `npm run cms:seed:validate` before applying to catch anything still off.
2. **The revalidate plugin's `event.content` shape for custom fields** — confirmed the hook event is `{ content, collection }` (`src/emdash-runtime.ts`), but whether `content`'s custom fields (e.g. `live_blog` on a `live_blog_entries` item) are nested under `content.data.live_blog` (the REST shape) or flat as `content.live_blog` (closer to the raw DB row) wasn't fully pinned down. The plugin's `readField()` helper checks both. Trigger a live-blog-entry publish and check pulse-cms's logs (`ctx.log`) if `parentSlug` isn't resolving.
3. **Menu item `type` values for seeding actual nav links** — the seed file's menus start empty (`items: []`); fill them in through the admin UI (Settings → Menus) rather than hand-writing seed JSON for them, since `SeedMenuItem.type`'s exact accepted values weren't fully enumerated while building this.
