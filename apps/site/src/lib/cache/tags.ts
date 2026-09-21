// Single source of truth for the `Cache-Tag` strings this app assigns.
// `middleware.ts` (tagging responses) and `resolveRevalidationTags.ts`
// (purging on the apps/cms webhook) must produce byte-identical tags for the
// same document, or a purge silently misses the page it was meant to clear.

export const HOME_TAG = "home";
export const FEED_TAG = "feed";
export const STATIC_TAG = "static";

export const articleTag = (slug: string): string => `article:${slug}`;
export const sectionTag = (slug: string): string => `section:${slug}`;
export const authorTag = (slug: string): string => `author:${slug}`;
export const tagTag = (tag: string): string => `tag:${tag}`;
export const liveTag = (slug: string): string => `live:${slug}`;
