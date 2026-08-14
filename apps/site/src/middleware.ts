import { defineMiddleware } from "astro:middleware";

// The single source of truth for what's cacheable on this Worker (see
// CLAUDE.md: "Cacheable routes are defined in apps/site/src/middleware.ts").
// Unmatched routes default-deny to `private, no-store` rather than being
// left alone: a response with no Cache-Control has undefined behavior under
// Workers Cache (it may get cached heuristically), so explicit no-store is
// what makes a route added later safe by default.

const NO_STORE = "private, no-store";
const LISTING_CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=86400";

type CachePolicy = {
  cacheControl: string;
  cacheable: boolean;
  tags?: string[];
};

/** First path segment after `prefix`, ignoring anything nested after it (e.g. pagination). */
function slugFromSegment(pathname: string, prefix: string): string {
  return pathname.slice(prefix.length).split("/")[0] ?? "";
}

function resolveCachePolicy(pathname: string): CachePolicy {
  if (pathname.startsWith("/api/")) {
    return { cacheControl: NO_STORE, cacheable: false };
  }
  if (pathname === "/saved" || pathname === "/subscription") {
    return { cacheControl: NO_STORE, cacheable: false };
  }
  if (pathname === "/") {
    return { cacheControl: "public, max-age=30, stale-while-revalidate=3600", cacheable: true, tags: ["home"] };
  }
  if (pathname.startsWith("/articles/")) {
    const slug = slugFromSegment(pathname, "/articles/");
    return {
      cacheControl: "public, max-age=60, stale-while-revalidate=86400",
      cacheable: true,
      tags: [`article:${slug}`],
    };
  }
  if (pathname.startsWith("/live/")) {
    const slug = slugFromSegment(pathname, "/live/");
    // Live blogs are the highest-traffic, most time-sensitive thing this
    // publisher serves — a short window keeps "live" feeling live.
    return {
      cacheControl: "public, max-age=15, stale-while-revalidate=60",
      cacheable: true,
      tags: [`live:${slug}`],
    };
  }
  if (pathname.startsWith("/sections/")) {
    const slug = slugFromSegment(pathname, "/sections/");
    return { cacheControl: LISTING_CACHE_CONTROL, cacheable: true, tags: [`section:${slug}`] };
  }
  if (pathname.startsWith("/tags/")) {
    const slug = slugFromSegment(pathname, "/tags/");
    return { cacheControl: LISTING_CACHE_CONTROL, cacheable: true, tags: [`tag:${slug}`] };
  }
  if (pathname.startsWith("/authors/")) {
    const slug = slugFromSegment(pathname, "/authors/");
    return { cacheControl: LISTING_CACHE_CONTROL, cacheable: true, tags: [`author:${slug}`] };
  }
  if (
    pathname === "/search-index.json" ||
    pathname === "/rss.xml" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt"
  ) {
    return { cacheControl: "public, max-age=300, stale-while-revalidate=86400", cacheable: true, tags: ["feed"] };
  }
  if (pathname === "/about" || pathname === "/contact" || pathname === "/corrections" || pathname === "/standards") {
    return {
      cacheControl: "public, max-age=3600, stale-while-revalidate=86400",
      cacheable: true,
      tags: ["static"],
    };
  }

  return { cacheControl: NO_STORE, cacheable: false };
}

export const onRequest = defineMiddleware(async (context, next) => {
  const policy = resolveCachePolicy(context.url.pathname);
  const response = await next();

  if (policy.cacheable && response.headers.has("set-cookie")) {
    // A Set-Cookie response forces a cache bypass on a route we're about to
    // mark public — nothing in this app sets cookies today (see
    // check-auth-blindness.mjs), so this is a regression guard, not
    // expected behavior. A 500 for every reader is worse than the
    // regression it's catching, so: loud in dev, fail closed in prod.
    if (import.meta.env.DEV) {
      throw new Error(
        `Set-Cookie on cacheable route ${context.url.pathname} — this would fragment or bypass the shared Workers Cache. See CLAUDE.md.`
      );
    }
    console.error(`[cache] Set-Cookie on cacheable route ${context.url.pathname} — forcing private, no-store.`);
    response.headers.set("Cache-Control", NO_STORE);
    response.headers.delete("Cache-Tag");
    return response;
  }

  response.headers.set("Cache-Control", policy.cacheControl);

  if (!policy.cacheable) {
    response.headers.delete("Cache-Tag");
    return response;
  }

  // Merge path-derived tags with any tags the page itself set via
  // `Astro.response.headers` (e.g. articles/[slug].astro adds
  // section/author tags it only knows after fetching the article).
  // `Astro.response.headers` rather than `Astro.locals`: Astro streams by
  // default, so a locals mutation made during the page's render isn't
  // reliably visible by the time this `next()` call resolves, but
  // `Astro.response.headers` is Astro's documented, streaming-safe
  // mechanism for a page to set response headers.
  const pageTags = response.headers.get("Cache-Tag");
  const tags = [...(policy.tags ?? []), ...(pageTags ? pageTags.split(",") : [])];
  if (tags.length > 0) {
    response.headers.set("Cache-Tag", tags.join(","));
  } else {
    response.headers.delete("Cache-Tag");
  }

  return response;
});
