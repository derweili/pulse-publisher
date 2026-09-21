# pulse-cms

The content backend for PULSE — a [Payload CMS](https://payloadcms.com) app (Next.js + Postgres) that replaces the old Sanity Studio. It has no public frontend beyond `/admin`; `apps/site` reads from it over Payload's REST API.

## Collections & globals

| Type | Slug | Notes |
|---|---|---|
| Collection | `sections` | Tech, Culture, etc. |
| Collection | `authors` | Bylines. |
| Collection | `articles` | Draft/publish enabled. `body` is rich text (Lexical) with two custom embeds: `imageBlock` and `videoEmbed`. |
| Collection | `live-blogs` | Draft/publish enabled. `entries[]` is an array of timestamped updates, each with its own rich-text `body`. |
| Collection | `media` | Uploads. Pre-generates every image size `apps/site` uses (see `src/collections/Media.ts`) — no runtime image transforms needed. |
| Collection | `users` | Admin login (email/password) **and** the API-key account `apps/site` authenticates as. |
| Global | `site-settings` | Nav, footer, social links, breaking-news banner, default SEO. |

## Environment

Copy `.env.example` to `.env` and fill in:

- **`DATABASE_URI`** — any Postgres connection string (Neon, Supabase, Railway, Vercel Postgres, self-hosted all work).
- **`PAYLOAD_SECRET`** — `openssl rand -hex 32`.
- **`PAYLOAD_PUBLIC_SERVER_URL`** — this app's own public URL, so it can build absolute media URLs for `apps/site` (a different origin) to hotlink.
- **`S3_*`** — object storage for uploads. Cloudflare R2, AWS S3, or any S3-compatible provider. Leave `S3_BUCKET` empty for local-disk storage in dev only — most serverless hosts have an ephemeral filesystem, so this must be set before deploying anywhere real.
- **`PAYLOAD_SERVICE_API_KEY`** — see "Connecting apps/site" below.
- **`REVALIDATE_URL`** / **`REVALIDATE_WEBHOOK_SECRET`** — see "Cache purging" below.

## Local development

```sh
npm install
cp .env.example .env   # fill in DATABASE_URI at minimum
npm run dev             # http://localhost:3000/admin
```

The first time you open `/admin` with an empty database, Payload prompts you to create the first user — that account is exempt from the collection's own access control (see `src/collections/Users.ts`), so this always works on a fresh database.

### Seeding demo content

```sh
npm run seed
```

Ports the same demo articles/authors/sections the old mock data (`content.ts`) and Sanity migration script used, idempotently — safe to re-run.

### Generating TypeScript types

```sh
npm run generate:types
```

Writes `src/payload-types.ts` (gitignored — regenerate after a schema change; nothing in this repo imports it, it's for editor DX only).

## Connecting apps/site

`apps/site` reads content over Payload's REST API using a service account rather than the public API — a public article-detail endpoint would let anyone fetch a "premium" article's full body directly from the CMS, bypassing the paywall (see the root `CLAUDE.md`).

1. Set `PAYLOAD_SERVICE_API_KEY` here to a generated secret (e.g. `openssl rand -hex 32`).
2. On next boot, `onInit` in `src/payload.config.ts` creates a `site@pulse.internal` user with that value as its API key (a no-op if it already exists).
3. Set the **same value** as `apps/site`'s `PAYLOAD_API_KEY` Worker secret (`wrangler secret put PAYLOAD_API_KEY --cwd apps/site`), and set `apps/site`'s `PAYLOAD_API_URL` var to this app's public URL.

To rotate the key: change `PAYLOAD_SERVICE_API_KEY` here, open the `site@pulse.internal` user in `/admin` → Users, and re-save its API Key field to the new value (the `onInit` bootstrap only runs once, when the account doesn't exist yet) — then update `apps/site`'s secret to match.

## Cache purging

An `afterChange`/`afterDelete` hook on every content collection (and the `site-settings` global) POSTs a signed payload to `apps/site`'s `/api/revalidate`, which purges exactly the Workers Cache tags that document affects — see the root `docs/cache-revalidation.md`. Set `REVALIDATE_URL` to that endpoint and `REVALIDATE_WEBHOOK_SECRET` to the same value as `apps/site`'s `PAYLOAD_WEBHOOK_SECRET` Worker secret.

## Deploying

This is a standard Next.js app — deploy it anywhere Next.js runs (Vercel is the path of least resistance). It is **not** part of the Cloudflare Workers pair described in the root `CLAUDE.md` (`apps/site`/`apps/edge`) — it's a separate deploy target, same as the old Sanity Studio was.

```sh
npm run build
npm run start   # or let your host run this for you
```

Before the first deploy against a fresh database, create an initial migration once you have a real `DATABASE_URI` to diff against:

```sh
npm run migrate:create
npm run migrate   # applied automatically by most hosts' build step; run by hand otherwise
```
