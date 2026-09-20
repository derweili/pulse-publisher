import type { APIContext } from "astro";
import { articlePath, authorPath, liveBlogPath, sectionPath } from "../lib/paths";
import { getEmdashClient } from "../lib/emdash/client";
import { getAllArticles, getAllLiveBlogs, getAuthors, getSections } from "../lib/emdash/content";

export interface SearchIndexEntry {
  kind: "Article" | "Author" | "Section" | "Live blog";
  title: string;
  subtitle?: string;
  href: string;
}

export async function GET(context: APIContext) {
  const client = getEmdashClient(context.locals.runtime.env);
  const [articles, authors, sections, liveBlogs] = await Promise.all([
    getAllArticles(client),
    getAuthors(client),
    getSections(client),
    getAllLiveBlogs(client),
  ]);

  const entries: SearchIndexEntry[] = [
    ...articles.map((a): SearchIndexEntry => ({
      kind: "Article",
      title: a.title,
      subtitle: a.section?.title,
      href: articlePath(a.slug),
    })),
    ...authors.map((a): SearchIndexEntry => ({
      kind: "Author",
      title: a.name,
      subtitle: a.role,
      href: authorPath(a.slug),
    })),
    ...sections.map((s): SearchIndexEntry => ({
      kind: "Section",
      title: s.title,
      subtitle: s.tagline,
      href: sectionPath(s.slug),
    })),
    ...liveBlogs.map((lb): SearchIndexEntry => ({
      kind: "Live blog",
      title: lb.title,
      subtitle: lb.dek,
      href: liveBlogPath(lb.slug),
    })),
  ];

  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
