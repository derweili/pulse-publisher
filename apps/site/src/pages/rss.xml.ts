import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { articlePath } from "../lib/paths";
import { getAllArticles, getSiteSettings } from "../lib/payload/fetch";

export async function GET(context: APIContext) {
  const env = context.locals.runtime.env;
  const [articles, settings] = await Promise.all([
    getAllArticles(env),
    getSiteSettings(env),
  ]);

  return rss({
    title: settings.title,
    description: settings.tagline,
    site: context.site ?? context.url.origin,
    items: articles.map((article) => ({
      title: article.title,
      description: article.dek,
      pubDate: new Date(article.publishedAt),
      link: articlePath(article.slug),
      categories: article.section ? [article.section.title] : undefined,
      author: article.authors?.map((a) => a.name).join(", "),
    })),
  });
}
