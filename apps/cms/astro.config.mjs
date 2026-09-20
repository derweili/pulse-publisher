import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { d1, r2 } from "@emdash-cms/cloudflare";
import { revalidateWebhookPlugin } from "@pulse/emdash-revalidate-plugin";

// pulse-cms — the editor-facing content management system for PULSE.
//
// This is a plain, single-app EmDash site (admin + database-backed content +
// media all in one Astro app, per EmDash's normal architecture) — NOT part
// of the mOS reader pipeline described in the repo root CLAUDE.md. It is the
// direct replacement for the old studio/ (Sanity Studio) deploy: a separate,
// publicly reachable deploy target that editors sign in to, unrelated to the
// pulse-edge / pulse-today proxy split.
//
// apps/site ("pulse-today") does NOT embed EmDash — CLAUDE.md requires it to
// stay unreachable and auth-blind, which rules out mounting EmDash's admin
// (and its own passkey auth) inside that app. Instead apps/site reads
// PUBLISHED content from this app over EmDash's documented REST API
// (https://docs.emdashcms.com/reference/rest-api/) using a read-only bearer
// token — the same relationship apps/site used to have with Sanity's hosted
// API. See docs/emdash-migration-plan.md for the full rationale.
//
// `d1`/`r2` come from `@emdash-cms/cloudflare`, not `emdash/db` or
// `emdash/astro` — confirmed against the published packages: emdash's own
// `db`/`astro` exports only cover sqlite/libsql/postgres and local/s3
// storage; the Cloudflare-specific adapters live in the separate
// `@emdash-cms/cloudflare` package. That package pins an exact `emdash`
// version as its own dependency (0.38.0 as of writing, one minor behind
// emdash's own latest 1.0.0), so this app's `emdash`/`@emdash-cms/cloudflare`
// versions in package.json are pinned to match rather than left on `^` —
// mismatched versions between the two risk incompatible internal types.
export default defineConfig({
  output: "server",
  adapter: cloudflare({
    imageService: "cloudflare-binding",
  }),
  integrations: [
    react(),
    emdash({
      database: d1({ binding: "DB" }),
      storage: r2({
        binding: "MEDIA",
        // Set to a public bucket/custom domain if one is configured — see
        // docs/emdash-migration-plan.md "Media" section. Left unset (private,
        // authenticated media route) by default.
      }),
      // `url`/`secret` are read from process.env at build time, not from a
      // Worker runtime secret — see packages/emdash-revalidate-plugin's own
      // comment for why (EmDash plugins have no `ctx.env`).
      plugins: [
        revalidateWebhookPlugin({
          url: process.env.SITE_REVALIDATE_URL,
          secret: process.env.REVALIDATE_SECRET,
        }),
      ],
      // The site MCP server is only useful for AI-assisted editing of this
      // CMS's own content — leave it on unless you have a reason not to.
      mcp: true,
    }),
  ],
});
