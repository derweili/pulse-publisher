import { articleTag, HOME_TAG, liveTag } from "./tags";

/**
 * Shape of the payload packages/emdash-revalidate-plugin POSTs after a
 * content lifecycle event in pulse-cms. Unlike the old Sanity webhook (which
 * carried a GROQ-projected sectionSlug/authorSlugs/tags alongside the
 * changed document), this plugin only has cheap access to the fields on the
 * event itself — see that package's README-style comment for why. That
 * trades some purge precision for a payload we can actually compute
 * reliably: an article edit purges the article's own page plus the
 * homepage, and section/author/tag listing pages catch up on their own
 * short TTL (see middleware.ts) rather than being purged immediately.
 */
export interface RevalidationPayload {
  collection: string;
  event?: string;
  id?: string;
  slug?: string | null;
  /** Only set for `live_blog_entries` — the parent live blog's slug, when the plugin could resolve it. */
  parentSlug?: string | null;
}

export type RevalidationPlan = { purgeEverything: true } | { purgeEverything: false; tags: string[] };

function dedupe(tags: string[]): string[] {
  return [...new Set(tags)];
}

/**
 * Maps a changed pulse-cms content item to the `Cache-Tag`s it affects,
 * using the exact same tag strings `middleware.ts` assigns via `./tags`.
 * Falls back to `purgeEverything` whenever a collection's blast radius isn't
 * expressible as a small tag set (e.g. `sections`, `authors`, `site_extras`,
 * which render into the nav/footer of every page) or the collection is one
 * this endpoint doesn't recognize — over-purging is cheap (a cache refill),
 * under-purging leaves stale content live, so unknown always fails toward
 * the wider purge.
 */
export function resolveRevalidationTags(payload: RevalidationPayload): RevalidationPlan {
  switch (payload.collection) {
    case "articles": {
      if (!payload.slug) return { purgeEverything: false, tags: [HOME_TAG] };
      return { purgeEverything: false, tags: dedupe([articleTag(payload.slug), HOME_TAG]) };
    }
    case "live_blogs": {
      if (!payload.slug) return { purgeEverything: false, tags: [HOME_TAG] };
      return { purgeEverything: false, tags: dedupe([liveTag(payload.slug), HOME_TAG]) };
    }
    case "live_blog_entries": {
      if (!payload.parentSlug) return { purgeEverything: true };
      return { purgeEverything: false, tags: dedupe([liveTag(payload.parentSlug), HOME_TAG]) };
    }
    default:
      // sections, authors, site_extras (nav, footer, breaking-news banner —
      // rendered by every page's Layout) and any collection this switch
      // doesn't know about yet.
      return { purgeEverything: true };
  }
}
