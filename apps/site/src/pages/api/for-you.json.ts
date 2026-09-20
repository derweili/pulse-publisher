import type { APIContext } from "astro";
import { getEmdashClient } from "../../lib/emdash/client";
import { getForYouArticles } from "../../lib/emdash/content";

function parseList(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function GET(context: APIContext) {
  const sections = parseList(context.url.searchParams.get("sections"));
  const tags = parseList(context.url.searchParams.get("tags"));

  if (sections.length === 0 && tags.length === 0) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const client = getEmdashClient(context.locals.runtime.env);
  const articles = await getForYouArticles(client, sections, tags);

  return new Response(JSON.stringify(articles), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
