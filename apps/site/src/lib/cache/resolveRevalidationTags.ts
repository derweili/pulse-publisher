import { articleTag, authorTag, HOME_TAG, liveTag, sectionTag, tagTag } from "./tags";

/**
 * Shape of the apps/cms webhook payload (see
 * apps/cms/src/hooks/revalidate.ts and docs/cache-revalidation.md). Fields
 * absent for a given `type` simply come through as null/undefined — one
 * shape covers every collection/global that triggers this webhook.
 */
export interface RevalidationPayload {
  type: string;
  slug?: string | null;
  sectionSlug?: string | null;
  authorSlugs?: (string | null)[] | null;
  tags?: (string | null)[] | null;
}

export type RevalidationPlan = { purgeEverything: true } | { purgeEverything: false; tags: string[] };

function dedupe(tags: string[]): string[] {
  return [...new Set(tags)];
}

/**
 * Maps a changed document to the `Cache-Tag`s it affects, using the exact
 * same tag strings `middleware.ts` assigns via `./tags`. Falls back to
 * `purgeEverything` whenever a document's blast radius isn't expressible as
 * a small tag set (e.g. `siteSettings`, which renders into the nav/footer of
 * every page) or the document type is one this endpoint doesn't recognize —
 * over-purging is cheap (a cache refill), under-purging leaves stale content
 * live, so unknown always fails toward the wider purge.
 */
export function resolveRevalidationTags(payload: RevalidationPayload): RevalidationPlan {
  switch (payload.type) {
    case "article": {
      if (!payload.slug) return { purgeEverything: false, tags: [HOME_TAG] };
      const tags = [articleTag(payload.slug), HOME_TAG];
      if (payload.sectionSlug) tags.push(sectionTag(payload.sectionSlug));
      for (const authorSlug of payload.authorSlugs ?? []) {
        if (authorSlug) tags.push(authorTag(authorSlug));
      }
      for (const tag of payload.tags ?? []) {
        if (tag) tags.push(tagTag(tag));
      }
      return { purgeEverything: false, tags: dedupe(tags) };
    }
    case "liveBlog": {
      if (!payload.slug) return { purgeEverything: false, tags: [HOME_TAG] };
      const tags = [liveTag(payload.slug), HOME_TAG];
      if (payload.sectionSlug) tags.push(sectionTag(payload.sectionSlug));
      return { purgeEverything: false, tags: dedupe(tags) };
    }
    case "section": {
      if (!payload.slug) return { purgeEverything: true };
      // A section's own page plus the homepage, which lists articles by section.
      return { purgeEverything: false, tags: dedupe([sectionTag(payload.slug), HOME_TAG]) };
    }
    case "author": {
      if (!payload.slug) return { purgeEverything: true };
      return { purgeEverything: false, tags: [authorTag(payload.slug)] };
    }
    default:
      // siteSettings (nav, footer, breaking-news banner — rendered by every
      // page's Layout) and any type this switch doesn't know about yet.
      return { purgeEverything: true };
  }
}
