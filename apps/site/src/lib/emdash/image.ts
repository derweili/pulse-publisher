// Drop-in replacement for `@sanity/image-url`'s chainable builder API
// (`urlFor(img).width(w).height(h).fit("crop").url()`), used unchanged by
// every component that rendered a Sanity image. Kept as a compatibility shim
// so those call sites needed no changes for the CMS swap.
//
// Unlike Sanity's image API (which serves resized derivatives from its own
// CDN by construction), EmDash media URLs point at pulse-cms's own image
// route. This shim currently returns the ORIGINAL image unchanged — it does
// not resize anything yet. To wire up real on-the-fly resizing:
//
//   1. Put pulse-cms's custom domain behind Cloudflare (orange-clouded DNS).
//   2. Enable Image Resizing for that zone (Cloudflare dashboard → Images).
//   3. Change `.url()` below to build a
//      `https://<cms-domain>/cdn-cgi/image/width=W,height=H,fit=cover/<original-url>`
//      URL instead of returning `image.src` directly.
//
// See docs/emdash-migration-plan.md's "Images" section — this is called out
// there as a known, deliberate simplification rather than an oversight.
// Accepts any object with at least a `src` — both `EmdashImage` (field
// values) and `ImageBlockData` (portable-text image blocks) satisfy this,
// without EmdashImage's stricter `alt: string | null` (no `undefined`).
export function urlFor(image: { src: string } | null | undefined) {
  const builder = {
    width(_w: number) {
      return builder;
    },
    height(_h: number) {
      return builder;
    },
    fit(_mode: "crop" | "clip" | "fill" | "max" | "min" | "scale") {
      return builder;
    },
    auto(_mode: "format") {
      return builder;
    },
    url() {
      return image?.src ?? "";
    },
  };
  return builder;
}
