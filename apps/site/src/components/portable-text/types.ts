import type { ArticleDetail } from "../../lib/emdash/content";

export type BodyBlock = ArticleDetail["body"][number];
export type TextBlock = Extract<BodyBlock, { _type: "block" }>;
export type ImageBlockData = Extract<BodyBlock, { _type: "imageBlock" }>;
export type VideoEmbedData = Extract<BodyBlock, { _type: "videoEmbed" }>;

export type RenderItem =
  | { kind: "list"; listItem: "bullet" | "number"; items: Array<{ block: TextBlock; index: number }> }
  | { kind: "block"; block: TextBlock; index: number }
  | { kind: "imageBlock"; block: ImageBlockData; index: number }
  | { kind: "videoEmbed"; block: VideoEmbedData; index: number };

/**
 * Portable Text represents each list item as its own sibling `block` with a
 * shared `listItem` marker rather than a nested list structure, so
 * consecutive same-type list blocks need to be grouped before rendering.
 *
 * `startIndex` lets callers render a slice of `article.body` (e.g. split
 * around the paywall/ad cut) while keeping `data-mos-block` indices aligned
 * to the block's position in the original, unsliced array.
 */
export function groupBlocks(blocks: BodyBlock[], startIndex = 0): RenderItem[] {
  const result: RenderItem[] = [];

  blocks.forEach((block, i) => {
    const index = startIndex + i;

    if (block._type === "block" && block.listItem) {
      const last = result[result.length - 1];
      if (last?.kind === "list" && last.listItem === block.listItem) {
        last.items.push({ block, index });
      } else {
        result.push({ kind: "list", listItem: block.listItem, items: [{ block, index }] });
      }
      return;
    }

    if (block._type === "block") {
      result.push({ kind: "block", block, index });
    } else if (block._type === "imageBlock") {
      result.push({ kind: "imageBlock", block, index });
    } else if (block._type === "videoEmbed") {
      result.push({ kind: "videoEmbed", block, index });
    }
  });

  return result;
}

/**
 * If `index` lands in the middle of a run of consecutive same-type list
 * items, `groupBlocks` would render that run as two separate `<ul>`/`<ol>`
 * elements on either side of the cut — valid HTML, but a visibly broken
 * list. Moves `index` forward to the end of the run so a slice boundary
 * never splits a list. Never moves it backward past what was requested.
 */
export function snapToListBoundary(blocks: BodyBlock[], index: number): number {
  const isListItem = (b: BodyBlock) => b._type === "block" && !!b.listItem;
  const prev = blocks[index - 1];
  if (!prev || !isListItem(prev)) return index;

  const runType = (prev as TextBlock).listItem;
  let i = index;
  while (i < blocks.length && blocks[i]._type === "block" && (blocks[i] as TextBlock).listItem === runType) {
    i++;
  }
  return i;
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
