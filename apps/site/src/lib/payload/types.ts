/**
 * Hand-written mirror of apps/cms's collection/global shapes, scoped to
 * what apps/site actually reads. Unlike the old committed
 * `sanity.types.ts`, this isn't generated — apps/cms's `payload
 * generate:types` output isn't imported here (it would pull a Node-only
 * package graph into a Workers build). Keep this in sync by hand when a
 * collection in apps/cms/src/collections changes shape.
 */

export interface MediaSizes {
  avatarSm?: MediaVariant;
  avatarMd?: MediaVariant;
  avatarLg?: MediaVariant;
  thumbSquare?: MediaVariant;
  thumbList?: MediaVariant;
  thumbRail?: MediaVariant;
  thumbRelated?: MediaVariant;
  card?: MediaVariant;
  cardWide?: MediaVariant;
  hero?: MediaVariant;
  og?: MediaVariant;
  inline?: MediaVariant;
  full?: MediaVariant;
}

export interface MediaVariant {
  url?: string | null;
  width?: number | null;
  height?: number | null;
}

export interface Media {
  id: string | number;
  alt: string;
  url?: string | null;
  width?: number | null;
  height?: number | null;
  sizes?: MediaSizes;
}

export interface Seo {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImage?: Media | null;
}

export interface Section {
  id: string | number;
  title: string;
  slug: string;
  tagline: string;
  accentColor: string;
  order: number;
  seo?: Seo | null;
}

export interface Author {
  id: string | number;
  name: string;
  slug: string;
  role: string;
  bio: string;
  avatar: Media;
  twitter?: string | null;
  seo?: Seo | null;
}

/** A Lexical node — deliberately loose; see lib/richtext/render.ts for what's actually handled. */
export interface LexicalNode {
  type: string;
  [key: string]: unknown;
}

export interface RichText {
  root: {
    children: LexicalNode[];
  };
}

export interface Article {
  id: string | number;
  title: string;
  slug: string;
  dek: string;
  section: Section;
  authors: Author[];
  hero: Media;
  body: RichText;
  freePreviewBlocks?: number | null;
  publishedAt: string;
  readTime: number;
  tags?: string[] | null;
  premium?: boolean | null;
  featured?: boolean | null;
  trendingRank?: number | null;
  seo?: Seo | null;
}

export interface LiveBlogEntry {
  timestamp: string;
  headline?: string | null;
  body: RichText;
  author?: Author | null;
}

export interface LiveBlog {
  id: string | number;
  title: string;
  slug: string;
  dek: string;
  section?: Section | null;
  hero: Media;
  liveStatus: "live" | "ended";
  startedAt: string;
  entries?: LiveBlogEntry[] | null;
  seo?: Seo | null;
}

export interface NavLink {
  label: string;
  linkType: "internal" | "external";
  internalLink?: Section | null;
  externalUrl?: string | null;
}

export interface FooterLinkGroup {
  heading: string;
  links?: NavLink[] | null;
}

export interface SocialLink {
  platform: "twitter" | "instagram" | "linkedin" | "youtube" | "tiktok" | "facebook";
  url: string;
}

export interface SiteSettings {
  title: string;
  tagline: string;
  logo?: Media | null;
  defaultSeo: Seo;
  mainNav?: NavLink[] | null;
  footerLinkGroups?: FooterLinkGroup[] | null;
  socialLinks?: SocialLink[] | null;
  copyrightText?: string | null;
  breakingNews?: {
    active?: boolean | null;
    headline?: string | null;
    href?: string | null;
  } | null;
}
