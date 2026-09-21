import type { LexicalNode } from "../payload/types";

// Lexical's text-node format bitmask (stable across Lexical versions).
const IS_BOLD = 1;
const IS_ITALIC = 2;

const escapeHtml = (str: string) =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Renders a paragraph/heading/quote/list-item's inline children (text + link nodes) to safe HTML. */
export function renderInline(nodes: LexicalNode[] | undefined): string {
  return (nodes ?? []).map(renderInlineNode).join("");
}

function renderInlineNode(node: LexicalNode): string {
  if (node.type === "text") {
    const text = escapeHtml(String(node.text ?? ""));
    const format = Number(node.format ?? 0);
    let html = text;
    if (format & IS_BOLD) html = `<strong>${html}</strong>`;
    if (format & IS_ITALIC) html = `<em>${html}</em>`;
    return html;
  }
  if (node.type === "link") {
    const fields = (node.fields ?? node) as { url?: string; newTab?: boolean };
    const href = escapeHtml(String(fields.url ?? "#"));
    const rel = fields.newTab ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${href}"${rel}>${renderInline(node.children as LexicalNode[] | undefined)}</a>`;
  }
  // Any inline node type this renderer doesn't know about (e.g. a future
  // Lexical feature) — render its text content if it has one, else nothing,
  // rather than throwing.
  if (Array.isArray(node.children)) return renderInline(node.children as LexicalNode[]);
  return "";
}

/** Renders a top-level `list` node (and any nested lists inside its items) to a full `<ul>`/`<ol>` HTML string. */
export function renderListNode(node: LexicalNode, dataMosBlock?: number): string {
  const tag = node.listType === "number" ? "ol" : "ul";
  const items = (node.children as LexicalNode[] | undefined) ?? [];
  const attr = dataMosBlock !== undefined ? ` data-mos-block="${dataMosBlock}"` : "";
  const liClass =
    "relative mb-2.5 pl-[26px] text-[calc(17px*var(--reading-scale,1))] leading-relaxed text-ink-2 before:absolute before:top-[11px] before:left-0 before:h-0.5 before:w-3.5 before:bg-primary before:content-['']";
  const listItems = items
    .map((item) => {
      const children = (item.children as LexicalNode[] | undefined) ?? [];
      const nestedList = children.find((c) => c.type === "list");
      const inlineChildren = children.filter((c) => c.type !== "list");
      const body = renderInline(inlineChildren) + (nestedList ? renderListNode(nestedList) : "");
      return `<li class="${liClass}">${body}</li>`;
    })
    .join("");
  return `<${tag} class="my-[1.4em] list-none pl-0"${attr}>${listItems}</${tag}>`;
}
