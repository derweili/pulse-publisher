import { describe, expect, it } from "vitest";
import { anonymize } from "./anonymize";

describe("anonymize", () => {
  it("strips Cookie and Authorization headers", () => {
    const request = new Request("https://www.pulse.today/rss.xml", {
      headers: { Cookie: "__session=abc", Authorization: "Bearer xyz", Accept: "text/xml" },
    });

    const result = anonymize(request);

    expect(result.headers.has("Cookie")).toBe(false);
    expect(result.headers.has("Authorization")).toBe(false);
    expect(result.headers.get("Accept")).toBe("text/xml");
  });

  it("strips utm_* query params", () => {
    const request = new Request("https://www.pulse.today/sitemap.xml?utm_source=newsletter&utm_medium=email");

    const result = anonymize(request);

    const url = new URL(result.url);
    expect(url.searchParams.has("utm_source")).toBe(false);
    expect(url.searchParams.has("utm_medium")).toBe(false);
  });

  it("strips fbclid and gclid query params", () => {
    const request = new Request("https://www.pulse.today/search-index.json?fbclid=abc&gclid=def");

    const result = anonymize(request);

    const url = new URL(result.url);
    expect(url.searchParams.has("fbclid")).toBe(false);
    expect(url.searchParams.has("gclid")).toBe(false);
  });

  it("preserves the path and all other query params exactly", () => {
    const request = new Request("https://www.pulse.today/sections/tech?page=2&sort=newest&utm_source=x");

    const result = anonymize(request);

    const url = new URL(result.url);
    expect(url.pathname).toBe("/sections/tech");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("sort")).toBe("newest");
    expect(url.searchParams.has("utm_source")).toBe(false);
  });

  it("preserves the request method", () => {
    const request = new Request("https://www.pulse.today/robots.txt", { method: "GET" });

    const result = anonymize(request);

    expect(result.method).toBe("GET");
  });
});
