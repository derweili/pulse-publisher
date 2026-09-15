# Local development

How to run `apps/site` (pulse-today) and `apps/edge` (pulse-edge) locally, alone or together. See `CLAUDE.md` for the architecture these two Workers implement and why they're split; this doc is only about running them on your machine.

## Prerequisites

- **Node 22** — `wrangler` and `@monetizationos/proxy` both require it (`engines.node: ">=22"`). `.nvmrc` pins `22`; run `nvm use` (or `nvm use 22`) before any command below if your shell defaults to something older.
- `npm install` from the repo root (installs all three workspaces: `apps/site`, `apps/edge`, `studio`).
- `apps/site/.dev.vars` — copy from `apps/site/.dev.vars.example`, fill in `SANITY_API_READ_TOKEN`.
- `apps/edge/.dev.vars` — copy from `apps/edge/.dev.vars.example`, set `MOS_SECRET_KEY` to *anything* non-empty (e.g. `sk_test_placeholder`) for local testing. `@monetizationos/proxy` fails open when the mOS API call fails — a placeholder key is enough to exercise the whole pass-through pipeline; you only need a real key to see actual surface decisions (Session 5 of `docs/mos-integration-plan.md`).

## Three ways to run this

| Command | What it runs | Use it for |
|---|---|---|
| `npm run dev` | `astro dev` (Vite) for `apps/site` only | UI/content work on the site, nothing edge-related. Full HMR, instant. |
| `npm run dev:full` | `astro dev` for the site + `wrangler dev` for the edge Worker, talking over plain HTTP | Iterating on `apps/edge` (router, anonymize, mOS wiring) while still getting the site's fast HMR loop. |
| `npm run preview:full` | Real `wrangler dev` for **both** — the actual Workers runtime, real `SITE` service binding | Verifying the real proxy behavior before a deploy: service bindings, `Astro.locals.runtime.*`, anything that only exists in the real Workers runtime. Slower — no HMR, rebuild the site manually after changes. |

All three are run from the repo root.

## Local URLs at a glance

| Mode | Site | Edge | Studio |
|---|---|---|---|
| `npm run dev` | `http://localhost:4321` (astro dev) | — | — |
| `npm run dev:full` | `http://localhost:4321` (astro dev) | `http://localhost:8787` (wrangler dev, default port) | — |
| `npm run preview:full` | `http://localhost:8788` (wrangler dev, `--port 8788`) | `http://localhost:8787` (wrangler dev, `--port 8787`) | — |
| `npm run studio:dev` | — | — | `http://localhost:3333` |

In every mode, **the edge Worker's URL is the one to hit as a reader**, and it's always `http://localhost:8787` — it's the proxy, so it's what actually exercises the router/anonymize/mOS pipeline. Hitting the site's URL directly bypasses all of that; useful for isolating "is this a site bug or an edge bug," not for a realistic request.

`preview:full` also opens debugger/inspector ports `9229` (site) and `9230` (edge) — irrelevant unless you're attaching DevTools/a debugger, but it's *why* the two processes need distinct `--inspector-port`s (see gotchas below).

## Why there are two edge-inclusive modes

`apps/edge`'s `SITE` binding in `wrangler.toml` is a Cloudflare **service binding** — one Worker calling another directly, without going over HTTP. It only resolves locally when the target is *also* running via `wrangler dev`: that command registers itself in wrangler's local multi-worker registry, and `wrangler dev` for another Worker can then discover it by service name (`pulse-today`). Plain `astro dev` is a Vite/Node dev server — it never enters that registry, so if `apps/site` is running via `astro dev`, `apps/edge`'s `wrangler dev` will report `env.SITE ... [not connected]` and any request that needs it will fail.

`dev:full` works around this without sacrificing the site's HMR loop: `apps/edge/src/siteFetch.ts` is the single place both `router.ts` and `index.ts` go through to reach the site, and it checks `env.SITE_DEV_ORIGIN` first — if set, it rewrites the request's URL to that origin and makes a plain `fetch()` instead of using the service binding. `dev:full` sets it via `wrangler dev --var SITE_DEV_ORIGIN:http://localhost:4321` (astro dev's default port), scoped to just that invocation.

**`SITE_DEV_ORIGIN` is never set in a file** — not `.dev.vars`, not `wrangler.toml`. If it were, it'd be easy to forget it's set and have `preview:full` silently skip testing the real service-binding path. It only ever comes from the `--var` flag on the `dev:full` script itself.

## `preview:full` gotchas

This runs two independent `wrangler dev` processes, which surfaces two things worth knowing:

- **Inspector port collision.** Every `wrangler dev` instance defaults to debugger/inspector port `9229`. Two at once collide, and the second one crashes with `Address already in use (127.0.0.1:9229)`. `preview:full` already gives each process its own `--port`/`--inspector-port` (edge: `8787`/`9229`, site: `8788`/`9230`) — if you're composing your own commands instead of using the script, set these explicitly.
- **Stray processes hold ports across runs.** If a previous run didn't shut down cleanly, a leftover `wrangler`/`workerd` process can keep holding `9229` (or `8787`/`8788`) even after you think you've stopped it. If you hit the error above with nothing obviously running, check `lsof -i :9229` and kill whatever's listed — a plain `Ctrl-C` doesn't always fully clean up `workerd` child processes; `pkill -9 -f workerd` is a blunter but reliable fallback.
- **`compatibility_date` vs. local `workerd`.** Cloudflare allows setting a `compatibility_date` slightly ahead of what the locally-installed `workerd` binary (wrangler's dependency, not a separate install) actually supports yet. If `wrangler dev` fails with `This Worker requires compatibility date "...", but the newest date supported by this server binary is "..."`, either `npm update wrangler` (pulls a newer `workerd` if one's been published) or add `--compatibility-date=<a-day-or-two-earlier>` to the command for that local run only — never commit that flag, it's purely a local-tooling lag, not a real config change.

## Doing it by hand (no scripts)

Useful when you want to run one side under a debugger, or don't want the other one at all.

**Site, real Workers runtime** (needed as a bind target for edge, or for `Astro.locals.runtime.*` beyond what `astro dev`'s `platformProxy` simulates). `wrangler dev` defaults to port `8787`, which is reserved for edge — give site a different port explicitly:

```sh
cd apps/site
npm run build
npx wrangler dev --port 8788   # or: npm run cf:preview, which does build + this in one step (but keeps the 8787 default — pass --port yourself if edge is also running)
```

**Site, fast loop:**

```sh
cd apps/site
npm run dev                 # astro dev, localhost:4321
```

**Edge, against a real local site** (site must already be running via `wrangler dev` on a non-default port, not `astro dev`) — see "Both at once" below for the fully explicit form:

```sh
cd apps/edge
npm run dev                 # wrangler dev, http://localhost:8787 by default
```

**Edge, against `astro dev`:**

```sh
cd apps/edge
npx wrangler dev --var SITE_DEV_ORIGIN:http://localhost:4321   # http://localhost:8787
```

**Both at once, ports explicit** (what `preview:full` does under the hood):

```sh
# terminal 1
cd apps/edge && npx wrangler dev --port 8787 --inspector-port 9229

# terminal 2
cd apps/site && npx wrangler dev --port 8788 --inspector-port 9230
```

## Testing and type-checking (no servers needed)

```sh
npm run test -w apps/edge      # router + anonymize + siteFetch unit tests
npm run check -w apps/edge     # tsc --noEmit
npm run check -w apps/site     # astro check
npm run build -w apps/site
npx wrangler deploy --dry-run  # from apps/edge, then again from apps/site — validates config without deploying
```

## What you can't verify locally

- `Cf-Cache-Status: HIT` on the Workers Cache between edge and site — that's Cloudflare's real edge network, not something Miniflare (the local simulator behind `wrangler dev`) reproduces.
- Real mOS surface decisions — a placeholder `MOS_SECRET_KEY` proves the pipeline fails open correctly (see Prerequisites above), but actual personalization needs a real mOS account and surface (Session 5).
- Anything gated on the real `pulse.today` Cloudflare zone existing (routes, DNS) — `wrangler deploy --dry-run` validates config shape but doesn't require the zone to exist; a real `wrangler deploy` would.
