import type { SanityClient } from "@sanity/client";
import {
  activeLiveBlogsQuery,
  allArticlesQuery,
  allLiveBlogsQuery,
  articleBySlugQuery,
  articleSlugsQuery,
  articlesByAuthorQuery,
  articlesBySlugsQuery,
  articlesByTagQuery,
  articlesInSectionQuery,
  authorBySlugQuery,
  authorsQuery,
  featuredArticlesQuery,
  forYouArticlesQuery,
  liveBlogBySlugQuery,
  premiumArticlesQuery,
  relatedArticlesQuery,
  sectionBySlugQuery,
  sectionsQuery,
  siteSettingsQuery,
  trendingArticlesQuery,
} from "./queries";
import type {
  ActiveLiveBlogsQueryResult,
  AllArticlesQueryResult,
  AllLiveBlogsQueryResult,
  ArticleBySlugQueryResult,
  ArticleSlugsQueryResult,
  ArticlesByAuthorQueryResult,
  ArticlesBySlugsQueryResult,
  ArticlesByTagQueryResult,
  ArticlesInSectionQueryResult,
  AuthorBySlugQueryResult,
  AuthorsQueryResult,
  FeaturedArticlesQueryResult,
  ForYouArticlesQueryResult,
  LiveBlogBySlugQueryResult,
  PremiumArticlesQueryResult,
  RelatedArticlesQueryResult,
  SectionBySlugQueryResult,
  SectionsQueryResult,
  SiteSettingsQueryResult,
  TrendingArticlesQueryResult,
} from "./sanity.types";

/** The shape shared by every article-listing query (`ArticleCard`, `RelatedRail`, grids). */
export type ArticleCardData = ArticlesInSectionQueryResult[number];
export type ArticleDetail = NonNullable<ArticleBySlugQueryResult>;
export type SectionData = NonNullable<SectionBySlugQueryResult>;
export type AuthorData = NonNullable<AuthorBySlugQueryResult>;
// `breakingNews` is intersected in rather than added to the generated
// `SiteSettingsQueryResult` union directly: that union has one branch per
// historical combination of optional fields (as produced by `sanity
// typegen` against a live dataset), and hand-editing every branch for a
// field typegen hasn't seen yet is impractical. Re-running
// `npm run studio:typegen` will fold this into the union properly.
export type SiteSettingsData = Extract<SiteSettingsQueryResult, { defaultSeo: object }> & {
  breakingNews: { active: boolean | null; headline: string | null; href: string | null } | null;
};

// Every helper below takes the request's Sanity client explicitly (see
// `getSanityClient` in `./client.ts`) rather than importing a singleton,
// since the site renders via SSR and each request gets its own client built
// from the Worker's runtime env. Each has an explicit return type because
// `sanityClient.fetch`'s result type is inferred from the exact query-string
// literal via the generated `SanityQueries` map (see sanity.types.ts) — that
// inference chain doesn't reliably survive being combined inside
// `Promise.all([...])` call sites, so we pin it down here once instead of at
// every call site.

export const getSections = (client: SanityClient): Promise<SectionsQueryResult> =>
  client.fetch(sectionsQuery);

export const getSectionBySlug = (
  client: SanityClient,
  slug: string
): Promise<SectionBySlugQueryResult> => client.fetch(sectionBySlugQuery, { slug });

export const getAuthors = (client: SanityClient): Promise<AuthorsQueryResult> =>
  client.fetch(authorsQuery);

export const getAuthorBySlug = (
  client: SanityClient,
  slug: string
): Promise<AuthorBySlugQueryResult> => client.fetch(authorBySlugQuery, { slug });

export const getArticleSlugs = (client: SanityClient): Promise<ArticleSlugsQueryResult> =>
  client.fetch(articleSlugsQuery);

export const getArticleBySlug = (
  client: SanityClient,
  slug: string
): Promise<ArticleBySlugQueryResult> => client.fetch(articleBySlugQuery, { slug });

export const getAllArticles = (client: SanityClient): Promise<AllArticlesQueryResult> =>
  client.fetch(allArticlesQuery);

export const getArticlesInSection = (
  client: SanityClient,
  sectionSlug: string
): Promise<ArticlesInSectionQueryResult> =>
  client.fetch(articlesInSectionQuery, { sectionSlug });

export const getArticlesByAuthor = (
  client: SanityClient,
  authorSlug: string
): Promise<ArticlesByAuthorQueryResult> =>
  client.fetch(articlesByAuthorQuery, { authorSlug });

// `client.fetch`'s overloads resolve params/result types by looking up the
// exact query string in the generated `SanityQueries` map; that lookup
// (and the constraint-checking around it) only works cleanly for queries
// typegen itself produced. Queries added by hand below interpolate
// `${cardProjection}` — a non-literal interpolation — which the generated
// map can't key on, so the overloads can't be satisfied without fighting
// unrelated type machinery. This helper casts `fetch` to the shape we
// actually need; re-running `npm run studio:typegen` against a live
// dataset would let these resolve normally, with the same result either way.
function fetchUntyped<T>(
  client: SanityClient,
  query: string,
  params: Record<string, unknown>
): Promise<T> {
  // Call as `client.fetch(...)` directly rather than detaching the method
  // into a variable first — @sanity/client's implementation relies on
  // `this` internally, and a detached reference loses that binding.
  return client.fetch(query, params as never) as unknown as Promise<T>;
}

export const getArticlesByTag = (
  client: SanityClient,
  tag: string
): Promise<ArticlesByTagQueryResult> =>
  fetchUntyped<ArticlesByTagQueryResult>(client, articlesByTagQuery, { tag });

export const getForYouArticles = (
  client: SanityClient,
  sections: string[],
  tags: string[]
): Promise<ForYouArticlesQueryResult> =>
  fetchUntyped<ForYouArticlesQueryResult>(client, forYouArticlesQuery, { sections, tags });

export const getArticlesBySlugs = (
  client: SanityClient,
  slugs: string[]
): Promise<ArticlesBySlugsQueryResult> =>
  fetchUntyped<ArticlesBySlugsQueryResult>(client, articlesBySlugsQuery, { slugs });

export const getLiveBlogBySlug = (
  client: SanityClient,
  slug: string
): Promise<LiveBlogBySlugQueryResult> =>
  fetchUntyped<LiveBlogBySlugQueryResult>(client, liveBlogBySlugQuery, { slug });

export const getActiveLiveBlogs = (client: SanityClient): Promise<ActiveLiveBlogsQueryResult> =>
  client.fetch(activeLiveBlogsQuery);

export const getAllLiveBlogs = (client: SanityClient): Promise<AllLiveBlogsQueryResult> =>
  client.fetch(allLiveBlogsQuery);

export const getPremiumArticles = (client: SanityClient): Promise<PremiumArticlesQueryResult> =>
  client.fetch(premiumArticlesQuery);

export const getFeaturedArticles = (client: SanityClient): Promise<FeaturedArticlesQueryResult> =>
  client.fetch(featuredArticlesQuery);

export const getTrendingArticles = (client: SanityClient): Promise<TrendingArticlesQueryResult> =>
  client.fetch(trendingArticlesQuery);

export const getRelatedArticles = (
  client: SanityClient,
  article: Pick<ArticleDetail, "slug" | "section" | "tags">,
  limit = 4
): Promise<RelatedArticlesQueryResult> =>
  client.fetch(relatedArticlesQuery, {
    slug: article.slug,
    sectionSlug: article.section.slug,
    tags: article.tags ?? [],
    limit,
  });

export async function getSiteSettings(client: SanityClient): Promise<SiteSettingsData> {
  const settings = await client.fetch(siteSettingsQuery);
  if (!settings || !settings.defaultSeo) {
    throw new Error(
      'Site settings document not found. Run "npm run studio:migrate" to seed it.'
    );
  }
  return settings as SiteSettingsData;
}
