# mOS selector contract

The `data-mos` contract between this repo and the mOS console configuration. Every selector below is a stable `data-` attribute on server-rendered HTML — never a class, never an id (see `CLAUDE.md`). Filled in during Session 2 of `docs/mos-integration-plan.md`.

| Selector | Wraps | mOS action |
|---|---|---|
| `[data-mos="article-body"]` | The whole article body region on `articles/[slug].astro` (in-article ads + preview + locked + paywall slot). | None directly — a container for the other body selectors below. |
| `[data-mos="article-preview"]` | The free portion of `article.body`, `article.freePreviewBlocks` blocks (default 3, editor-controlled, snapped forward past any list it would otherwise split). | None — always shown. |
| `[data-mos="article-locked"]` | The remainder of `article.body` after the preview cut. | **Remove** for anonymous readers over quota and for registered readers on premium articles. |
| `[data-mos="paywall-slot"]` | Empty `<div>` after `article-locked`. Renders nothing today. | **Set content** — the wall/offer markup, for the same audiences `article-locked` is removed for. **Must include its own ad unit in the injected creative**: `AdSlot slot="in-article-2"` is nested inside whichever of `article-preview`/`article-locked` the article's midpoint ad-split lands in, so for most articles it disappears along with the removed `article-locked` content. That's an intentional trade (see `[slug].astro` comments) — the wall creative is what restores an ad impression for readers who no longer see `in-article-2`. |
| `[data-mos="premium-banner"]` | The gold "PULSE+ Premium … Subscribe" banner shown when `article.premium`. | **Remove** for subscriber-plan readers — otherwise a paying subscriber sees a CTA to buy what they already have. |
| `data-mos-block="<index>"` | Every rendered portable-text block (paragraph, heading, blockquote, list item, image, video embed), on all of `article-body`'s sub-slices. Index is the block's position in the original, unsliced `article.body` array. | Escape hatch for any future block-level behaviour; no default action. |
| `[data-mos="article-card"]` + `data-premium="true"\|"false"` | The root element of every article card: all `ArticleCard.astro` variants (`hero`, `default`, `compact`, `list`, `feed`, `premium`), plus the card roots in `SavedArticles.tsx` and `ForYouRail.tsx`. | Informational/targeting hook, not a removal target — `data-premium` lets mOS-driven personalization (e.g. hiding premium teasers for ad-free/anonymous plans) target specific cards without a class/id selector. |
| `[data-mos="premium-badge"]` | The "Premium" badge span on every card variant that has one (`hero`, `default`, `compact`, `list`, `premium` — `feed` has no badge), and on the card badges in `SavedArticles.tsx`/`ForYouRail.tsx` (newly added in Session 2 — those two components previously rendered no premium indicator at all). | **Remove** for subscriber-plan readers, same rationale as `premium-banner`. |
| `[data-mos="related"]` | `RelatedRail.astro`'s root `<aside>` (article sidebar) and the "Keep reading" footer `<section>` on `articles/[slug].astro`. | Informational/targeting hook. A free reader's related rail is not filtered by `premium` today (see Session 6 in `mos-integration-plan.md`) — decide there whether that's upsell bait or a leak to close. |
| `[data-mos="newsletter"]` | `Newsletter.astro`'s root `<section>`, alongside the existing `data-newsletter` attribute used by its own inline script. | None by default; available for plan-based hide/show. |
| `[data-mos="auth-actions"]` | Wraps the header's sign-in and signed-in (`Saved` link + `UserButton`) regions in `Header.astro`. Uses `class="contents"` so it doesn't affect the parent flex layout. | None by default; landing spot if mOS ever needs to inject/replace auth CTAs. |
| `[data-mos-show="<condition>"]` | `MosShow.astro` — the origin-agnostic replacement for Clerk's `<Show>`. The origin renders every branch unconditionally (both are present in the byte-identical HTML), each wrapped in its own `[data-mos-show]` div with `class="contents"`. Used in `Header.astro` for `when="signed-out"` (wraps `SignInButton`), `when="signed-in"` (wraps the `Saved` link + `UserButton`), and `when="no-premium"` (wraps each CMS-driven `mainNav` pill CTA, e.g. "Subscribe"). `when="premium-only"` is supported but not yet wired up anywhere. | **Remove** the branch that doesn't match the reader's actual state — `[data-mos-show="signed-out"]` removed for signed-in readers, `[data-mos-show="signed-in"]` removed for anonymous/signed-out readers, `[data-mos-show="premium-only"]` removed for readers without a premium/subscriber plan, `[data-mos-show="no-premium"]` removed for readers with a premium/subscriber plan (so an existing subscriber doesn't see a CTA to buy what they already have). |
| `[data-mos="comments"]` | The `<section>` wrapping `<Comments />` on `articles/[slug].astro`. | **Remove** for anonymous readers. |
| `[data-mos="meter-strip"]` | Empty `<div>` in `Layout.astro`, directly below the header. Renders nothing today. | **Set content** — shows quota/plan state, for all readers. |
| `[data-mos="auth-state"]` | Hidden `<div>` in `Layout.astro`, next to `[data-mos="meter-strip"]`. See below — **this one is different in kind from every other row in this table.** | **Set content** — see below. |

Untouched, on purpose: `[data-ad-slot]` (`AdSlot.astro`) — already the right shape.

## `[data-mos="auth-state"]` — a runtime contract, not a cosmetic hook

Every other selector above is read by an editor or a designer's eye: removing or filling it changes what a reader sees. This one is read by client-side JavaScript (`apps/site/src/layouts/Layout.astro`'s inline reconciliation script, backed by `apps/site/src/lib/auth-reconcile.ts`) to detect and correct the SSO-redirect race described in Session 3.5 of `docs/mos-integration-plan.md`: a reader returns from an OAuth sign-in before Clerk's client script has written the `__session` cookie, so the mOS proxy resolves that first page view as anonymous even though the reader just signed in (and the mirror case on sign-out). Getting the value wrong doesn't just look wrong — it breaks or silently disables the fix.

Content values, exactly three, lowercase, hyphen not underscore, no surrounding whitespace, no HTML (the client trims whitespace but tolerates nothing else):

| Value | Meaning | Set by |
|---|---|---|
| `unproxied` | Origin default. No mOS behaviour ran — local dev, a direct origin request, or a missing/misconfigured behaviour. | The origin itself (`Layout.astro`). Never overwritten by mOS. |
| `anonymous` | The proxy ran and resolved the reader as anonymous. | The **Anonymous**-plan component behaviour. **Required** — see below. |
| `signed-in` | The proxy ran and resolved the reader as authenticated (any signed-in plan). | The **Registered**, **Subscriber**, and **Subscriber Ad-free**-plan component behaviours. |

**The anonymous-plan behaviour is not optional.** Without it, an anonymous reader's marker stays `unproxied`, the client-side reconciliation script treats that as "no proxy in front of this response" and skips entirely (by design — see `reconcile()`'s ordering in `auth-reconcile.ts`), and the SSO bug this contract exists to fix comes straight back on the very page view where it matters most: the first one after the OAuth redirect. It fails safe (no reload loop), but the fix is silently inert. This is why `docs/mos-integration-plan.md`'s Session 5 behaviour table lists all four plans, not just the three signed-in ones.

These strings are mirrored in `apps/site/src/lib/auth-reconcile.ts`'s `ServerAuthState` type. Nothing type-checks the link between this doc, the mOS console config, and that file — there's a comment at each end pointing back here; keep all three in sync by hand.

## `data-mos-action` — behaviour the app exposes *to* injected creative

Distinct from every `data-mos` selector above: those are elements mOS targets and manipulates from the outside. `data-mos-action` runs the other direction — it's how creative injected into `[data-mos="paywall-slot"]` (or any other mOS-controlled surface) asks the app to do something, without shipping any JavaScript of its own.

The creative is a plain link carrying the attribute, with its normal navigation `href` as a fallback:

```html
<a href="/sign-in" data-mos-action="sign-in">Sign in to keep reading</a>
<a href="/sign-up" data-mos-action="sign-up">Create a free account</a>
<a href="/sign-in" data-mos-action="sign-out">Sign out</a>
```

A single document-level click listener in `apps/site/src/layouts/Layout.astro` (backed by the pure `resolveAction`/`dispatchMosAction` in `apps/site/src/lib/mos-actions.ts`) intercepts clicks on `[data-mos-action]` elements and opens the matching Clerk modal instead of letting the link navigate. If the action value is unrecognized, or Clerk hasn't loaded yet, the listener does nothing and the `href` navigation proceeds — same markup either way, no separate no-JS configuration path.

| Value | Effect | `href` fallback |
|---|---|---|
| `sign-in` | Opens Clerk's sign-in modal (`clerk.openSignIn()`). | `/sign-in` |
| `sign-up` | Opens Clerk's sign-up modal (`clerk.openSignUp()`). | `/sign-up` |
| `sign-out` | Signs the reader out (`clerk.signOut()`). | `/sign-in` (or wherever a signed-out reader should land) |

These three strings are a runtime contract mirrored in mOS console creative — nothing type-checks that link, same caveat as the `auth-state` values above. The values are whitelisted in `mos-actions.ts`; an unrecognized `data-mos-action` can never dispatch an arbitrary Clerk method, and nothing on `window` is exposed for creative to call directly.

## Meta tag contract (page-level targeting)

Unlike the `data-mos` selectors above (removal/injection targets for `HTMLRewriter`), these are read-only signals in `<head>` that the mOS Decision API call reads to pick a plan/surface decision *before* any rewriting happens. Set once in `Layout.astro` via typed `Props`, populated per-page. Comma-separated values follow the same convention as the `Cache-Tag` header in `articles/[slug].astro`.

| Meta tag | Values | Set on |
|---|---|---|
| `<meta name="mos-page-type">` | `homepage` \| `category` \| `author` \| `article` | `index.astro`, `sections/[section]/[...page].astro`, `authors/[author].astro`, `articles/[slug].astro`. Omitted on pages mOS doesn't target (static pages, tag listings, live blogs). |
| `<meta name="mos-article-type">` | `standard` \| `premium` | `articles/[slug].astro` only, from `article.premium`. |
| `<meta name="mos-categories">` | comma-separated section slug(s) | `sections/[section]/[...page].astro` (the section itself), `articles/[slug].astro` (the article's section). |
| `<meta name="mos-tags">` | comma-separated `article.tags` | `articles/[slug].astro` only. Omitted when the article has no tags. |
| `<meta name="mos-authors">` | comma-separated author slug(s) | `authors/[author].astro` (the author themself), `articles/[slug].astro` (the article's authors). |

## Constraints (see `CLAUDE.md`)

- Never `:last-child`/`:nth-*` in a selector meant for mOS — `HTMLRewriter` silently skips rules using them.
- Never a Tailwind/utility class or an `id` as an mOS selector.
