import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SearchIndexEntry } from "../pages/search-index.json";

interface Section {
  slug: string;
  name: string;
}

interface Props {
  sections: Section[];
}

const TRENDING = [
  "AI chips",
  "Night economy",
  "Copenhagen",
  "Nebulae",
  "Rugby",
  "Startups",
  "Concerts",
  "Circuit boards",
];

const KIND_CLASSES: Record<string, string> = {
  article: "bg-primary-soft text-primary",
  author: "bg-premium-gold-soft text-[#7a5c0a]",
  section: "bg-bg-muted text-ink-3",
  "live blog": "bg-error/10 text-error",
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Score a single search term against a piece of text; 0 means no match. */
function scoreTerm(text: string, term: string): number {
  const t = text.toLowerCase();
  const q = term.toLowerCase();
  if (!q) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (new RegExp(`\\b${escapeRegExp(q)}`).test(t)) return 60;
  if (t.includes(q)) return 40;
  return 0;
}

function search(index: SearchIndexEntry[], query: string, limit = 8): SearchIndexEntry[] {
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const scored = index
    .map((entry) => {
      const score = terms.reduce((sum, term) => {
        const titleScore = scoreTerm(entry.title, term);
        const subtitleScore = entry.subtitle ? scoreTerm(entry.subtitle, term) * 0.5 : 0;
        const best = Math.max(titleScore, subtitleScore);
        return best === 0 ? -Infinity : sum + best;
      }, 0);
      return { entry, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((r) => r.entry);
}

export default function SearchTrigger({ sections }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<SearchIndexEntry[] | null>(null);
  const [indexError, setIndexError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open || index !== null) return;
    fetch("/search-index.json")
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data: SearchIndexEntry[]) => setIndex(data))
      .catch(() => setIndexError(true));
  }, [open, index]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const results = useMemo(() => (index ? search(index, query) : []), [index, query]);

  return (
    <>
      <button
        className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-sm font-bold text-ink-2 transition-colors duration-200 hover:border-ink max-[560px]:px-2.5"
        aria-label="Search"
        onClick={() => setOpen(true)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="max-[560px]:hidden">Search</span>
      </button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[300] flex justify-center bg-ink/60 px-4 pt-[10vh] backdrop-blur-xs max-[640px]:pt-0"
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            onClick={() => setOpen(false)}
          >
            <div
              className="flex h-fit max-h-[75vh] w-full max-w-[640px] flex-col overflow-hidden rounded-xl bg-white shadow-xl max-[640px]:h-full max-[640px]:max-h-none max-[640px]:rounded-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-border px-5 py-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" className="shrink-0 text-ink-4">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  ref={inputRef}
                  type="search"
                  className="min-w-0 flex-1 text-base text-ink placeholder:text-ink-4 focus:outline-none"
                  placeholder="Search articles, authors, sections…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search query"
                />
                <button
                  className="shrink-0 rounded-md border border-border px-2 py-1 text-xs font-bold text-ink-4 transition-colors duration-200 hover:border-ink hover:text-ink"
                  onClick={() => setOpen(false)}
                  aria-label="Close search"
                >
                  Esc
                </button>
              </div>
              <div className="overflow-y-auto p-5">
                {query.trim().length === 0 ? (
                  <>
                    <p className="text-xs font-bold tracking-[0.1em] text-ink-4 uppercase">Trending searches</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {TRENDING.map((t) => (
                        <button
                          key={t}
                          className="rounded-full border border-border px-3 py-1.5 text-[13px] font-semibold text-ink-2 transition-colors duration-200 hover:border-ink hover:text-primary"
                          onClick={() => setQuery(t)}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <p className="mt-6 text-xs font-bold tracking-[0.1em] text-ink-4 uppercase">Browse sections</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {sections.map((s) => (
                        <a key={s.slug} href={`/sections/${s.slug}`} className="rounded-full bg-bg-soft px-3 py-1.5 text-[13px] font-semibold text-ink-2 transition-colors duration-200 hover:bg-primary-soft hover:text-primary">
                          {s.name}
                        </a>
                      ))}
                    </div>
                  </>
                ) : indexError ? (
                  <p className="py-6 text-center text-sm text-ink-4">Search is unavailable right now — try again in a moment.</p>
                ) : index === null ? (
                  <p className="py-6 text-center text-sm text-ink-4">Searching…</p>
                ) : results.length === 0 ? (
                  <p className="py-6 text-center text-sm text-ink-4">No results for "{query}".</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {results.map((r, i) => (
                      <a className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-200 hover:bg-bg-soft" href={r.href} key={i}>
                        <span className={`shrink-0 rounded-sm px-2 py-1 text-[10px] font-extrabold tracking-[0.08em] uppercase ${KIND_CLASSES[r.kind.toLowerCase()] ?? "bg-bg-muted text-ink-3"}`}>{r.kind}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-ink">{r.title}</span>
                          {r.subtitle && <span className="block truncate text-xs text-ink-4">{r.subtitle}</span>}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
