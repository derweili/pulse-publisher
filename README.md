# PULSE

A demo digital publisher built on Astro (SSR) + Payload CMS, fronted by a Cloudflare Workers edge proxy that integrates with MonetizationOS for metering/paywall behavior. See `CLAUDE.md` for the target architecture and hard rules, and `docs/mos-integration-plan.md` for how it got built up, session by session.

## 🚀 Project Structure

This is an npm-workspaces monorepo:

```text
/
├── apps/
│   ├── site/        "pulse-today" — Astro SSR app, renders pages, queries apps/cms. NOT publicly
│   │                 reachable; only reachable via apps/edge's SITE service binding.
│   ├── edge/         "pulse-edge" — the public entry point. Cloudflare Worker that reverse-proxies
│   │                  apps/site through the MonetizationOS proxy (auth read, surface decisions,
│   │                  HTMLRewriter).
│   └── cms/          "pulse-cms" — Payload CMS (Next.js + Postgres). Content schema + admin UI, a
│                      separate deploy target. See apps/cms/README.md.
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
| `npm run cms:dev`         | Run the Payload CMS locally (see [Content](#️-content-payload-cms)) |
| `npm run cms:build`       | Build `apps/cms` for deployment                  |
| `npm run cms:seed`        | Seed `apps/cms` with the demo content            |

`apps/edge` has its own `dev` / `deploy` / `test` / `check` scripts, run via `-w apps/edge` or from within that directory — see `CLAUDE.md`'s Commands section. `apps/cms` has its own scripts too (`generate:types`, `migrate`, etc.) — see `apps/cms/README.md`.

## 🧑‍💻 Local development

Three ways to run `apps/site` and `apps/edge` locally, from fastest/least-faithful to slowest/most-faithful — `npm run dev` (site only), `npm run dev:full` (site + edge, HTTP-linked), `npm run preview:full` (site + edge, real Workers service binding). Full walkthrough, including why two edge-inclusive modes exist and the gotchas of running two `wrangler dev` processes at once, is in [`docs/local-dev.md`](./docs/local-dev.md). Run `apps/cms` alongside any of these with `npm run cms:dev` (see [Content](#️-content-payload-cms) below).

With `npm run dev:full`, `apps/site` (`astro dev`) runs at `http://localhost:4321` and `apps/edge` (`wrangler dev`, the mOS proxy) runs at its default `http://localhost:8787` — hit **`:8787`** as a reader, since that's the Worker that actually runs the auth read, surface-decisions call, and `HTMLRewriter` pipeline; `:4321` bypasses all of it.

## ☁️ Deploying to Cloudflare Workers

Two Workers, service-bound together — see `CLAUDE.md` for the full architecture:

- **`apps/site`** ("pulse-today") renders via SSR using [`@astrojs/cloudflare`](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) — every page queries apps/cms live, per request, so publishing/editing content in the CMS shows up immediately with no rebuild. Static assets are served from `apps/site/dist` via the Workers [assets binding](https://developers.cloudflare.com/workers/static-assets/). **Not publicly reachable** (`workers_dev = false`, no routes) — only `apps/edge` can reach it, via the `SITE` service binding. Configuration: [`apps/site/wrangler.toml`](./apps/site/wrangler.toml).
- **`apps/edge`** ("pulse-edge") is the public entry point. A Cloudflare Worker that reverse-proxies `apps/site` through the MonetizationOS proxy (auth read, surface decisions, `HTMLRewriter`). Configuration: [`apps/edge/wrangler.toml`](./apps/edge/wrangler.toml).

### Deploying manually

```sh
npm install -g wrangler   # or use the local devDependency via npx
npx wrangler login

# One-time per environment, each a Worker runtime secret (not a build-time env var):
npx wrangler secret put PAYLOAD_API_KEY --cwd apps/site
npx wrangler secret put PAYLOAD_WEBHOOK_SECRET --cwd apps/site
npx wrangler secret put MOS_SECRET_KEY --cwd apps/edge

npm run deploy              # apps/site
npm run deploy -w apps/edge # apps/edge
```

`apps/site/wrangler.toml`'s `[vars]` block sets `PAYLOAD_API_URL` (not a secret) to `apps/cms`'s deployed URL — update it there before deploying, or override per-environment in the Cloudflare dashboard.

### Deploying via GitHub Actions

[`.github/workflows/deploy-site.yml`](./.github/workflows/deploy-site.yml) and [`.github/workflows/deploy-edge.yml`](./.github/workflows/deploy-edge.yml) each build/test and deploy their respective Worker with Cloudflare's official [`wrangler-action`](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), path-filtered so a change to one app doesn't redeploy the other — on every push to `main` (and via manual `workflow_dispatch`).

To enable them, add these repository secrets under **Settings → Secrets and variables → Actions**:

| Secret                  | Description                                                                                                                                                                                     |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | An API token with **Workers Scripts: Edit** permission for the target account. Create one at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) using the "Edit Cloudflare Workers" template (or a custom token scoped to `Account.Workers Scripts:Edit`). |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID, found on the right-hand sidebar of the [Workers & Pages dashboard](https://dash.cloudflare.com) overview page, or by running `npx wrangler whoami`.                |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | Your [Clerk](https://dashboard.clerk.com) publishable key. Clerk auth (sign-in button, user profile) runs entirely client-side regardless of SSR — this key gets baked into the build output, so it must be set for `deploy-site.yml`'s **Build** step. Not a secret value, but stored as an Actions secret here for convenience. |

`apps/cms` isn't deployed by these workflows — it's a separate Next.js app (see [Content](#️-content-payload-cms) below), typically deployed via its host's own git integration (e.g. Vercel) rather than GitHub Actions.

`PAYLOAD_API_KEY`, `PAYLOAD_WEBHOOK_SECRET` and `MOS_SECRET_KEY` are **not** build secrets — all three are Cloudflare Worker runtime secrets (the first two because every page fetches apps/cms live inside the Worker; the third is the MonetizationOS API key). Set each once per environment with `wrangler secret put` (see [Deploying manually](#deploying-manually) above), or in the Cloudflare dashboard under **Workers & Pages → your Worker → Settings → Variables**. CI doesn't need any of them — deploys don't rotate them.

Each `wrangler.toml` already defines its Worker's name, entry point, compatibility date, and (for `apps/site`) assets directory.

## ✍️ Content (Payload CMS)

All site content (articles, authors, sections, live blogs, site settings) is managed in [Payload](https://payloadcms.com), a self-hosted headless CMS. The schema and admin UI live in this repo under [`apps/cms`](./apps/cms) as a standalone Next.js app — see [`apps/cms/README.md`](./apps/cms/README.md) for its full setup (Postgres, S3/R2 media storage, the service account `apps/site` authenticates as, and deploying it). The Astro app queries Payload **per request** via its REST API, from inside the Cloudflare Worker (see [Deploying to Cloudflare Workers](#️-deploying-to-cloudflare-workers) above) — publishing or editing content in the CMS is live on the site immediately, no rebuild needed. There is still no runtime/browser dependency on the CMS; all fetching happens server-side.

For local dev, copy `apps/site/.dev.vars.example` to `apps/site/.dev.vars` and fill in `PAYLOAD_API_URL`/`PAYLOAD_API_KEY`/`PAYLOAD_WEBHOOK_SECRET` — `astro dev` reads Worker runtime secrets from that file via the Cloudflare adapter's `platformProxy`. See [`docs/local-dev.md`](./docs/local-dev.md) for the full local-dev setup, including `apps/edge`.

### Local CMS setup

```sh
cd apps/cms
npm install
cp .env.example .env   # fill in DATABASE_URI at minimum
npm run dev             # opens the admin panel at localhost:3000/admin
npm run seed             # optional — seeds demo articles/authors/sections
```

From the repo root you can also run `npm run cms:dev` / `npm run cms:seed` as shortcuts.

### Deploying the CMS

`apps/cms` is a standard Next.js + Postgres app — deploy it anywhere Next.js runs (Vercel is the path of least resistance). See [`apps/cms/README.md`](./apps/cms/README.md) for environment variables, connecting `apps/site` to it, and the cache-purge webhook.

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
