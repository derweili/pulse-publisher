import type { APIContext } from "astro";
import { articlePath, authorPath, liveBlogPath, sectionPath } from "../lib/paths";
import { getAllArticles, getAllLiveBlogs, getAuthors, getSections } from "../lib/payload/fetch";

// A hand-written endpoint rather than @astrojs/sitemap: that integration
// enumerates routes at build time from getStaticPaths, which doesn't apply
// here since articles/authors/sections resolve per-request (SSR). This
// queries Payload directly for the same slugs instead.

interface UrlEntry {
  loc: string;
  lastmod?: string;
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&apos;";
    }
  });
}

export async function GET(context: APIContext) {
  const env = context.locals.runtime.env;
  const [articles, authors, sections, liveBlogs] = await Promise.all([
    getAllArticles(env),
    getAuthors(env),
    getSections(env),
    getAllLiveBlogs(env),
  ]);

  const origin = context.site?.origin ?? context.url.origin;
  const urls: UrlEntry[] = [
    { loc: "/" },
    { loc: "/subscription" },
    { loc: "/about" },
    { loc: "/standards" },
    { loc: "/corrections" },
    { loc: "/contact" },
    ...sections.map((s) => ({ loc: sectionPath(s.slug) })),
    ...authors.map((a) => ({ loc: authorPath(a.slug) })),
    ...articles.map((a) => ({ loc: articlePath(a.slug), lastmod: a.publishedAt })),
    ...liveBlogs.map((lb) => ({ loc: liveBlogPath(lb.slug), lastmod: lb.startedAt })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(new URL(u.loc, origin).toString())}</loc>${
      u.lastmod ? `\n    <lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ""
    }
  </url>`
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
