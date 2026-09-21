import type { APIContext } from "astro";
import { getEmdashClient } from "../../lib/emdash/client";
import { getArticlesBySlugs } from "../../lib/emdash/content";

export async function GET(context: APIContext) {
  const slugsParam = context.url.searchParams.get("slugs") ?? "";
  const slugs = slugsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (slugs.length === 0) {
    return new Response(JSON.stringify([]), {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const client = getEmdashClient(context.locals.runtime.env);
  const articles = await getArticlesBySlugs(client, slugs);

  return new Response(JSON.stringify(articles), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
