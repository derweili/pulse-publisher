import { useEffect, useState, useSyncExternalStore } from "react";
import { $clerkStore, $userStore } from "@clerk/astro/client";
import { articlePath, authorPath, sectionPath } from "../lib/paths";
import { imageUrl } from "../lib/payload/image";
import type { ArticleCardData } from "../lib/payload/fetch";

function useNanostore<T>(store: { get: () => T; subscribe: (cb: () => void) => () => void }): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

const METADATA_KEY = "savedArticleSlugs";

function getSavedSlugs(user: ReturnType<typeof $userStore.get>): string[] {
  const saved = (user?.unsafeMetadata as Record<string, unknown> | undefined)?.[METADATA_KEY];
  return Array.isArray(saved) ? (saved as string[]) : [];
}

function SavedArticlesSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-6 max-[960px]:grid-cols-2 max-sm:grid-cols-1" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse flex-col overflow-hidden rounded-lg border border-border bg-surface"
        >
          <div className="aspect-[16/10] bg-bg-muted" />
          <div className="flex flex-1 flex-col gap-2.5 px-5 pt-[18px] pb-5">
            <div className="h-[11px] w-1/3 rounded bg-bg-muted" />
            <div className="h-[23px] w-full rounded bg-bg-muted" />
            <div className="h-[23px] w-2/3 rounded bg-bg-muted" />
            <div className="mt-auto h-3 w-1/2 rounded bg-bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SavedArticles() {
  const user = useNanostore($userStore);
  const clerk = useNanostore($clerkStore);
  const [articles, setArticles] = useState<ArticleCardData[] | null>(null);

  const slugs = user === null || user === undefined ? [] : getSavedSlugs(user);
  const slugsKey = slugs.join(",");

  useEffect(() => {
    if (user === undefined) return; // Clerk hasn't loaded yet
    if (!user || slugs.length === 0) {
      setArticles([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/saved-articles.json?slugs=${encodeURIComponent(slugsKey)}`)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, slugsKey]);

  if (user === undefined || (user && articles === null)) {
    return <SavedArticlesSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-ink-3">Sign in to save articles and read them later on any device.</p>
        <button
          type="button"
          className="rounded-full bg-ink px-5 py-2.5 text-[13px] font-bold text-white transition-colors duration-200 hover:bg-primary"
          onClick={() => clerk?.openSignIn()}
        >
          Sign in
        </button>
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center">
        <p className="text-sm text-ink-3">You haven't saved anything yet.</p>
        <p className="text-sm text-ink-4">Tap the bookmark icon on any article to add it here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6 max-[960px]:grid-cols-2 max-sm:grid-cols-1">
      {articles.map((article) => {
        const section = article.section;
        const primaryAuthor = article.authors?.[0];
        return (
          <article
            key={article.id}
            className="group flex flex-col overflow-hidden rounded-lg border border-border bg-surface transition-all duration-200 ease-brand hover:-translate-y-1 hover:border-border-strong hover:shadow-lg"
            data-mos="article-card"
            data-premium={article.premium ? "true" : "false"}
          >
            <a href={articlePath(article.slug)} className="relative block aspect-[16/10] overflow-hidden bg-bg-muted">
              <img
                src={imageUrl(article.hero, "card")}
                alt={article.hero.alt ?? ""}
                loading="lazy"
                width={800}
                height={500}
                className="h-full w-full object-cover transition-transform duration-[600ms] ease-brand group-hover:scale-105"
              />
              {article.premium && (
                <span
                  className="absolute top-3 right-3 rounded-[5px] bg-premium-gold px-[9px] py-[5px] text-[10px] font-extrabold tracking-[0.08em] text-[#2a1d00] uppercase"
                  data-mos="premium-badge"
                >
                  Premium
                </span>
              )}
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
  );
}
