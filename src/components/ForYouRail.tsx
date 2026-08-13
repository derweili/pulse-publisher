import { useEffect, useState } from "react";
import { articlePath, authorPath, sectionPath } from "../lib/paths";
import { urlFor } from "../lib/sanity/image";
import type { ArticleCardData } from "../lib/sanity/fetch";

interface HistoryEntry {
  section?: string;
  tags?: string[];
}

const STORAGE_KEY = "pulse-reading-history";

function topByFrequency(values: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([v]) => v);
}

export default function ForYouRail() {
  const [articles, setArticles] = useState<ArticleCardData[] | null>(null);

  useEffect(() => {
    let history: HistoryEntry[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      history = Array.isArray(parsed) ? parsed : [];
    } catch {
      history = [];
    }

    if (history.length === 0) {
      setArticles([]);
      return;
    }

    const sections = topByFrequency(history.map((h) => h.section ?? "").filter(Boolean), 2);
    const tags = topByFrequency(history.flatMap((h) => h.tags ?? []), 4);

    if (sections.length === 0 && tags.length === 0) {
      setArticles([]);
      return;
    }

    const params = new URLSearchParams();
    if (sections.length > 0) params.set("sections", sections.join(","));
    if (tags.length > 0) params.set("tags", tags.join(","));

    let cancelled = false;
    fetch(`/api/for-you.json?${params.toString()}`)
      .then((res) => res.json())
      .then((data: ArticleCardData[]) => {
        if (!cancelled) setArticles(data);
      })
      .catch(() => {
        if (!cancelled) setArticles([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // `client:visible` hydrates by observing this component's rendered DOM
  // node, so the initial render (SSR and pre-effect client render) must
  // produce a real element for the observer to watch — returning `null`
  // here would leave the island with no children to observe, and it would
  // never hydrate. Once hydrated, collapsing to `null` for a confirmed-empty
  // result is safe since the observer has already done its job.
  if (articles === null) return <div aria-hidden="true" style={{ minHeight: 1 }} />;
  if (articles.length === 0) return null;

  return (
    <section className="container-page mt-16">
      <div className="section-head">
        <div>
          <span className="eyebrow eyebrow-accent">Just for you</span>
          <h2 className="section-title">Based on what you've read</h2>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-6 max-[960px]:grid-cols-2 max-[560px]:grid-cols-1">
        {articles.slice(0, 4).map((article) => {
          const section = article.section;
          const primaryAuthor = article.authors?.[0];
          return (
            <article
              key={article._id}
              className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-all duration-200 ease-brand hover:-translate-y-1 hover:border-border-strong hover:shadow-lg"
            >
              <a href={articlePath(article.slug)} className="relative block aspect-[16/10] overflow-hidden bg-bg-muted">
                <img
                  src={urlFor(article.hero).width(800).height(500).fit("crop").url()}
                  alt={article.hero.alt ?? ""}
                  loading="lazy"
                  width={800}
                  height={500}
                  className="h-full w-full object-cover transition-transform duration-[600ms] ease-brand group-hover:scale-105"
                />
              </a>
              <div className="flex flex-1 flex-col gap-2.5 px-5 pt-[18px] pb-5">
                {section && (
                  <a
                    href={sectionPath(section.slug)}
                    className="w-fit text-[11px] font-extrabold tracking-[0.1em] uppercase hover:underline"
                    style={{ color: section.accentColor }}
                  >
                    {section.title}
                  </a>
                )}
                <h3 className="text-[19px] leading-[1.2] tracking-[-0.01em]">
                  <a href={articlePath(article.slug)} className="hover:text-primary">
                    {article.title}
                  </a>
                </h3>
                <div className="mt-auto inline-flex flex-wrap items-center gap-2 text-xs font-medium text-ink-4">
                  {primaryAuthor && (
                    <a href={authorPath(primaryAuthor.slug)} className="font-bold text-ink-2 hover:text-primary">
                      {primaryAuthor.name}
                    </a>
                  )}
                  <span className="dot"></span>
                  <span>{article.readTime} min</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
