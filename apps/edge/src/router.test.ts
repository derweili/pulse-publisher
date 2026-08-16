import { describe, expect, it, vi } from "vitest";
import { routeRequest } from "./router";
import type { Env } from "./env";

function makeEnv(fetchImpl: (request: Request) => Promise<Response>): Env {
  return {
    SITE: { fetch: fetchImpl } as unknown as Env["SITE"],
    MOS_SECRET_KEY: "sk_test_placeholder",
    MOS_SURFACE_SLUG: "web",
    MOS_HOST: "https://api.monetizationos.com",
    ORIGIN_URL: "https://www.pulse.today",
  };
}

describe("routeRequest", () => {
  it("group 1: forwards /api/* verbatim, cookies intact", async () => {
    const fetchImpl = vi.fn(async (request: Request) => {
      expect(request.headers.get("Cookie")).toBe("__session=abc");
      return new Response("ok");
    });
    const env = makeEnv(fetchImpl);
    const request = new Request("https://www.pulse.today/api/for-you.json", {
      headers: { Cookie: "__session=abc" },
    });

    const result = routeRequest(request, env);

    expect(result).not.toBeNull();
    await result;
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    // Verbatim: the same Request instance, not a rebuilt/anonymized one.
    expect(fetchImpl.mock.calls[0][0]).toBe(request);
  });

  it("group 2: forwards public static/feed paths anonymized, cookies stripped", async () => {
    const fetchImpl = vi.fn(async (request: Request) => {
      expect(request.headers.has("Cookie")).toBe(false);
      return new Response("ok");
    });
    const env = makeEnv(fetchImpl);

    for (const path of [
      "/_astro/chunk.js",
      "/favicon.svg",
      "/robots.txt",
      "/rss.xml",
      "/sitemap.xml",
      "/search-index.json",
    ]) {
      const request = new Request(`https://www.pulse.today${path}`, {
        headers: { Cookie: "__session=abc" },
      });
      const result = routeRequest(request, env);
      expect(result, `expected ${path} to match group 2`).not.toBeNull();
      await result;
    }
    expect(fetchImpl).toHaveBeenCalledTimes(6);
  });

  it("group 3: HTML paths fall through (returns null)", () => {
    const env = makeEnv(async () => new Response("unused"));

    for (const path of ["/", "/articles/some-slug", "/sections/tech", "/live/some-slug", "/saved"]) {
      const request = new Request(`https://www.pulse.today${path}`);
      expect(routeRequest(request, env), `expected ${path} to fall through`).toBeNull();
    }
  });

  it("ordering constraint: /mos-endpoints/* never matches group 1 or 2", () => {
    const env = makeEnv(async () => new Response("unused"));
    const request = new Request("https://www.pulse.today/mos-endpoints/offer-redemptions");

    expect(routeRequest(request, env)).toBeNull();
  });
});
