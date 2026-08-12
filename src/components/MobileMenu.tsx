import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Section {
  slug: string;
  name: string;
}

interface Props {
  sections: Section[];
}

export default function MobileMenu({ sections }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const btn = document.getElementById("menu-open-btn");
    if (!btn) return;
    const handler = () => setOpen(true);
    btn.addEventListener("click", handler);
    return () => btn.removeEventListener("click", handler);
  }, []);

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
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] flex justify-end bg-ink/60 backdrop-blur-xs"
            onClick={() => setOpen(false)}
          >
            <div
              className="flex h-full w-full max-w-[360px] flex-col gap-8 overflow-y-auto bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
              id="mobile-menu"
            >
              <div className="flex items-center justify-between">
                <a
                  href="/"
                  className="inline-flex items-center gap-2 font-display text-2xl tracking-[0.02em] text-ink"
                  onClick={() => setOpen(false)}
                >
                  <span className="grid size-[30px] place-items-center rounded-sm bg-primary text-[20px] text-white">P</span>
                  <span>PULSE</span>
                </a>
                <button
                  className="grid size-9 place-items-center rounded-full border border-border text-ink-2 transition-colors duration-200 hover:border-ink hover:text-ink"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <nav className="flex flex-col gap-1" onClick={() => setOpen(false)}>
                <a href="/" className="rounded-lg px-3 py-3 text-lg font-bold text-ink-2 transition-colors duration-200 hover:bg-primary-soft hover:text-primary">Home</a>
                {sections.map((s) => (
                  <a key={s.slug} href={`/sections/${s.slug}`} className="rounded-lg px-3 py-3 text-lg font-bold text-ink-2 transition-colors duration-200 hover:bg-primary-soft hover:text-primary">
                    {s.name}
                  </a>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-3">
                <a
                  href="/subscription"
                  className="rounded-full bg-ink px-5 py-3 text-center text-sm font-bold tracking-[0.02em] text-white transition-colors duration-200 hover:bg-primary"
                  onClick={() => setOpen(false)}
                >
                  Subscribe to PULSE
                </a>
                <p className="text-center text-xs text-ink-4">Modern news. Bold takes. No filler.</p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
