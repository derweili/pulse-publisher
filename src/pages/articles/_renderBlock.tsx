import { type ArticleBlock } from "../../data";

export function renderBlock(b: ArticleBlock) {
  switch (b.type) {
    case "paragraph":
      return <p>{b.text}</p>;
    case "heading":
      return <h2>{b.text}</h2>;
    case "quote":
      return <blockquote>{b.text}</blockquote>;
    case "image":
      return (
        <figure>
          <img src={b.src} alt={b.alt ?? ""} loading="lazy" class="figimg" />
          {b.caption && <figcaption>{b.caption}</figcaption>}
        </figure>
      );
    case "list":
      return (
        <ul class="list">
          {b.items?.map((it) => <li>{it}</li>)}
        </ul>
      );
    case "video":
      return (
        <div class="video-embed">
          <iframe src={b.embedUrl} title="Embedded video" loading="lazy" allowfullscreen></iframe>
        </div>
      );
    default:
      return null;
  }
}
