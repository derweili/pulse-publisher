# Astro Starter Kit: Basics

```sh
npm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |
| `npm run check`           | Type-check the Astro app (`astro check`)         |
| `npm run cf:preview`      | Build, then preview the Worker locally with `wrangler dev` |
| `npm run deploy`          | Build, then deploy to Cloudflare Workers with `wrangler deploy` |
| `npm run studio:dev`      | Run the Sanity Studio locally (see [Content](#-content-sanity-studio)) |
| `npm run studio:deploy`   | Deploy the Sanity Studio to its hosted URL       |
| `npm run studio:typegen`  | Regenerate `src/lib/sanity/sanity.types.ts` from the schema + queries |
| `npm run studio:migrate`  | Run the one-off mock-data → Sanity migration script |

## ☁️ Deploying to Cloudflare Workers

This site is fully static (every route is prerendered), so it deploys to Cloudflare Workers using [Workers static assets](https://developers.cloudflare.com/workers/static-assets/) — no SSR adapter required. Configuration lives in [`wrangler.toml`](./wrangler.toml), which points at the `./dist` build output.

### Deploying manually

```sh
npm install -g wrangler   # or use the local devDependency via npx
npx wrangler login
npm run deploy
```

### Deploying via GitHub Actions

[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) builds the site and deploys it with Cloudflare's official [`wrangler-action`](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/) on every push to `main` (and via manual `workflow_dispatch`).

To enable it, add these repository secrets under **Settings → Secrets and variables → Actions**:

| Secret                  | Description                                                                                                                                                                                     |
| :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | An API token with **Workers Scripts: Edit** permission for the target account. Create one at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) using the "Edit Cloudflare Workers" template (or a custom token scoped to `Account.Workers Scripts:Edit`). |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID, found on the right-hand sidebar of the [Workers & Pages dashboard](https://dash.cloudflare.com) overview page, or by running `npx wrangler whoami`.                |
| `PUBLIC_CLERK_PUBLISHABLE_KEY` | Your [Clerk](https://dashboard.clerk.com) publishable key. The site is static, so Clerk auth (sign-in button, user profile) runs client-side — this key gets baked into the build output, so it must be set for the **Build** step. Not a secret value, but stored as an Actions secret here for convenience. |
| `PUBLIC_SANITY_PROJECT_ID` | Your Sanity project ID (see [Content](#-content-sanity-studio) below). Not a secret, but needed at build time to know which project to query. |
| `PUBLIC_SANITY_DATASET` | The Sanity dataset to read from, typically `production`. |
| `PUBLIC_SANITY_API_VERSION` | A dated [Sanity API version](https://www.sanity.io/docs/api-versioning) string, e.g. `2025-02-01`. |
| `SANITY_API_READ_TOKEN` | A Sanity **Viewer** API token. The dataset is private, so every build needs this to fetch content — set it here even though it isn't exposed to the browser. |

No other configuration is needed — `wrangler.toml` already defines the Worker name, compatibility date, and assets directory.

## ✍️ Content (Sanity Studio)

All site content (articles, authors, sections, site settings) is managed in [Sanity](https://www.sanity.io/), a hosted headless CMS. The schema and Studio configuration live in this repo under [`studio/`](./studio) as a standalone package — Sanity's cloud backend hosts the actual dataset, this repo only defines the content model and editing UI. The Astro app queries Sanity at **build time** (every page is statically generated) via `@sanity/client`; there is no runtime/browser dependency on Sanity.

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

The Astro app's TypeScript types for every GROQ query (`src/lib/sanity/sanity.types.ts`) are generated by Sanity's typegen and committed to the repo. Whenever you change a schema field in `studio/schemaTypes/` or a query in `src/lib/sanity/queries.ts`, regenerate them:

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
