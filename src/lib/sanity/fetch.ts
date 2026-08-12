import type { SanityClient } from "@sanity/client";
import {
  allArticlesQuery,
  articleBySlugQuery,
  articleSlugsQuery,
  articlesByAuthorQuery,
  articlesInSectionQuery,
  authorBySlugQuery,
  authorsQuery,
  featuredArticlesQuery,
  premiumArticlesQuery,
  relatedArticlesQuery,
  sectionBySlugQuery,
  sectionsQuery,
  siteSettingsQuery,
} from "./queries";
import type {
  AllArticlesQueryResult,
  ArticleBySlugQueryResult,
  ArticleSlugsQueryResult,
  ArticlesByAuthorQueryResult,
  ArticlesInSectionQueryResult,
  AuthorBySlugQueryResult,
  AuthorsQueryResult,
  FeaturedArticlesQueryResult,
  PremiumArticlesQueryResult,
  RelatedArticlesQueryResult,
  SectionBySlugQueryResult,
  SectionsQueryResult,
  SiteSettingsQueryResult,
} from "./sanity.types";

/** The shape shared by every article-listing query (`ArticleCard`, `RelatedRail`, grids). */
export type ArticleCardData = ArticlesInSectionQueryResult[number];
export type ArticleDetail = NonNullable<ArticleBySlugQueryResult>;
export type SectionData = NonNullable<SectionBySlugQueryResult>;
export type AuthorData = NonNullable<AuthorBySlugQueryResult>;
export type SiteSettingsData = Extract<SiteSettingsQueryResult, { defaultSeo: object }>;

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

export const getPremiumArticles = (client: SanityClient): Promise<PremiumArticlesQueryResult> =>
  client.fetch(premiumArticlesQuery);

export const getFeaturedArticles = (client: SanityClient): Promise<FeaturedArticlesQueryResult> =>
  client.fetch(featuredArticlesQuery);

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
