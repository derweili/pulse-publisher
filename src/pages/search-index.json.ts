import type { APIContext } from "astro";
import { articlePath, authorPath, sectionPath } from "../lib/paths";
import { getSanityClient } from "../lib/sanity/client";
import { getAllArticles, getAuthors, getSections } from "../lib/sanity/fetch";

export interface SearchIndexEntry {
  kind: "Article" | "Author" | "Section";
  title: string;
  subtitle?: string;
  href: string;
}

export async function GET(context: APIContext) {
  const client = getSanityClient(context.locals.runtime.env);
  const [articles, authors, sections] = await Promise.all([
    getAllArticles(client),
    getAuthors(client),
    getSections(client),
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
  ];

  return new Response(JSON.stringify(entries), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
