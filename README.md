# PULSE

A demo digital publisher built on Astro (SSR) + Sanity, fronted by a Cloudflare Workers edge proxy that integrates with MonetizationOS for metering/paywall behavior. See `CLAUDE.md` for the target architecture and hard rules, and `docs/mos-integration-plan.md` for how it got built up, session by session.

## 🚀 Project Structure

This is an npm-workspaces monorepo:

```text
/
├── apps/
│   ├── site/        "pulse-today" — Astro SSR app, renders pages, queries Sanity. NOT publicly
│   │                 reachable; only reachable via apps/edge's SITE service binding.
│   └── edge/         "pulse-edge" — the public entry point. Cloudflare Worker that reverse-proxies
│                      apps/site through the MonetizationOS proxy (auth read, surface decisions,
│                      HTMLRewriter).
├── studio/           Sanity Studio — content schema + editing UI, a separate deploy target.
├── docs/              Architecture, planning, and local-dev docs (see docs/local-dev.md).
└── package.json      Workspace root.
```

To learn more about Astro's own project structure within `apps/site`, refer to [Astro's guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

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
| `npm run studio:dev`      | Run the Sanity Studio locally (see [Content](#-content-sanity-studio)) |
| `npm run studio:deploy`   | Deploy the Sanity Studio to its hosted URL       |
| `npm run studio:typegen`  | Regenerate `apps/site/src/lib/sanity/sanity.types.ts` from the schema + queries |
| `npm run studio:migrate`  | Run the one-off mock-data → Sanity migration script |

`apps/edge` has its own `dev` / `deploy` / `test` / `check` scripts, run via `-w apps/edge` or from within that directory — see `CLAUDE.md`'s Commands section.

## 🧑‍💻 Local development

Three ways to run this locally, from fastest/least-faithful to slowest/most-faithful — `npm run dev` (site only), `npm run dev:full` (site + edge, HTTP-linked), `npm run preview:full` (site + edge, real Workers service binding). Full walkthrough, including why two edge-inclusive modes exist and the gotchas of running two `wrangler dev` processes at once, is in [`docs/local-dev.md`](./docs/local-dev.md).

## ☁️ Deploying to Cloudflare Workers

Two Workers, service-bound together — see `CLAUDE.md` for the full architecture:

- **`apps/site`** ("pulse-today") renders via SSR using [`@astrojs/cloudflare`](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) — every page queries Sanity live, per request, so publishing/editing content in Studio shows up immediately with no rebuild. Static assets are served from `apps/site/dist` via the Workers [assets binding](https://developers.cloudflare.com/workers/static-assets/). **Not publicly reachable** (`workers_dev = false`, no routes) — only `apps/edge` can reach it, via the `SITE` service binding. Configuration: [`apps/site/wrangler.toml`](./apps/site/wrangler.toml).
- **`apps/edge`** ("pulse-edge") is the public entry point. A Cloudflare Worker that reverse-proxies `apps/site` through the MonetizationOS proxy (auth read, surface decisions, `HTMLRewriter`). Configuration: [`apps/edge/wrangler.toml`](./apps/edge/wrangler.toml).

### Deploying manually

```sh
npm install -g wrangler   # or use the local devDependency via npx
npx wrangler login

# One-time per environment, each a Worker runtime secret (not a build-time env var):
npx wrangler secret put SANITY_API_READ_TOKEN --cwd apps/site
npx wrangler secret put MOS_SECRET_KEY --cwd apps/edge

npm run deploy              # apps/site
npm run deploy -w apps/edge # apps/edge
```

### Deploying via GitHub Actions

[`.github/workflows/deploy-site.yml`](./.github/workflows/deploy-site.yml) and [`.github/workflows/deploy-edge.yml`](./.github/workflows/deploy-edge.yml) each build/test and deploy their respective Worker with Cloudflare's official [`wrangler-action`](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), path-filtered so a change to one app doesn't redeploy the other — on every push to `main` (and via manual `workflow_dispatch`).

To enable them, add these repository secrets under **Settings → Secrets and variables → Actions**:

| Secret                  | Description                                                                                                                                                                                     |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | An API token with **Workers Scripts: Edit** permission for the target account. Create one at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) using the "Edit Cloudflare Workers" template (or a custom token scoped to `Account.Workers Scripts:Edit`). |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID, found on the right-hand sidebar of the [Workers & Pages dashboard](https://dash.cloudflare.com) overview page, or by running `npx wrangler whoami`.                |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | Your [Clerk](https://dashboard.clerk.com) publishable key. Clerk auth (sign-in button, user profile) runs entirely client-side regardless of SSR — this key gets baked into the build output, so it must be set for `deploy-site.yml`'s **Build** step. Not a secret value, but stored as an Actions secret here for convenience. |
| `PUBLIC_SANITY_PROJECT_ID` | Your Sanity project ID (see [Content](#-content-sanity-studio) below). Not a secret, but needed at build time to know which project to query. |
| `PUBLIC_SANITY_DATASET` | The Sanity dataset to read from, typically `production`. |
| `PUBLIC_SANITY_API_VERSION` | A dated [Sanity API version](https://www.sanity.io/docs/api-versioning) string, e.g. `2025-02-01`. |

`SANITY_API_READ_TOKEN` and `MOS_SECRET_KEY` are **not** build secrets — both are Cloudflare Worker runtime secrets (the former because every page fetches Sanity live inside the Worker; the latter is the MonetizationOS API key). Set each once per environment with `wrangler secret put` (see [Deploying manually](#deploying-manually) above), or in the Cloudflare dashboard under **Workers & Pages → your Worker → Settings → Variables**. CI doesn't need either — deploys don't rotate them.

Each `wrangler.toml` already defines its Worker's name, entry point, compatibility date, and (for `apps/site`) assets directory.

## ✍️ Content (Sanity Studio)

All site content (articles, authors, sections, site settings) is managed in [Sanity](https://www.sanity.io/), a hosted headless CMS. The schema and Studio configuration live in this repo under [`studio/`](./studio) as a standalone package — Sanity's cloud backend hosts the actual dataset, this repo only defines the content model and editing UI. The Astro app queries Sanity **per request** via `@sanity/client`, from inside the Cloudflare Worker (see [Deploying to Cloudflare Workers](#%EF%B8%8F-deploying-to-cloudflare-workers) above) — publishing or editing content in Studio is live on the site immediately, no rebuild needed. There is still no runtime/browser dependency on Sanity; all fetching happens server-side.

For local dev, copy `apps/site/.dev.vars.example` to `apps/site/.dev.vars` and fill in `SANITY_API_READ_TOKEN` — `astro dev` reads Worker runtime secrets from that file via the Cloudflare adapter's `platformProxy`. See [`docs/local-dev.md`](./docs/local-dev.md) for the full local-dev setup, including `apps/edge`.

### Local Studio setup

```sh
cd studio
npm install
cp .env.example .env   # fill in SANITY_STUDIO_PROJECT_ID / SANITY_STUDIO_DATASET
npm run dev             # opens the Studio at localhost:3333
```

From the repo root you can also run `npm run studio:dev` as a shortcut (after `studio/`'s own `npm install`).

### Deploying the Studio

```sh
npm run studio:deploy   # or: cd studio && npm run deploy
```

This publishes the Studio to Sanity's hosted `<name>.sanity.studio` URL. Re-running it redeploys to the same URL.

### Regenerating types after a schema or query change

The Astro app's TypeScript types for every GROQ query (`apps/site/src/lib/sanity/sanity.types.ts`) are generated by Sanity's typegen and committed to the repo. Whenever you change a schema field in `studio/schemaTypes/` or a query in `apps/site/src/lib/sanity/queries.ts`, regenerate them:

```sh
npm run studio:typegen
```

### One-off content migration

`studio/scripts/migrate-content.ts` imports the original mock data from `src/data/content.ts` and writes it into Sanity as real documents (uploading each image as a Sanity asset in the process). It's idempotent — safe to re-run — and only needed once per new dataset:

```sh
cd studio
npm install
cp .env.example .env   # also fill in SANITY_API_WRITE_TOKEN (Editor permission)
npm run migrate
```

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
