/**
 * One-off content migration: reads the hardcoded mock data from
 * src/data/content.ts and writes it into Sanity as real documents.
 *
 * Idempotent and safe to re-run: documents use deterministic `_id`s and are
 * written via `createIfNotExists`, and uploaded image assets are cached by
 * source URL in `.migration-cache.json` so re-runs don't re-upload them.
 *
 * Usage: npm run migrate   (run from studio/, requires SANITY_API_WRITE_TOKEN)
 */
import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, type SanityClient } from "@sanity/client";
import {
  articles as mockArticles,
  authors as mockAuthors,
  sections as mockSections,
  type ArticleBlock,
} from "../../src/data/content";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = path.join(__dirname, ".migration-cache.json");

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId) throw new Error("Missing SANITY_STUDIO_PROJECT_ID (see studio/.env.example).");
if (!token) throw new Error("Missing SANITY_API_WRITE_TOKEN (see studio/.env.example).");

const client = createClient({
  projectId,
  dataset,
  token,
  apiVersion: "2025-02-01",
  useCdn: false,
});

// --- Asset upload cache (keyed by source URL) -----------------------------

type AssetCache = Record<string, string>; // sourceUrl -> Sanity asset _id

async function loadCache(): Promise<AssetCache> {
  try {
    return JSON.parse(await readFile(CACHE_PATH, "utf-8"));
  } catch {
    return {};
  }
}

async function saveCache(cache: AssetCache) {
  await writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
}

let cache: AssetCache = {};

async function uploadImage(client: SanityClient, url: string, filename: string): Promise<string> {
  if (cache[url]) return cache[url];

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image ${url}: ${res.status} ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const asset = await client.assets.upload("image", buffer, { filename });
  cache[url] = asset._id;
  await saveCache(cache);
  return asset._id;
}

const assetRef = (assetId: string) => ({
  asset: { _type: "reference" as const, _ref: assetId },
});

// --- Portable Text conversion ----------------------------------------------

async function blocksToPortableText(client: SanityClient, blocks: ArticleBlock[]) {
  const result = [];

  for (const block of blocks) {
    switch (block.type) {
      case "paragraph":
      case "heading":
      case "quote": {
        const style = block.type === "heading" ? "h2" : block.type === "quote" ? "blockquote" : "normal";
        result.push({
          _type: "block",
          _key: randomUUID(),
          style,
          markDefs: [],
          children: [{ _type: "span", _key: randomUUID(), text: block.text ?? "", marks: [] }],
        });
        break;
      }
      case "list": {
        for (const item of block.items ?? []) {
          result.push({
            _type: "block",
            _key: randomUUID(),
            style: "normal",
            listItem: "bullet",
            level: 1,
            markDefs: [],
            children: [{ _type: "span", _key: randomUUID(), text: item, marks: [] }],
          });
        }
        break;
      }
      case "image": {
        if (!block.src) break;
        const assetId = await uploadImage(client, block.src, `${randomUUID()}.jpg`);
        result.push({
          _type: "imageBlock",
          _key: randomUUID(),
          ...assetRef(assetId),
          alt: block.alt ?? "",
          caption: block.caption,
        });
        break;
      }
      case "video": {
        if (!block.embedUrl) break;
        result.push({ _type: "videoEmbed", _key: randomUUID(), url: block.embedUrl });
        break;
      }
    }
  }

  return result;
}

// --- Migration steps ---------------------------------------------------

async function migrateSections() {
  console.log(`\nSections (${mockSections.length})`);
  for (const [index, section] of mockSections.entries()) {
    const _id = `section-${section.slug}`;
    await client.createIfNotExists({
      _id,
      _type: "section",
      title: section.name,
      slug: { _type: "slug", current: section.slug },
      tagline: section.tagline,
      accentColor: section.accent,
      order: index,
    });
    console.log(`  - ${_id}`);
  }
}

async function migrateAuthors() {
  console.log(`\nAuthors (${mockAuthors.length})`);
  for (const author of mockAuthors) {
    const _id = `author-${author.slug}`;
    const avatarAssetId = await uploadImage(client, author.avatar, `${author.slug}-avatar.jpg`);
    await client.createIfNotExists({
      _id,
      _type: "author",
      name: author.name,
      slug: { _type: "slug", current: author.slug },
      role: author.role,
      bio: author.bio,
      avatar: { _type: "image", ...assetRef(avatarAssetId) },
      twitter: author.twitter,
    });
    console.log(`  - ${_id}`);
  }
}

async function migrateArticles() {
  console.log(`\nArticles (${mockArticles.length})`);
  for (const article of mockArticles) {
    const _id = `article-${article.slug}`;
    const heroAssetId = await uploadImage(client, article.hero, `${article.slug}-hero.jpg`);
    const body = await blocksToPortableText(client, article.blocks);

    await client.createIfNotExists({
      _id,
      _type: "article",
      title: article.title,
      slug: { _type: "slug", current: article.slug },
      dek: article.dek,
      section: { _type: "reference", _ref: `section-${article.section}` },
      authors: article.authors.map((slug) => ({
        _type: "reference",
        _ref: `author-${slug}`,
        _key: randomUUID(),
      })),
      publishedAt: new Date(article.date).toISOString(),
      readTime: article.readTime,
      hero: { _type: "image", ...assetRef(heroAssetId), alt: article.heroAlt },
      tags: article.tags,
      premium: article.premium ?? false,
      featured: article.featured ?? false,
      body,
    });
    console.log(`  - ${_id}`);
  }
}

async function migrateSiteSettings() {
  console.log("\nSite settings");
  await client.createIfNotExists({
    _id: "siteSettings",
    _type: "siteSettings",
    title: "PULSE",
    tagline: "Modern news, bold takes. Built for people who'd rather think than scroll.",
    defaultSeo: {
      _type: "seo",
      metaTitle: "PULSE — Modern news, bold takes.",
      metaDescription:
        "PULSE is a young, bold publisher covering tech, culture, science, sports and business.",
    },
    mainNav: [
      { _type: "navLink", _key: randomUUID(), label: "Subscribe", linkType: "external", externalUrl: "/subscription" },
    ],
    footerLinkGroups: [
      {
        _type: "footerLinkGroup",
        _key: randomUUID(),
        heading: "Company",
        links: [
          { _type: "navLink", _key: randomUUID(), label: "About", linkType: "external", externalUrl: "/about" },
          { _type: "navLink", _key: randomUUID(), label: "Contact", linkType: "external", externalUrl: "/contact" },
          { _type: "navLink", _key: randomUUID(), label: "Advertise", linkType: "external", externalUrl: "/advertise" },
          { _type: "navLink", _key: randomUUID(), label: "Subscribe", linkType: "external", externalUrl: "/subscription" },
        ],
      },
      {
        _type: "footerLinkGroup",
        _key: randomUUID(),
        heading: "Legal",
        links: [
          { _type: "navLink", _key: randomUUID(), label: "Privacy", linkType: "external", externalUrl: "/privacy" },
          { _type: "navLink", _key: randomUUID(), label: "Terms", linkType: "external", externalUrl: "/terms" },
          { _type: "navLink", _key: randomUUID(), label: "Cookies", linkType: "external", externalUrl: "/cookies" },
        ],
      },
    ],
    socialLinks: [],
    copyrightText: "",
  });
  console.log("  - siteSettings");
}

async function verify() {
  const [articleCount, authorCount, sectionCount, settingsCount] = await Promise.all([
    client.fetch(`count(*[_type == "article"])`),
    client.fetch(`count(*[_type == "author"])`),
    client.fetch(`count(*[_type == "section"])`),
    client.fetch(`count(*[_id == "siteSettings"])`),
  ]);

  console.log("\nVerification:");
  console.log(`  articles: ${articleCount} (expected ${mockArticles.length})`);
  console.log(`  authors: ${authorCount} (expected ${mockAuthors.length})`);
  console.log(`  sections: ${sectionCount} (expected ${mockSections.length})`);
  console.log(`  siteSettings: ${settingsCount} (expected 1)`);

  const ok =
    articleCount === mockArticles.length &&
    authorCount === mockAuthors.length &&
    sectionCount === mockSections.length &&
    settingsCount === 1;

  if (!ok) {
    console.error("\nVerification failed — document counts do not match.");
    process.exit(1);
  }
  console.log("\nMigration verified.");
}

async function main() {
  cache = await loadCache();
  await migrateSections();
  await migrateAuthors();
  await migrateArticles();
  await migrateSiteSettings();
  await verify();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
