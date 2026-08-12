import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

const FAKE_RESULTS = [
  { kind: "Article", title: "The New AI Chips Are Rewriting the Rules", href: "/articles/the-new-ai-chips-are-rewriting-the-rules" },
  { kind: "Author", title: "Mara Okafor — Senior Tech Reporter", href: "/authors/mara-okafor" },
  { kind: "Section", title: "Tech — The machines are getting smarter", href: "/sections/tech" },
  { kind: "Article", title: "Circuit Boards and the Craft Revival", href: "/articles/circuit-boards-and-the-craft-revival" },
  { kind: "Article", title: "The Grid Is Alive", href: "/articles/the-grid-is-alive" },
];

export default function SearchTrigger({ sections }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

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

  return (
    <>
      <button
        class="search-trigger"
        aria-label="Search"
        onClick={() => setOpen(true)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span class="search-label">Search</span>
      </button>
      {open &&
        createPortal(
          <div class="search-overlay" role="dialog" aria-modal="true" aria-label="Search" onClick={() => setOpen(false)}>
            <div class="search-panel" onClick={(e) => e.stopPropagation()}>
              <div class="search-top">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" class="search-big-icon">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <input
                  ref={inputRef}
                  type="search"
                  placeholder="Search articles, authors, sections…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search query"
                />
                <button class="search-close" onClick={() => setOpen(false)} aria-label="Close search">
                  Esc
                </button>
              </div>
              <div class="search-body">
                {query.trim().length === 0 ? (
                  <>
                    <p class="search-hint">Trending searches</p>
                    <div class="trend-chips">
                      {TRENDING.map((t) => (
                        <button key={t} class="trend-chip" onClick={() => setQuery(t)}>
                          {t}
                        </button>
                      ))}
                    </div>
                    <p class="search-hint second">Browse sections</p>
                    <div class="section-chips">
                      {sections.map((s) => (
                        <a key={s.slug} href={`/sections/${s.slug}`} class="section-chip">
                          {s.name}
                        </a>
                      ))}
                    </div>
                  </>
                ) : (
                  <div class="search-results">
                    <p class="search-hint">
                      Showing placeholder results for “{query}” — search is a UI preview for now.
                    </p>
                    {FAKE_RESULTS.map((r, i) => (
                      <a class="search-result" href={r.href} key={i}>
                        <span class={`res-pill pill-${r.kind.toLowerCase()}`}>{r.kind}</span>
                        <span class="res-title">{r.title}</span>
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
