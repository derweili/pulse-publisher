# PULSE

A demo digital publisher built on Astro (SSR) + [EmDash](https://docs.emdashcms.com), fronted by a Cloudflare Workers edge proxy that integrates with MonetizationOS for metering/paywall behavior. See `CLAUDE.md` for the target architecture and hard rules, `docs/emdash-migration-plan.md` for how content moved from Sanity to EmDash, and `docs/mos-integration-plan.md` for how the mOS integration got built up, session by session.

## 🚀 Project Structure

This is an npm-workspaces monorepo:

```text
/
├── apps/
│   ├── site/        "pulse-today" — Astro SSR app, renders pages, reads published content from
│   │                 apps/cms over EmDash's REST API. NOT publicly reachable; only reachable via
│   │                 apps/edge's SITE service binding.
│   ├── edge/         "pulse-edge" — the public entry point. Cloudflare Worker that reverse-proxies
│   │                  apps/site through the MonetizationOS proxy (auth read, surface decisions,
│   │                  HTMLRewriter).
│   └── cms/          "pulse-cms" — EmDash CMS: admin panel + database-backed content + media. A
│                      separate, publicly reachable deploy target, unrelated to the mOS proxy split.
├── packages/
│   └── emdash-revalidate-plugin/  Native EmDash plugin: notifies apps/site's cache-purge endpoint
│                                   after a publish/unpublish/schedule change.
├── docs/              Architecture, planning, and local-dev docs (see docs/local-dev.md).
└── package.json      Workspace root.
```

To learn more about Astro's own project structure within `apps/site`/`apps/cms`, refer to [Astro's guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🚀 Commands

All commands below are run from the repo root unless noted. Requires Node 22 (`.nvmrc`) — see [`docs/local-dev.md`](./docs/local-dev.md) for the full local-dev setup, including running `apps/site` and `apps/edge` together.

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies for every workspace        |
| `npm run dev`             | `apps/site` only, via `astro dev` — `localhost:4321`, full HMR |
| `npm run dev:full`        | `apps/site` (`astro dev`) + `apps/edge` (`wrangler dev`) together, talking over plain HTTP. Fast loop for edge work. |
| `npm run preview:full`    | Real `wrangler dev` for both, with the actual `SITE` service binding — the closest to production you can get locally. Slower, no HMR. |
| `npm run build`           | Build `apps/site` to `apps/site/dist/`           |
| `npm run check`           | Type-check `apps/site` (`astro check`)           |
| `npm run cf:preview`      | Build `apps/site`, then preview it alone with `wrangler dev` |
| `npm run deploy`          | Build, then deploy `apps/site` to Cloudflare Workers |
| `npm run cms:dev`         | Run pulse-cms locally (see [Content](#️-content-emdash)) |
| `npm run cms:deploy`      | Build, then deploy pulse-cms to Cloudflare Workers |
| `npm run cms:seed`        | Apply `apps/cms/seed/seed.json`'s content model to the connected database |
| `npm run cms:seed:validate` | Validate the seed file without applying it     |

`apps/edge` has its own `dev` / `deploy` / `test` / `check` scripts, run via `-w apps/edge` or from within that directory — see `CLAUDE.md`'s Commands section.

## 🧑‍💻 Local development

Three ways to run this locally, from fastest/least-faithful to slowest/most-faithful — `npm run dev` (site only), `npm run dev:full` (site + edge, HTTP-linked), `npm run preview:full` (site + edge, real Workers service binding). Full walkthrough, including why two edge-inclusive modes exist and the gotchas of running two `wrangler dev` processes at once, is in [`docs/local-dev.md`](./docs/local-dev.md).

With `npm run dev:full`, `apps/site` (`astro dev`) runs at `http://localhost:4321` and `apps/edge` (`wrangler dev`, the mOS proxy) runs at its default `http://localhost:8787` — hit **`:8787`** as a reader, since that's the Worker that actually runs the auth read, surface-decisions call, and `HTMLRewriter` pipeline; `:4321` bypasses all of it.

`apps/site` needs pulse-cms reachable too — run `npm run cms:dev` in a separate terminal (defaults to `localhost:4322`) and point `apps/site/.dev.vars`'s `EMDASH_URL` at it. See [Content](#️-content-emdash) below.

## ☁️ Deploying to Cloudflare Workers

Three Workers — see `CLAUDE.md` for the full mOS-facing architecture (`apps/site` + `apps/edge`); `apps/cms` is a separate, independent deploy unrelated to that split:

- **`apps/site`** ("pulse-today") renders via SSR using [`@astrojs/cloudflare`](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) — every page reads published content from pulse-cms live, per request, so publishing/editing content there shows up immediately with no rebuild. Static assets are served from `apps/site/dist` via the Workers [assets binding](https://developers.cloudflare.com/workers/static-assets/). **Not publicly reachable** (`workers_dev = false`, no routes) — only `apps/edge` can reach it, via the `SITE` service binding. Configuration: [`apps/site/wrangler.toml`](./apps/site/wrangler.toml).
- **`apps/edge`** ("pulse-edge") is the public entry point. A Cloudflare Worker that reverse-proxies `apps/site` through the MonetizationOS proxy (auth read, surface decisions, `HTMLRewriter`). Configuration: [`apps/edge/wrangler.toml`](./apps/edge/wrangler.toml).
- **`apps/cms`** ("pulse-cms") is EmDash's admin + content API. **Publicly reachable by design** — editors sign in at `/_emdash/admin`. Configuration: [`apps/cms/wrangler.jsonc`](./apps/cms/wrangler.jsonc).

### Deploying pulse-cms (first, before pulse-today)

> **Known issue:** `npm run build -w apps/cms` currently fails at the latest published versions of `astro`/`@astrojs/cloudflare`/`emdash`/`@emdash-cms/cloudflare` (a Vite dependency-optimizer error unrelated to this repo's own code — `apps/site` and its tests build and pass cleanly). See "Known issue" in [`docs/emdash-migration-plan.md`](./docs/emdash-migration-plan.md) for the exact error and things to try before you deploy.

pulse-cms needs its own D1 database and R2 bucket, created once per environment:

```sh
cd apps/cms
npx wrangler d1 create pulse-cms            # copy the returned database_id into wrangler.jsonc
npx wrangler r2 bucket create pulse-cms-media

npx emdash secrets generate --write .env    # local EMDASH_ENCRYPTION_KEY
npx wrangler secret put EMDASH_ENCRYPTION_KEY   # production — use a freshly generated key, not the .env one

# SITE_REVALIDATE_URL / REVALIDATE_SECRET are NOT `wrangler secret put` —
# they're build-time values for packages/emdash-revalidate-plugin (EmDash
# plugins have no runtime env access), read from `.env` when you build. Set
# them in apps/cms/.env before running `npm run deploy` (which builds first),
# or export them in your shell / CI before that step. REVALIDATE_SECRET must
# match apps/site's value exactly. See docs/emdash-migration-plan.md.

npm run deploy   # from apps/cms, or `npm run cms:deploy` from the repo root
```

Then, once deployed:

1. Visit `/_emdash/admin/setup` on the deployed Worker to create the first admin account (passkey).
2. Apply the content model: `npm run cms:seed` (point it at the deployed instance — see EmDash's seed-file docs for applying against a remote database, or run it once against a local `wrangler dev` tunnel).
3. Create exactly one entry in the **Site extras** collection (breaking-news banner, social links, default SEO, copyright override).
4. Fill in the **primary** and **footer** menus (Settings → Menus) and the built-in **General** settings (title, tagline, logo).
5. Create a personal access token scoped to `content:read` and `media:read` (Settings → API tokens) — this is `EMDASH_API_TOKEN` for `apps/site`. `media:read` is needed to resolve the General settings logo/favicon, which the Settings API returns as a bare media reference (`{mediaId, alt}`) rather than a ready-to-use URL.
6. Optionally add a custom domain (e.g. `cms.pulse.derweili.de`) via a Wrangler route in `wrangler.jsonc`, and enable Cloudflare Image Resizing for that zone if you want on-the-fly image variants (see `apps/site/src/lib/emdash/image.ts`).

### Deploying pulse-today

```sh
npm install -g wrangler   # or use the local devDependency via npx
npx wrangler login

# One-time per environment, each a Worker runtime secret (not a build-time env var):
npx wrangler secret put EMDASH_API_TOKEN --cwd apps/site
npx wrangler secret put REVALIDATE_SECRET --cwd apps/site   # same value as pulse-cms's REVALIDATE_SECRET

# EMDASH_URL is a plain (non-secret) runtime var:
npx wrangler secret put EMDASH_URL --cwd apps/site   # or `wrangler vars put` / the dashboard

npx wrangler secret put MOS_SECRET_KEY --cwd apps/edge

npm run deploy              # apps/site
npm run deploy -w apps/edge # apps/edge
```

### Deploying via GitHub Actions

[`.github/workflows/deploy-site.yml`](./.github/workflows/deploy-site.yml), [`.github/workflows/deploy-edge.yml`](./.github/workflows/deploy-edge.yml) and [`.github/workflows/deploy-cms.yml`](./.github/workflows/deploy-cms.yml) each build/test and deploy their respective Worker with Cloudflare's official [`wrangler-action`](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), path-filtered so a change to one app doesn't redeploy the others — on every push to `main` (and via manual `workflow_dispatch`).

To enable them, add these repository secrets under **Settings → Secrets and variables → Actions**:

| Secret                  | Description                                                                                                                                                                                     |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | An API token with **Workers Scripts: Edit** permission for the target account. Create one at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) using the "Edit Cloudflare Workers" template (or a custom token scoped to `Account.Workers Scripts:Edit`). |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID, found on the right-hand sidebar of the [Workers & Pages dashboard](https://dash.cloudflare.com) overview page, or by running `npx wrangler whoami`.                |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | Your [Clerk](https://dashboard.clerk.com) publishable key. Clerk auth (sign-in button, user profile) runs entirely client-side regardless of SSR — this key gets baked into the build output, so it must be set for `deploy-site.yml`'s **Build** step. Not a secret value, but stored as an Actions secret here for convenience. |
| `SITE_REVALIDATE_URL` | Full URL of apps/site's revalidate endpoint (e.g. `https://pulse.derweili.de/api/revalidate`), needed by `deploy-cms.yml`'s **Build** step — see below for why this is build-time. |
| `REVALIDATE_SECRET` | The shared secret packages/emdash-revalidate-plugin sends to apps/site — must match apps/site's own `REVALIDATE_SECRET` runtime secret. Also needed by `deploy-cms.yml`'s **Build** step. |

`EMDASH_URL`, `EMDASH_API_TOKEN`, apps/site's `REVALIDATE_SECRET`, `EMDASH_ENCRYPTION_KEY` and `MOS_SECRET_KEY` are Cloudflare Worker runtime vars/secrets, set once per environment with `wrangler secret put` (see the deploy sections above), or in the Cloudflare dashboard under **Workers & Pages → your Worker → Settings → Variables** — CI doesn't need them, deploys don't rotate them. `SITE_REVALIDATE_URL` and pulse-cms's `REVALIDATE_SECRET` are the one exception: they're read at **build** time by `apps/cms/astro.config.mjs` (EmDash's native-plugin API has no runtime env access — see `packages/emdash-revalidate-plugin`'s own comment), so `deploy-cms.yml` does need them as Actions secrets, injected into its build step.

Each `wrangler.toml`/`wrangler.jsonc` already defines its Worker's name, entry point, compatibility date, and (for `apps/site`/`apps/cms`) assets directory.

## ✍️ Content (EmDash)

All site content (articles, authors, sections, live blogs, site settings) is managed in [EmDash](https://docs.emdashcms.com), a self-hosted CMS that runs as part of the `apps/cms` ("pulse-cms") Astro app — its admin panel, database, and media library all live there. `apps/site` reads **published** content from pulse-cms's REST API per request (see `apps/site/src/lib/emdash/`), the same relationship this app used to have with Sanity's hosted API — publishing or editing content in pulse-cms's admin is live on the site immediately, no rebuild needed. There is still no runtime/browser dependency on the CMS; all fetching happens server-side.

**Why a separate app instead of EmDash's normal single-app setup:** EmDash is normally added directly to the Astro app that also renders your pages. CLAUDE.md requires `apps/site` to stay unreachable and auth-blind (no admin routes, no passkey auth, byte-identical HTML for every reader), which rules that out — so pulse-cms is its own deploy, and `apps/site` talks to it over EmDash's documented REST API instead of the in-process query helpers EmDash's own docs lead with. See [`docs/emdash-migration-plan.md`](./docs/emdash-migration-plan.md) for the full rationale, the content-model mapping from the old Sanity schema, and everything flagged as unverified against a live instance.

For local dev, copy `apps/site/.dev.vars.example` to `apps/site/.dev.vars` and fill in `EMDASH_URL`/`EMDASH_API_TOKEN`/`REVALIDATE_SECRET` — `astro dev` reads Worker runtime secrets from that file via the Cloudflare adapter's `platformProxy`. See [`docs/local-dev.md`](./docs/local-dev.md) for the full local-dev setup, including `apps/edge`.

### Local pulse-cms setup

```sh
cd apps/cms
npm install
npx emdash secrets generate --write .env   # generates EMDASH_ENCRYPTION_KEY
cp .dev.vars.example .dev.vars             # fill in REVALIDATE_SECRET, SITE_REVALIDATE_URL
npm run dev                                 # opens pulse-cms, default localhost:4322
```

Then visit `/_emdash/admin/setup` to create your admin account, and apply the content model:

```sh
npm run seed:validate   # check apps/cms/seed/seed.json first
npm run seed            # apply it
```

From the repo root you can also run `npm run cms:dev` / `npm run cms:seed` as shortcuts.

### Content model

The full collection/field/taxonomy/menu layout is defined in [`apps/cms/seed/seed.json`](./apps/cms/seed/seed.json) and explained in [`docs/emdash-migration-plan.md`](./docs/emdash-migration-plan.md), including the mapping from every old Sanity document/object type.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
