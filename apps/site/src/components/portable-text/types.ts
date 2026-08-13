import type { ArticleDetail } from "../../lib/sanity/fetch";

export type BodyBlock = ArticleDetail["body"][number];
export type TextBlock = Extract<BodyBlock, { _type: "block" }>;
export type ImageBlockData = Extract<BodyBlock, { _type: "imageBlock" }>;
export type VideoEmbedData = Extract<BodyBlock, { _type: "videoEmbed" }>;

export type RenderItem =
  | { kind: "list"; listItem: "bullet" | "number"; items: TextBlock[] }
  | { kind: "block"; block: TextBlock }
  | { kind: "imageBlock"; block: ImageBlockData }
  | { kind: "videoEmbed"; block: VideoEmbedData };

/**
 * Portable Text represents each list item as its own sibling `block` with a
 * shared `listItem` marker rather than a nested list structure, so
 * consecutive same-type list blocks need to be grouped before rendering.
 */
export function groupBlocks(blocks: BodyBlock[]): RenderItem[] {
  const result: RenderItem[] = [];

  for (const block of blocks) {
    if (block._type === "block" && block.listItem) {
      const last = result[result.length - 1];
      if (last?.kind === "list" && last.listItem === block.listItem) {
        last.items.push(block);
      } else {
        result.push({ kind: "list", listItem: block.listItem, items: [block] });
      }
      continue;
    }

    if (block._type === "block") {
      result.push({ kind: "block", block });
    } else if (block._type === "imageBlock") {
      result.push({ kind: "imageBlock", block });
    } else if (block._type === "videoEmbed") {
      result.push({ kind: "videoEmbed", block });
    }
  }

  return result;
}

const escapeHtml = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Renders a text block's spans + marks (bold/italic/link) to a safe HTML string. */
export function renderInline(block: TextBlock): string {
  const markDefs = block.markDefs ?? [];
  return (block.children ?? [])
    .map((span) => {
      let html = escapeHtml(span.text ?? "");
      for (const mark of span.marks ?? []) {
        if (mark === "strong") {
          html = `<strong>${html}</strong>`;
        } else if (mark === "em") {
          html = `<em>${html}</em>`;
        } else {
          const def = markDefs.find((d) => d._key === mark);
          if (def?._type === "link") {
            const rel = def.newTab ? ' target="_blank" rel="noopener noreferrer"' : "";
            html = `<a href="${escapeHtml(def.href)}"${rel}>${html}</a>`;
          }
        }
      }
      return html;
    })
    .join("");
}
