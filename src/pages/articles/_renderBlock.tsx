import { type ArticleBlock } from "../../data";

export function renderBlock(b: ArticleBlock) {
  switch (b.type) {
    case "paragraph":
      return <p class="my-[1.2em] text-lg leading-[1.7] text-ink-2 max-sm:text-[17px]">{b.text}</p>;
    case "heading":
      return <h2 class="mt-[1.8em] mb-[0.6em] text-2xl tracking-[-0.01em]">{b.text}</h2>;
    case "quote":
      return (
        <blockquote class="my-[1.8em] border-l-4 border-primary pl-6 text-[22px] leading-[1.4] font-semibold text-ink italic max-sm:text-[19px]">
          {b.text}
        </blockquote>
      );
    case "image":
      return (
        <figure class="my-[1.8em]">
          <img src={b.src} alt={b.alt ?? ""} loading="lazy" class="w-full rounded" />
          {b.caption && <figcaption class="mt-2 text-xs text-ink-4">{b.caption}</figcaption>}
        </figure>
      );
    case "list":
      return (
        <ul class="my-[1.4em] list-none pl-0">
          {b.items?.map((it) => (
            <li class="relative mb-2.5 pl-[26px] text-[17px] leading-relaxed text-ink-2 before:absolute before:top-[11px] before:left-0 before:h-0.5 before:w-3.5 before:bg-primary before:content-['']">
              {it}
            </li>
          ))}
        </ul>
      );
    case "video":
      return (
        <div class="relative my-[1.8em] aspect-video overflow-hidden rounded bg-ink">
          <iframe src={b.embedUrl} title="Embedded video" loading="lazy" allowfullscreen class="absolute inset-0 h-full w-full border-0"></iframe>
        </div>
      );
    default:
      return null;
  }
}
