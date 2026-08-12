import { sanityClient } from "./client";
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

// Every helper below has an explicit return type. `sanityClient.fetch`'s
// result type is inferred from the exact query-string literal via the
// generated `SanityQueries` map (see sanity.types.ts) — that inference
// chain doesn't reliably survive being combined inside `Promise.all([...])`
// call sites, so we pin it down here once instead of at every call site.

export const getSections = (): Promise<SectionsQueryResult> =>
  sanityClient.fetch(sectionsQuery);

export const getSectionBySlug = (slug: string): Promise<SectionBySlugQueryResult> =>
  sanityClient.fetch(sectionBySlugQuery, { slug });

export const getAuthors = (): Promise<AuthorsQueryResult> =>
  sanityClient.fetch(authorsQuery);

export const getAuthorBySlug = (slug: string): Promise<AuthorBySlugQueryResult> =>
  sanityClient.fetch(authorBySlugQuery, { slug });

export const getArticleSlugs = (): Promise<ArticleSlugsQueryResult> =>
  sanityClient.fetch(articleSlugsQuery);

export const getArticleBySlug = (slug: string): Promise<ArticleBySlugQueryResult> =>
  sanityClient.fetch(articleBySlugQuery, { slug });

export const getAllArticles = (): Promise<AllArticlesQueryResult> =>
  sanityClient.fetch(allArticlesQuery);

export const getArticlesInSection = (
  sectionSlug: string
): Promise<ArticlesInSectionQueryResult> =>
  sanityClient.fetch(articlesInSectionQuery, { sectionSlug });

export const getArticlesByAuthor = (
  authorSlug: string
): Promise<ArticlesByAuthorQueryResult> =>
  sanityClient.fetch(articlesByAuthorQuery, { authorSlug });

export const getPremiumArticles = (): Promise<PremiumArticlesQueryResult> =>
  sanityClient.fetch(premiumArticlesQuery);

export const getFeaturedArticles = (): Promise<FeaturedArticlesQueryResult> =>
  sanityClient.fetch(featuredArticlesQuery);

export const getRelatedArticles = (
  article: Pick<ArticleDetail, "slug" | "section" | "tags">,
  limit = 4
): Promise<RelatedArticlesQueryResult> =>
  sanityClient.fetch(relatedArticlesQuery, {
    slug: article.slug,
    sectionSlug: article.section.slug,
    tags: article.tags ?? [],
    limit,
  });

export async function getSiteSettings(): Promise<SiteSettingsData> {
  const settings = await sanityClient.fetch(siteSettingsQuery);
  if (!settings || !settings.defaultSeo) {
    throw new Error(
      'Site settings document not found. Run "npm run studio:migrate" to seed it.'
    );
  }
  return settings as SiteSettingsData;
}
