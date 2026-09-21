import type { EmdashClient } from "./client";
import type {
  ArticleCardData,
  ArticleDetail,
  AuthorData,
  AuthorRef,
  BodyBlock,
  EmdashImage,
  FooterLinkGroupResolved,
  ImageBlockData,
  LiveBlogDetail,
  LiveBlogEntryData,
  LiveBlogSummary,
  NavLinkResolved,
  SectionData,
  SectionRef,
  SeoData,
  SiteSettingsData,
  SocialLink,
  TextBlock,
} from "./types";

// Re-exported so call sites can `import type { ArticleCardData } from
// "../lib/emdash/content"` — mirroring how they used to import types
// alongside fetchers from lib/sanity/fetch.ts.
export type {
  ArticleCardData,
  ArticleDetail,
  AuthorData,
  AuthorRef,
  BodyBlock,
  EmdashImage,
  FooterLinkGroupResolved,
  ImageBlockData,
  LiveBlogDetail,
  LiveBlogSummary,
  NavLinkResolved,
  SectionData,
  SectionRef,
  SeoData,
  SiteSettingsData,
  SocialLink,
  TextBlock,
} from "./types";

// Normalizes apps/cms's ("pulse-cms") REST responses into the exact shapes
// apps/site's components already expect (see types.ts). This is the
// translation layer that lets ArticleCard.astro, Footer.astro, etc. carry
// over unchanged from the Sanity implementation — only this file (and
// client.ts/image.ts) needed to change. See docs/emdash-migration-plan.md
// for the collection/field layout this reads.
//
// IMPORTANT — no server-side filtering: EmDash's REST list endpoint
// (confirmed against its own source, `contentListQuery` in
// `src/api/schemas/content.ts`) only supports `status`, one `orderBy` field,
// `order`, and cursor pagination — there's no `where`/filter parameter. So
// "get articles in section X" etc. all fetch the full (paginated) articles
// collection once per request (cached on `client.cache`) and filter/join in
// memory, the same way the old `src/data/content.ts` mock layer did before
// Sanity existed. Fine for this site's dataset size; would need a real
// search/filter backend (EmDash's own `/search` endpoint, or a bigger
// rethink) well before this stops being fine.

// ---------------------------------------------------------------------------
// Raw EmDash REST shapes (confirmed against emdash@1.0.0's own source)
// ---------------------------------------------------------------------------

interface RawImage {
  id?: string;
  src?: string;
  alt?: string | null;
  width?: number;
  height?: number;
}

interface RawSeo {
  title: string | null;
  description: string | null;
  image: string | null;
  canonical: string | null;
  noIndex: boolean;
}

/** A content item as returned by `GET /content/{collection}[/...]` — custom field values live under `data`. */
interface RawContentItem {
  id: string;
  type: string;
  slug: string | null;
  status: string;
  data: Record<string, unknown>;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  seo?: RawSeo;
}

interface RawMediaRef {
  mediaId: string;
  alt?: string;
}

interface RawMenuItem {
  id: string;
  menu_id: string;
  parent_id: string | null;
  sort_order: number;
  type: string;
  reference_collection: string | null;
  reference_id: string | null;
  custom_url: string | null;
  label: string;
}

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

function resolveUrl(client: EmdashClient, maybeRelative: string | undefined): string {
  if (!maybeRelative) return "";
  return /^https?:\/\//.test(maybeRelative) ? maybeRelative : `${client.baseUrl}${maybeRelative}`;
}

function normalizeImage(client: EmdashClient, raw: RawImage | null | undefined): EmdashImage {
  return {
    id: raw?.id ?? "",
    src: resolveUrl(client, raw?.src),
    alt: raw?.alt ?? null,
    width: raw?.width ?? 0,
    height: raw?.height ?? 0,
  };
}

/** Resolves a `{mediaId, alt}` settings reference (logo/favicon/defaultOgImage) to a displayable image. Requires the PAT to also carry `media:read`. */
async function resolveMediaRef(client: EmdashClient, ref: RawMediaRef | undefined): Promise<EmdashImage | null> {
  if (!ref?.mediaId) return null;
  const cacheKey = `media:${ref.mediaId}`;
  if (client.cache.has(cacheKey)) return client.cache.get(cacheKey) as EmdashImage | null;
  try {
    const result = await client.get<{ item: { storageKey: string; width: number | null; height: number | null } }>(
      `/media/${ref.mediaId}`
    );
    const image = result
      ? normalizeImage(client, {
          id: ref.mediaId,
          src: `/_emdash/api/media/file/${result.item.storageKey}`,
          alt: ref.alt,
          width: result.item.width ?? undefined,
          height: result.item.height ?? undefined,
        })
      : null;
    client.cache.set(cacheKey, image);
    return image;
  } catch {
    return null;
  }
}

function toSeo(raw: RawSeo | undefined, image: EmdashImage | null): SeoData | null {
  if (!raw || (!raw.title && !raw.description && !image)) return null;
  return { metaTitle: raw.title, metaDescription: raw.description, ogImage: image };
}

/**
 * Walks an EmDash portableText field's JSON into the same discriminated
 * union apps/site's portable-text components already render (`_type`:
 * "block" | "imageBlock" | "videoEmbed").
 *
 * The standard `block` type (paragraphs/headings/quotes/lists/links) is the
 * open Portable Text spec and carries over as-is. The native inline image
 * block (`_type: "image"`, `{ asset: { _ref, url? }, alt?, caption?, width?,
 * height? }`) and the embed block (`_type: "embed"`, `{ url, provider?,
 * html?, caption? }`) shapes below are confirmed against EmDash 1.0.0's own
 * editor source (`src/components/InlinePortableTextEditor.tsx`,
 * `src/components/Image.astro`, `src/components/Embed.astro`).
 */
function normalizePortableText(client: EmdashClient, raw: unknown): BodyBlock[] {
  if (!Array.isArray(raw)) return [];
  const out: BodyBlock[] = [];

  for (const block of raw as Array<Record<string, unknown>>) {
    const type = block._type as string | undefined;
    if (type === "block") {
      out.push(block as unknown as TextBlock);
      continue;
    }

    if (type === "image") {
      const asset = (block.asset as { _ref?: string; url?: string } | undefined) ?? {};
      const src = asset.url ?? (asset._ref ? `/_emdash/api/media/file/${asset._ref}` : undefined);
      const normalized: ImageBlockData = {
        _type: "imageBlock",
        _key: (block._key as string) ?? crypto.randomUUID(),
        id: asset._ref ?? "",
        src: resolveUrl(client, src),
        alt: (block.alt as string | undefined) ?? null,
        caption: (block.caption as string | undefined) ?? null,
        width: (block.displayWidth as number | undefined) ?? (block.width as number | undefined) ?? 0,
        height: (block.displayHeight as number | undefined) ?? (block.height as number | undefined) ?? 0,
      };
      out.push(normalized);
      continue;
    }

    if (type === "embed") {
      const url = block.url as string | undefined;
      if (url) {
        out.push({ _type: "videoEmbed", _key: (block._key as string) ?? crypto.randomUUID(), url });
      }
      continue;
    }

    // Any other block type (code, table, gallery, a plugin block, ...) —
    // skip rather than crash the page. Extend here if this site starts
    // using one of those in article bodies.
  }

  return out;
}

// ---------------------------------------------------------------------------
// Generic content list/get helpers
// ---------------------------------------------------------------------------

async function getItem(client: EmdashClient, collection: string, idOrSlug: string): Promise<RawContentItem | undefined> {
  const result = await client.get<{ item: RawContentItem }>(`/content/${collection}/${encodeURIComponent(idOrSlug)}`);
  return result?.item;
}

const MAX_LIST_PAGES = 20; // 20 * 100 = 2,000 items, comfortably past this site's real dataset size.

/** Fetches every item in a collection, following `nextCursor`. Cached per (collection, orderBy, order, status) for the lifetime of the request. */
async function getAllItems(
  client: EmdashClient,
  collection: string,
  opts: { status?: string; orderBy?: string; order?: "asc" | "desc" } = {}
): Promise<RawContentItem[]> {
  const cacheKey = `all:${collection}:${opts.status ?? ""}:${opts.orderBy ?? ""}:${opts.order ?? ""}`;
  if (client.cache.has(cacheKey)) return client.cache.get(cacheKey) as RawContentItem[];

  const items: RawContentItem[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_LIST_PAGES; page++) {
    const result = await client.get<{ items: RawContentItem[]; nextCursor?: string }>(`/content/${collection}`, {
      status: opts.status,
      orderBy: opts.orderBy,
      order: opts.order,
      limit: 100,
      cursor,
    });
    if (!result) break;
    items.push(...result.items);
    if (!result.nextCursor) break;
    cursor = result.nextCursor;
  }

  client.cache.set(cacheKey, items);
  return items;
}

// ---------------------------------------------------------------------------
// Sections & authors (small lookup collections)
// ---------------------------------------------------------------------------

function toSectionData(raw: RawContentItem): SectionData {
  return {
    _id: raw.id,
    slug: raw.slug ?? "",
    title: raw.data.title as string,
    tagline: raw.data.tagline as string,
    accentColor: raw.data.accent_color as string,
    order: raw.data.display_order as number,
    seo: toSeo(raw.seo, null),
  };
}

export async function getSections(client: EmdashClient): Promise<SectionData[]> {
  const cacheKey = "sections";
  if (client.cache.has(cacheKey)) return client.cache.get(cacheKey) as SectionData[];
  const items = await getAllItems(client, "sections", { orderBy: "display_order", order: "asc" });
  const sections = items.map((raw) => toSectionData(raw)).sort((a, b) => a.order - b.order);
  client.cache.set(cacheKey, sections);
  return sections;
}

export async function getSectionBySlug(client: EmdashClient, slug: string): Promise<SectionData | undefined> {
  const sections = await getSections(client);
  return sections.find((s) => s.slug === slug);
}

async function getSectionsById(client: EmdashClient): Promise<Map<string, SectionData>> {
  const sections = await getSections(client);
  return new Map(sections.map((s) => [s._id, s]));
}

function toAuthorData(client: EmdashClient, raw: RawContentItem): AuthorData {
  return {
    _id: raw.id,
    slug: raw.slug ?? "",
    name: raw.data.name as string,
    role: raw.data.role as string,
    bio: raw.data.bio as string,
    avatar: normalizeImage(client, raw.data.avatar as RawImage),
    twitter: (raw.data.twitter as string | undefined) ?? null,
    seo: toSeo(raw.seo, null),
  };
}

export async function getAuthors(client: EmdashClient): Promise<AuthorData[]> {
  const cacheKey = "authors";
  if (client.cache.has(cacheKey)) return client.cache.get(cacheKey) as AuthorData[];
  const items = await getAllItems(client, "authors", { orderBy: "name", order: "asc" });
  const authors = items.map((raw) => toAuthorData(client, raw));
  client.cache.set(cacheKey, authors);
  return authors;
}

export async function getAuthorBySlug(client: EmdashClient, slug: string): Promise<AuthorData | undefined> {
  const authors = await getAuthors(client);
  return authors.find((a) => a.slug === slug);
}

async function getAuthorsById(client: EmdashClient): Promise<Map<string, AuthorData>> {
  const authors = await getAuthors(client);
  return new Map(authors.map((a) => [a._id, a]));
}

function toAuthorRef(a: AuthorData): AuthorRef {
  return { slug: a.slug, name: a.name, avatar: a.avatar };
}
function toSectionRef(s: SectionData): SectionRef {
  return { slug: s.slug, title: s.title, accentColor: s.accentColor };
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

interface ArticleLookups {
  sectionsById: Map<string, SectionData>;
  authorsById: Map<string, AuthorData>;
}

async function getArticleLookups(client: EmdashClient): Promise<ArticleLookups> {
  const [sectionsById, authorsById] = await Promise.all([getSectionsById(client), getAuthorsById(client)]);
  return { sectionsById, authorsById };
}

function toArticleCard(raw: RawContentItem, client: EmdashClient, lookups: ArticleLookups): ArticleCardData {
  const section = lookups.sectionsById.get(raw.data.section as string);
  const author = lookups.authorsById.get(raw.data.author as string);
  return {
    _id: raw.id,
    slug: raw.slug ?? "",
    title: raw.data.title as string,
    dek: raw.data.dek as string,
    hero: normalizeImage(client, raw.data.hero as RawImage),
    section: section ? toSectionRef(section) : null,
    authors: author ? [toAuthorRef(author)] : [],
    publishedAt: raw.publishedAt ?? raw.createdAt,
    readTime: raw.data.read_time as number,
    premium: Boolean(raw.data.premium),
    featured: Boolean(raw.data.featured),
  };
}

/** All published articles, fetched once per request. Every "get articles by X" helper filters this in memory — see the module comment. */
async function getAllArticlesRaw(client: EmdashClient): Promise<RawContentItem[]> {
  return getAllItems(client, "articles", { status: "published", orderBy: "published_at", order: "desc" });
}

async function getArticleTags(client: EmdashClient, articleId: string): Promise<string[]> {
  const cacheKey = `tags:${articleId}`;
  if (client.cache.has(cacheKey)) return client.cache.get(cacheKey) as string[];
  try {
    const result = await client.get<{ terms: Array<{ slug: string }> }>(`/content/articles/${articleId}/terms/tag`);
    const tags = (result?.terms ?? []).map((t) => t.slug);
    client.cache.set(cacheKey, tags);
    return tags;
  } catch {
    return [];
  }
}

/** Tags for every article, fetched in parallel and cached — needed by tag-filtering helpers below since the REST API can't filter by taxonomy server-side. */
async function getArticleTagsMap(client: EmdashClient): Promise<Map<string, string[]>> {
  const cacheKey = "article-tags-map";
  if (client.cache.has(cacheKey)) return client.cache.get(cacheKey) as Map<string, string[]>;
  const articles = await getAllArticlesRaw(client);
  const entries = await Promise.all(articles.map(async (a): Promise<[string, string[]]> => [a.id, await getArticleTags(client, a.id)]));
  const map = new Map(entries);
  client.cache.set(cacheKey, map);
  return map;
}

async function toArticleDetail(raw: RawContentItem, client: EmdashClient, lookups: ArticleLookups): Promise<ArticleDetail> {
  const section = lookups.sectionsById.get(raw.data.section as string);
  const author = lookups.authorsById.get(raw.data.author as string);
  const tags = await getArticleTags(client, raw.id);
  const seoImage = raw.seo?.image ? normalizeImage(client, { id: "", src: raw.seo.image }) : null;

  return {
    _id: raw.id,
    slug: raw.slug ?? "",
    title: raw.data.title as string,
    dek: raw.data.dek as string,
    hero: normalizeImage(client, raw.data.hero as RawImage),
    section: section ? toSectionRef(section) : { slug: "", title: "", accentColor: "#000000" },
    authors: author ? [author] : [],
    publishedAt: raw.publishedAt ?? raw.createdAt,
    readTime: raw.data.read_time as number,
    premium: Boolean(raw.data.premium),
    featured: Boolean(raw.data.featured),
    tags,
    freePreviewBlocks: (raw.data.free_preview_blocks as number) ?? 3,
    body: normalizePortableText(client, raw.data.body),
    seo: toSeo(raw.seo, seoImage),
  };
}

export async function getArticleSlugs(client: EmdashClient): Promise<Array<{ slug: string }>> {
  const items = await getAllArticlesRaw(client);
  return items.filter((i) => i.slug).map((i) => ({ slug: i.slug as string }));
}

export async function getArticleBySlug(client: EmdashClient, slug: string): Promise<ArticleDetail | undefined> {
  const raw = await getItem(client, "articles", slug);
  if (!raw || raw.status !== "published") return undefined;
  const lookups = await getArticleLookups(client);
  return toArticleDetail(raw, client, lookups);
}

async function cardsFrom(client: EmdashClient, items: RawContentItem[]): Promise<ArticleCardData[]> {
  const lookups = await getArticleLookups(client);
  return items.map((raw) => toArticleCard(raw, client, lookups));
}

export async function getAllArticles(client: EmdashClient): Promise<ArticleCardData[]> {
  return cardsFrom(client, await getAllArticlesRaw(client));
}

export async function getArticlesInSection(client: EmdashClient, sectionSlug: string): Promise<ArticleCardData[]> {
  const [section, all] = await Promise.all([getSectionBySlug(client, sectionSlug), getAllArticlesRaw(client)]);
  if (!section) return [];
  return cardsFrom(client, all.filter((a) => a.data.section === section._id));
}

export async function getArticlesByAuthor(client: EmdashClient, authorSlug: string): Promise<ArticleCardData[]> {
  const [author, all] = await Promise.all([getAuthorBySlug(client, authorSlug), getAllArticlesRaw(client)]);
  if (!author) return [];
  return cardsFrom(client, all.filter((a) => a.data.author === author._id));
}

export async function getArticlesByTag(client: EmdashClient, tag: string): Promise<ArticleCardData[]> {
  const [all, tagsById] = await Promise.all([getAllArticlesRaw(client), getArticleTagsMap(client)]);
  return cardsFrom(client, all.filter((a) => (tagsById.get(a.id) ?? []).includes(tag)));
}

export async function getForYouArticles(client: EmdashClient, sections: string[], tags: string[]): Promise<ArticleCardData[]> {
  if (sections.length === 0 && tags.length === 0) return [];
  const [all, sectionRecords, tagsById] = await Promise.all([
    getAllArticlesRaw(client),
    getSections(client),
    getArticleTagsMap(client),
  ]);
  const sectionIds = new Set(sectionRecords.filter((s) => sections.includes(s.slug)).map((s) => s._id));

  const matches = all.filter(
    (a) => sectionIds.has(a.data.section as string) || (tagsById.get(a.id) ?? []).some((t) => tags.includes(t))
  );
  return (await cardsFrom(client, matches)).slice(0, 8);
}

export async function getArticlesBySlugs(client: EmdashClient, slugs: string[]): Promise<ArticleCardData[]> {
  if (slugs.length === 0) return [];
  const all = await getAllArticlesRaw(client);
  const slugSet = new Set(slugs);
  return cardsFrom(client, all.filter((a) => a.slug && slugSet.has(a.slug)));
}

export async function getPremiumArticles(client: EmdashClient): Promise<ArticleCardData[]> {
  const all = await getAllArticlesRaw(client);
  return cardsFrom(client, all.filter((a) => a.data.premium === true));
}

export async function getFeaturedArticles(client: EmdashClient): Promise<ArticleCardData[]> {
  const all = await getAllArticlesRaw(client);
  return cardsFrom(client, all.filter((a) => a.data.featured === true));
}

export async function getTrendingArticles(client: EmdashClient): Promise<ArticleCardData[]> {
  const all = await getAllArticlesRaw(client);
  const ranked = all
    .filter((a) => typeof a.data.trending_rank === "number")
    .sort((a, b) => (a.data.trending_rank as number) - (b.data.trending_rank as number))
    .slice(0, 8);
  return cardsFrom(client, ranked);
}

export async function getRelatedArticles(
  client: EmdashClient,
  article: Pick<ArticleDetail, "slug" | "section" | "tags">,
  limit = 4
): Promise<ArticleCardData[]> {
  const [sameSection, sharedTag] = await Promise.all([
    getArticlesInSection(client, article.section.slug),
    article.tags.length > 0 ? getArticlesByTag(client, article.tags[0]) : Promise.resolve([]),
  ]);
  const seen = new Set([article.slug]);
  const merged: ArticleCardData[] = [];
  for (const a of [...sameSection, ...sharedTag]) {
    if (seen.has(a.slug)) continue;
    seen.add(a.slug);
    merged.push(a);
    if (merged.length >= limit) break;
  }
  return merged;
}

// ---------------------------------------------------------------------------
// Live blogs
// ---------------------------------------------------------------------------

export async function getLiveBlogBySlug(client: EmdashClient, slug: string): Promise<LiveBlogDetail | undefined> {
  const raw = await getItem(client, "live_blogs", slug);
  if (!raw || raw.status !== "published") return undefined;

  const [sectionsById, authorsById, entryItems] = await Promise.all([
    getSectionsById(client),
    getAuthorsById(client),
    getAllItems(client, "live_blog_entries", { orderBy: "timestamp", order: "desc" }),
  ]);
  const section = raw.data.section ? sectionsById.get(raw.data.section as string) : undefined;
  const seoImage = raw.seo?.image ? normalizeImage(client, { id: "", src: raw.seo.image }) : null;

  const entries: LiveBlogEntryData[] = entryItems
    .filter((e) => e.data.live_blog === raw.id)
    .map((e) => {
      const author = e.data.author ? authorsById.get(e.data.author as string) : undefined;
      return {
        timestamp: e.data.timestamp as string,
        headline: (e.data.headline as string | undefined) ?? null,
        body: normalizePortableText(client, e.data.body),
        author: author ? toAuthorRef(author) : null,
      };
    });

  return {
    _id: raw.id,
    slug: raw.slug ?? "",
    title: raw.data.title as string,
    dek: raw.data.dek as string,
    section: section ? toSectionRef(section) : null,
    hero: normalizeImage(client, raw.data.hero as RawImage),
    status: (raw.data.status as "live" | "ended") ?? "live",
    startedAt: raw.data.started_at as string,
    entries,
    seo: toSeo(raw.seo, seoImage),
  };
}

export async function getActiveLiveBlogs(client: EmdashClient): Promise<LiveBlogSummary[]> {
  const items = await getAllItems(client, "live_blogs", { status: "published", orderBy: "started_at", order: "desc" });
  return items
    .filter((raw) => raw.data.status === "live")
    .map((raw) => ({
      _id: raw.id,
      slug: raw.slug ?? "",
      title: raw.data.title as string,
      dek: raw.data.dek as string,
      startedAt: raw.data.started_at as string,
    }));
}

export async function getAllLiveBlogs(client: EmdashClient): Promise<LiveBlogSummary[]> {
  const items = await getAllItems(client, "live_blogs");
  return items.map((raw) => ({
    _id: raw.id,
    slug: raw.slug ?? "",
    title: raw.data.title as string,
    dek: raw.data.dek as string,
    startedAt: raw.data.started_at as string,
  }));
}

// ---------------------------------------------------------------------------
// Site settings
// ---------------------------------------------------------------------------

/** Groups a flat menu-item list (parent_id links) into a two-level tree, sorted by sort_order. */
function buildMenuTree(items: RawMenuItem[]): Array<RawMenuItem & { children: RawMenuItem[] }> {
  const byParent = new Map<string | null, RawMenuItem[]>();
  for (const item of items) {
    const key = item.parent_id;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(item);
  }
  const sortBySortOrder = (a: RawMenuItem, b: RawMenuItem) => a.sort_order - b.sort_order;
  const top = (byParent.get(null) ?? []).sort(sortBySortOrder);
  return top.map((item) => ({ ...item, children: (byParent.get(item.id) ?? []).sort(sortBySortOrder) }));
}

const REFERENCE_PATHS: Record<string, (slug: string) => string> = {
  sections: (slug) => `/sections/${slug}`,
  articles: (slug) => `/articles/${slug}`,
  authors: (slug) => `/authors/${slug}`,
  live_blogs: (slug) => `/live/${slug}`,
};

async function resolveMenuItemUrl(client: EmdashClient, item: RawMenuItem): Promise<string> {
  if (item.custom_url) return item.custom_url;
  if (item.reference_collection && item.reference_id) {
    const pathFor = REFERENCE_PATHS[item.reference_collection];
    if (pathFor) {
      const referenced = await getItem(client, item.reference_collection, item.reference_id);
      if (referenced?.slug) return pathFor(referenced.slug);
    }
  }
  return "#";
}

async function menuLinks(client: EmdashClient, items: RawMenuItem[]): Promise<NavLinkResolved[]> {
  return Promise.all(
    items.map(async (item) => ({
      label: item.label,
      // The distinction between "internal" and "external" no longer matters
      // once the URL is resolved — kept only for shape compatibility with
      // Header.astro/Footer.astro's existing prop types.
      linkType: "external" as const,
      internalHref: null,
      externalUrl: await resolveMenuItemUrl(client, item),
    }))
  );
}

async function getMenuTree(client: EmdashClient, name: string): Promise<Array<RawMenuItem & { children: RawMenuItem[] }>> {
  const result = await client.get<{ items: RawMenuItem[] }>(`/menus/${name}`);
  return buildMenuTree(result?.items ?? []);
}

export async function getSiteSettings(client: EmdashClient): Promise<SiteSettingsData> {
  const [general, primaryTree, footerTree, extrasItems] = await Promise.all([
    client.get<{
      title?: string;
      tagline?: string;
      logo?: RawMediaRef;
      social?: Record<string, string>;
      seo?: { defaultOgImage?: RawMediaRef };
    }>("/settings"),
    getMenuTree(client, "primary"),
    getMenuTree(client, "footer"),
    getAllItems(client, "site_extras"),
  ]);

  const extras = extrasItems[0]?.data ?? {};
  const logo = await resolveMediaRef(client, general?.logo);

  const [mainNav, footerLinkGroups] = await Promise.all([
    menuLinks(client, primaryTree),
    Promise.all(
      footerTree.map(
        async (group): Promise<FooterLinkGroupResolved> => ({
          heading: group.label,
          links: await menuLinks(client, group.children),
        })
      )
    ),
  ]);

  const socialLinks: SocialLink[] = (
    (extras.social_links as Array<{ platform: string; url: string }> | undefined) ?? []
  ).map((s) => ({ platform: s.platform, url: s.url }));

  const defaultSeoImageRef = extras.default_seo_image as RawImage | undefined;

  return {
    title: general?.title ?? "PULSE",
    tagline: general?.tagline ?? "",
    logo,
    defaultSeo: {
      metaTitle: (extras.default_seo_title as string | undefined) ?? null,
      metaDescription: (extras.default_seo_description as string | undefined) ?? null,
      ogImage: defaultSeoImageRef ? normalizeImage(client, defaultSeoImageRef) : null,
    },
    mainNav,
    footerLinkGroups,
    socialLinks,
    copyrightText: (extras.copyright_text as string | undefined) ?? null,
    breakingNews: {
      active: Boolean(extras.active),
      headline: (extras.headline as string | undefined) ?? null,
      href: (extras.href as string | undefined) ?? null,
    },
  };
}
