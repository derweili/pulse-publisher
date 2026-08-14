import type {
  ContentOptions,
  ElementHandlers,
  HtmlRewriterAdapter,
  HtmlRewriterSession,
  RewriterElement,
  RewriterText,
} from "@monetizationos/proxy";

// @monetizationos/proxy is deliberately platform-agnostic and ships no
// Cloudflare adapter (confirmed: no @monetizationos/cloudflare-style package
// exists on npm). This wraps Cloudflare's real global `HTMLRewriter` to
// satisfy the package's HtmlRewriterAdapter contract.

function wrapElement(element: Element): RewriterElement {
  return {
    get removed() {
      return element.removed;
    },
    get tagName() {
      return element.tagName;
    },
    getAttribute: (name) => element.getAttribute(name),
    hasAttribute: (name) => element.hasAttribute(name),
    setAttribute: (name, value) => void element.setAttribute(name, value),
    removeAttribute: (name) => void element.removeAttribute(name),
    before: (content, options?: ContentOptions) => void element.before(content, options),
    after: (content, options?: ContentOptions) => void element.after(content, options),
    prepend: (content, options?: ContentOptions) => void element.prepend(content, options),
    append: (content, options?: ContentOptions) => void element.append(content, options),
    replace: (content, options?: ContentOptions) => void element.replace(content, options),
    remove: () => void element.remove(),
    // Cloudflare's onEndTag hands back an EndTag object; mOS's contract takes
    // a no-arg callback, so the argument is simply discarded here.
    onEndTag: (callback) => element.onEndTag(() => callback()),
  };
}

function wrapText(text: Text): RewriterText {
  return {
    get text() {
      return text.text;
    },
    get lastInTextNode() {
      return text.lastInTextNode;
    },
    get removed() {
      return text.removed;
    },
    remove: () => void text.remove(),
  };
}

export function createCloudflareHtmlRewriterAdapter(): HtmlRewriterAdapter {
  return {
    capabilities: {
      onEndTag: true,
      // Cloudflare's HTMLRewriter (lol-html) does not support :nth-child()
      // or other sibling-position selectors — see CLAUDE.md's :last-child rule.
      nthChild: false,
    },
    create(): HtmlRewriterSession {
      const rewriter = new HTMLRewriter();
      const session: HtmlRewriterSession = {
        on(selector: string, handlers: ElementHandlers) {
          rewriter.on(selector, {
            element: handlers.element ? (el) => handlers.element?.(wrapElement(el)) : undefined,
            text: handlers.text ? (t) => handlers.text?.(wrapText(t)) : undefined,
          });
          return session;
        },
        transform(response: Response) {
          return rewriter.transform(response);
        },
      };
      return session;
    },
  };
}
