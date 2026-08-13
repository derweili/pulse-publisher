import groq, {defineQuery} from "groq";

/**
 * Shared projection used by every article-listing query (cards, rails,
 * grids). Keeps list queries from over-fetching `body` Portable Text, and
 * keeps `ArticleCard`/`RelatedRail` prop types small and consistent.
 */
const cardProjection = groq`{
  _id,
  title,
  "slug": slug.current,
  dek,
  hero,
  "section": section->{ "slug": slug.current, title, accentColor },
  "authors": authors[]->{ "slug": slug.current, name, avatar },
  publishedAt,
  readTime,
  premium,
  featured
}`;

export const siteSettingsQuery = defineQuery(`
  *[_id == "siteSettings"][0]{
    title,
    tagline,
    logo,
    defaultSeo,
    mainNav[]{
      label,
      linkType,
      "internalHref": internalLink->slug.current,
      externalUrl
    },
    footerLinkGroups[]{
      heading,
      links[]{
        label,
        linkType,
        "internalHref": internalLink->slug.current,
        externalUrl
      }
    },
    socialLinks[]{ platform, url },
    copyrightText,
    breakingNews{ active, headline, href }
  }
`);

export const sectionsQuery = defineQuery(`
  *[_type == "section"] | order(order asc) {
    _id,
    title,
    "slug": slug.current,
    tagline,
    accentColor,
    order,
    seo
  }
`);

export const sectionBySlugQuery = defineQuery(`
  *[_type == "section" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    tagline,
    accentColor,
    order,
    seo
  }
`);

export const authorsQuery = defineQuery(`
  *[_type == "author"] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    role,
    bio,
    avatar,
    twitter,
    seo
  }
`);

export const authorBySlugQuery = defineQuery(`
  *[_type == "author" && slug.current == $slug][0]{
    _id,
    name,
    "slug": slug.current,
    role,
    bio,
    avatar,
    twitter,
    seo
  }
`);

/** Lightweight — used only to enumerate `getStaticPaths` for article pages. */
export const articleSlugsQuery = defineQuery(`
  *[_type == "article"]{ "slug": slug.current }
`);

export const articleBySlugQuery = defineQuery(`
  *[_type == "article" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    dek,
    "section": section->{ "slug": slug.current, title, accentColor },
    "authors": authors[]->{ "slug": slug.current, name, role, bio, avatar, twitter },
    publishedAt,
    readTime,
    hero,
    tags,
    premium,
    featured,
    freePreviewBlocks,
    body[]{
      ...,
      markDefs[]{ ... }
    },
    seo
  }
`);

export const articlesInSectionQuery = defineQuery(`
  *[_type == "article" && section->slug.current == $sectionSlug]
  | order(publishedAt desc) ${cardProjection}
`);

export const articlesByAuthorQuery = defineQuery(`
  *[_type == "article" && $authorSlug in authors[]->slug.current]
  | order(publishedAt desc) ${cardProjection}
`);

export const premiumArticlesQuery = defineQuery(`
  *[_type == "article" && premium == true]
  | order(publishedAt desc) ${cardProjection}
`);

export const featuredArticlesQuery = defineQuery(`
  *[_type == "article" && featured == true]
  | order(publishedAt desc) ${cardProjection}
`);

export const allArticlesQuery = defineQuery(`
  *[_type == "article"] | order(publishedAt desc) ${cardProjection}
`);

export const trendingArticlesQuery = defineQuery(`
  *[_type == "article" && defined(trendingRank)]
  | order(trendingRank asc) [0...8] ${cardProjection}
`);

/**
 * Powers the client-side "For You" rail: candidate pool for a reader whose
 * localStorage reading history leans toward certain sections/tags (see
 * ForYouRail.tsx). No server-side personalization/tracking — this is a
 * plain content query, filtered client-side of the request by whatever the
 * browser already knows about that one visitor.
 */
export const forYouArticlesQuery = defineQuery(`
  *[
    _type == "article" &&
    (section->slug.current in $sections || count((tags[])[@ in $tags]) > 0)
  ]
  | order(publishedAt desc) [0...8] ${cardProjection}
`);

export const articlesByTagQuery = defineQuery(`
  *[_type == "article" && $tag in tags]
  | order(publishedAt desc) ${cardProjection}
`);

export const articlesBySlugsQuery = defineQuery(`
  *[_type == "article" && slug.current in $slugs]
  | order(publishedAt desc) ${cardProjection}
`);

export const liveBlogBySlugQuery = defineQuery(`
  *[_type == "liveBlog" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    dek,
    "section": section->{ "slug": slug.current, title, accentColor },
    hero,
    status,
    startedAt,
    "entries": entries[] | order(timestamp desc){
      timestamp,
      headline,
      body[]{
        ...,
        markDefs[]{ ... }
      },
      "author": author->{ "slug": slug.current, name, avatar }
    },
    seo
  }
`);

export const activeLiveBlogsQuery = defineQuery(`
  *[_type == "liveBlog" && status == "live"] | order(startedAt desc){
    _id,
    title,
    "slug": slug.current,
    dek,
    startedAt
  }
`);

/** Lightweight — used for the sitemap and search index, which need every live blog regardless of status. */
export const allLiveBlogsQuery = defineQuery(`
  *[_type == "liveBlog"]{ _id, title, dek, "slug": slug.current, startedAt }
`);

/**
 * Same-section articles first, then articles from other sections that
 * share at least one tag — mirrors the old content.ts `relatedArticles()`
 * concatenation semantics in a single ordered query.
 */
export const relatedArticlesQuery = defineQuery(`
  *[
    _type == "article" &&
    slug.current != $slug &&
    (section->slug.current == $sectionSlug || count((tags[])[@ in $tags]) > 0)
  ]
  | order((section->slug.current == $sectionSlug) desc, publishedAt desc)
  [0...$limit]
  ${cardProjection}
`);
