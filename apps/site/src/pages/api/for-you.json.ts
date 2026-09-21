import type { APIContext } from "astro";
import { getForYouArticles } from "../../lib/payload/fetch";

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

  const env = context.locals.runtime.env;
  const articles = await getForYouArticles(env, sections, tags);

  return new Response(JSON.stringify(articles), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
