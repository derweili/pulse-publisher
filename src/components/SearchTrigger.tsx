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

const KIND_CLASSES: Record<string, string> = {
  article: "bg-primary-soft text-primary",
  author: "bg-premium-gold-soft text-[#7a5c0a]",
  section: "bg-bg-muted text-ink-3",
};

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
                ) : (
                  <div className="flex flex-col gap-1">
                    <p className="pb-3 text-[13px] text-ink-4">
                      Showing placeholder results for "{query}" — search is a UI preview for now.
                    </p>
                    {FAKE_RESULTS.map((r, i) => (
                      <a className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-200 hover:bg-bg-soft" href={r.href} key={i}>
                        <span className={`shrink-0 rounded-sm px-2 py-1 text-[10px] font-extrabold tracking-[0.08em] uppercase ${KIND_CLASSES[r.kind.toLowerCase()] ?? "bg-bg-muted text-ink-3"}`}>{r.kind}</span>
                        <span className="text-sm font-semibold text-ink">{r.title}</span>
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
