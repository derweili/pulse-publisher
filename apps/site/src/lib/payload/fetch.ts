import { payloadFetch, type PayloadEnv, type PayloadListResponse } from "./client";
import type { Article, Author, LiveBlog, Section, SiteSettings } from "./types";

/**
 * Every article-listing consumer (ArticleCard, RelatedRail, grids, rails)
 * uses this — `body` is deliberately excluded (see `listArticles` below).
 */
export type ArticleCardData = Omit<Article, "body">;
export type ArticleDetail = Article;
export type SectionData = Section;
export type AuthorData = Author;
export type SiteSettingsData = SiteSettings;

// depth=2 resolves both the article's own relationships (section, hero,
// authors) and one level past those (each author's avatar, seo.ogImage) —
// see lib/payload/types.ts. Listing endpoints over-fetch a little compared
// to the old hand-projected GROQ queries (Payload has no per-field
// projection alongside relationship population); acceptable at this scale.
const DETAIL_DEPTH = "2";
const LIST_DEPTH = "1";

function params(entries: Record<string, string | number | undefined>): URLSearchParams {
  const p = new URLSearchParams();
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined) continue;
    p.set(key, String(value));
  }
  return p;
}

async function findOne<T>(
  env: PayloadEnv,
  collection: string,
  where: Record<string, string>,
  depth: string
): Promise<T | null> {
  const p = params({ limit: 1, depth });
  for (const [field, value] of Object.entries(where)) {
    p.set(`where[${field}][equals]`, value);
  }
  const res = await payloadFetch<PayloadListResponse<T>>(env, `/api/${collection}`, p);
  return res.docs[0] ?? null;
}

// --- Sections ----------------------------------------------------------

export const getSections = async (env: PayloadEnv): Promise<Section[]> => {
  const res = await payloadFetch<PayloadListResponse<Section>>(
    env,
    "/api/sections",
    params({ sort: "order", limit: 200, depth: LIST_DEPTH })
  );
  return res.docs;
};

export const getSectionBySlug = (env: PayloadEnv, slug: string): Promise<Section | null> =>
  findOne<Section>(env, "sections", { slug }, LIST_DEPTH);

// --- Authors -------------------------------------------------------------

export const getAuthors = async (env: PayloadEnv): Promise<Author[]> => {
  const res = await payloadFetch<PayloadListResponse<Author>>(
    env,
    "/api/authors",
    params({ sort: "name", limit: 500, depth: LIST_DEPTH })
  );
  return res.docs;
};

export const getAuthorBySlug = (env: PayloadEnv, slug: string): Promise<Author | null> =>
  findOne<Author>(env, "authors", { slug }, LIST_DEPTH);

// --- Articles --------------------------------------------------------------

export const getArticleBySlug = (env: PayloadEnv, slug: string): Promise<Article | null> =>
  findOne<Article>(env, "articles", { slug }, DETAIL_DEPTH);

// Every article *listing* (cards, rails, grids, and — critically — the
// /api/for-you.json and /api/saved-articles.json endpoints) excludes `body`
// via Payload's select API: no route under /api/ may ever return article
// body content (see CLAUDE.md — full premium bodies leaking through a list
// endpoint would bypass the paywall same as apps/site itself becoming
// publicly reachable would). Only `getArticleBySlug` below fetches `body`.
async function listArticles(env: PayloadEnv, p: URLSearchParams): Promise<ArticleCardData[]> {
  p.set("select[body]", "false");
  const res = await payloadFetch<PayloadListResponse<ArticleCardData>>(env, "/api/articles", p);
  return res.docs;
}

export const getAllArticles = (env: PayloadEnv): Promise<ArticleCardData[]> =>
  listArticles(env, params({ sort: "-publishedAt", limit: 0, depth: DETAIL_DEPTH }));

export const getArticlesInSection = (env: PayloadEnv, sectionSlug: string): Promise<ArticleCardData[]> =>
  listArticles(
    env,
    (() => {
      const p = params({ sort: "-publishedAt", limit: 0, depth: DETAIL_DEPTH });
      p.set("where[section.slug][equals]", sectionSlug);
      return p;
    })()
  );

export const getArticlesByAuthor = (env: PayloadEnv, authorSlug: string): Promise<ArticleCardData[]> =>
  listArticles(
    env,
    (() => {
      const p = params({ sort: "-publishedAt", limit: 0, depth: DETAIL_DEPTH });
      p.set("where[authors.slug][equals]", authorSlug);
      return p;
    })()
  );

export const getPremiumArticles = (env: PayloadEnv): Promise<ArticleCardData[]> =>
  listArticles(
    env,
    (() => {
      const p = params({ sort: "-publishedAt", limit: 0, depth: DETAIL_DEPTH });
      p.set("where[premium][equals]", "true");
      return p;
    })()
  );

export const getFeaturedArticles = (env: PayloadEnv): Promise<ArticleCardData[]> =>
  listArticles(
    env,
    (() => {
      const p = params({ sort: "-publishedAt", limit: 0, depth: DETAIL_DEPTH });
      p.set("where[featured][equals]", "true");
      return p;
    })()
  );

export const getTrendingArticles = (env: PayloadEnv): Promise<ArticleCardData[]> =>
  listArticles(
    env,
    (() => {
      const p = params({ sort: "trendingRank", limit: 8, depth: DETAIL_DEPTH });
      p.set("where[trendingRank][exists]", "true");
      return p;
    })()
  );

export const getArticlesByTag = (env: PayloadEnv, tag: string): Promise<ArticleCardData[]> =>
  listArticles(
    env,
    (() => {
      const p = params({ sort: "-publishedAt", limit: 0, depth: DETAIL_DEPTH });
      p.set("where[tags][in]", tag);
      return p;
    })()
  );

export const getArticlesBySlugs = (env: PayloadEnv, slugs: string[]): Promise<ArticleCardData[]> => {
  if (slugs.length === 0) return Promise.resolve([]);
  const p = params({ sort: "-publishedAt", limit: 0, depth: DETAIL_DEPTH });
  p.set("where[slug][in]", slugs.join(","));
  return listArticles(env, p);
};

/**
 * Powers the client-side "For You" rail: candidate pool for a reader whose
 * localStorage reading history leans toward certain sections/tags (see
 * ForYouRail.tsx). No server-side personalization/tracking — plain content
 * query, filtered client-side of the request by what the browser knows.
 */
export const getForYouArticles = (env: PayloadEnv, sections: string[], tags: string[]): Promise<ArticleCardData[]> => {
  const p = params({ sort: "-publishedAt", limit: 8, depth: DETAIL_DEPTH });
  let i = 0;
  if (sections.length > 0) {
    p.set(`where[or][${i}][section.slug][in]`, sections.join(","));
    i += 1;
  }
  if (tags.length > 0) {
    p.set(`where[or][${i}][tags][in]`, tags.join(","));
    i += 1;
  }
  if (i === 0) return Promise.resolve([]);
  return listArticles(env, p);
};

/**
 * Same-section articles first, then articles from other sections that share
 * at least one tag — two requests concatenated client-side rather than one
 * query with custom ordering, since Payload's `sort` only sorts by real
 * fields, not a computed "is this the same section" boolean. Mirrors the
 * pre-CMS mock data's `relatedArticles()` concatenation semantics exactly.
 */
export const getRelatedArticles = async (
  env: PayloadEnv,
  article: Pick<ArticleDetail, "slug" | "section" | "tags">,
  limit = 4
): Promise<ArticleCardData[]> => {
  const sameSectionParams = params({ sort: "-publishedAt", limit, depth: DETAIL_DEPTH });
  sameSectionParams.set("where[section.slug][equals]", article.section.slug);
  sameSectionParams.set("where[slug][not_equals]", article.slug);
  const sameSection = await listArticles(env, sameSectionParams);

  const remaining = limit - sameSection.length;
  const tags = article.tags ?? [];
  if (remaining <= 0 || tags.length === 0) return sameSection.slice(0, limit);

  const sharedTagParams = params({ sort: "-publishedAt", limit: remaining, depth: DETAIL_DEPTH });
  sharedTagParams.set("where[tags][in]", tags.join(","));
  sharedTagParams.set("where[section.slug][not_equals]", article.section.slug);
  sharedTagParams.set("where[slug][not_equals]", article.slug);
  const sharedTag = await listArticles(env, sharedTagParams);

  return [...sameSection, ...sharedTag].slice(0, limit);
};

// --- Live blogs ------------------------------------------------------------

function sortEntriesDesc(liveBlog: LiveBlog): LiveBlog {
  if (!liveBlog.entries) return liveBlog;
  return {
    ...liveBlog,
    entries: [...liveBlog.entries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
  };
}

export const getLiveBlogBySlug = async (env: PayloadEnv, slug: string): Promise<LiveBlog | null> => {
  const doc = await findOne<LiveBlog>(env, "live-blogs", { slug }, DETAIL_DEPTH);
  return doc ? sortEntriesDesc(doc) : null;
};

export const getActiveLiveBlogs = async (env: PayloadEnv): Promise<LiveBlog[]> => {
  const p = params({ sort: "-startedAt", limit: 50, depth: LIST_DEPTH });
  p.set("where[liveStatus][equals]", "live");
  const res = await payloadFetch<PayloadListResponse<LiveBlog>>(env, "/api/live-blogs", p);
  return res.docs;
};

/** Lightweight-ish — used for the sitemap and search index, which need every live blog regardless of status. */
export const getAllLiveBlogs = async (env: PayloadEnv): Promise<LiveBlog[]> => {
  const res = await payloadFetch<PayloadListResponse<LiveBlog>>(
    env,
    "/api/live-blogs",
    params({ sort: "-startedAt", limit: 0, depth: LIST_DEPTH })
  );
  return res.docs;
};

// --- Site settings -----------------------------------------------------

export async function getSiteSettings(env: PayloadEnv): Promise<SiteSettings> {
  const settings = await payloadFetch<SiteSettings | null>(
    env,
    "/api/globals/site-settings",
    params({ depth: DETAIL_DEPTH })
  );
  if (!settings || !settings.defaultSeo) {
    throw new Error('Site settings not found or incomplete. Run "npm run seed" from apps/cms to seed it.');
  }
  return settings;
}
