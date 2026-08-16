import { afterEach, describe, expect, it, vi } from "vitest";
import { siteFetch } from "./siteFetch";
import type { Env } from "./env";

function makeEnv(overrides: Partial<Env> = {}, fetchImpl?: (request: Request) => Promise<Response>): Env {
  return {
    SITE: { fetch: fetchImpl ?? vi.fn(async () => new Response("site")) } as unknown as Env["SITE"],
    MOS_SECRET_KEY: "sk_test_placeholder",
    MOS_SURFACE_SLUG: "web",
    MOS_HOST: "https://api.monetizationos.com",
    ORIGIN_URL: "https://www.pulse.today",
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("siteFetch", () => {
  it("uses the SITE service binding when SITE_DEV_ORIGIN is unset", async () => {
    const siteFetchImpl = vi.fn(async () => new Response("from binding"));
    const env = makeEnv({}, siteFetchImpl);
    const request = new Request("https://www.pulse.today/articles/some-slug");

    const response = await siteFetch(request, env);

    expect(siteFetchImpl).toHaveBeenCalledTimes(1);
    expect(siteFetchImpl).toHaveBeenCalledWith(request);
    expect(await response.text()).toBe("from binding");
  });

  it("rewrites to SITE_DEV_ORIGIN and uses global fetch when set", async () => {
    const globalFetch = vi.fn(async (_request: Request) => new Response("from dev origin"));
    vi.stubGlobal("fetch", globalFetch);
    const siteFetchImpl = vi.fn(async () => new Response("should not be called"));
    const env = makeEnv({ SITE_DEV_ORIGIN: "http://localhost:4321" }, siteFetchImpl);
    const request = new Request("https://www.pulse.today/sections/tech?page=2");

    await siteFetch(request, env);

    expect(siteFetchImpl).not.toHaveBeenCalled();
    expect(globalFetch).toHaveBeenCalledTimes(1);
    const calledRequest = globalFetch.mock.calls[0][0];
    const url = new URL(calledRequest.url);
    expect(url.origin).toBe("http://localhost:4321");
    expect(url.pathname).toBe("/sections/tech");
    expect(url.searchParams.get("page")).toBe("2");
  });
});
