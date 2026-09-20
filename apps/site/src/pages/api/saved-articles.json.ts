import type { APIContext } from "astro";
import { getArticlesBySlugs } from "../../lib/payload/fetch";

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

  const env = context.locals.runtime.env;
  const articles = await getArticlesBySlugs(env, slugs);

  return new Response(JSON.stringify(articles), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
