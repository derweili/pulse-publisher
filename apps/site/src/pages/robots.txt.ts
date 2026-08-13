import type { APIContext } from "astro";

export function GET(context: APIContext) {
  const origin = context.site?.origin ?? context.url.origin;
  const body = `User-agent: *
Allow: /

Sitemap: ${new URL("/sitemap.xml", origin).toString()}
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
