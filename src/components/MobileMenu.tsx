import { useEffect, useState } from "react";

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
      {open && (
        <div class="mobile-menu-overlay" onClick={() => setOpen(false)}>
          <div class="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div class="mm-head">
              <a href="/" class="mm-logo" onClick={() => setOpen(false)}>
                <span class="mm-mark">P</span>
                <span>PULSE</span>
              </a>
              <button class="mm-close" onClick={() => setOpen(false)} aria-label="Close menu">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <nav class="mm-nav" onClick={() => setOpen(false)}>
              <a href="/" class="mm-link">Home</a>
              {sections.map((s) => (
                <a key={s.slug} href={`/sections/${s.slug}`} class="mm-link">
                  {s.name}
                </a>
              ))}
            </nav>
            <div class="mm-actions">
              <a href="/subscribe" class="mm-subscribe" onClick={() => setOpen(false)}>
                Subscribe to PULSE
              </a>
              <p class="mm-foot">Modern news. Bold takes. No filler.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
