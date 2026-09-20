import { describe, expect, it } from "vitest";
import { resolveRevalidationTags } from "./resolveRevalidationTags";

describe("resolveRevalidationTags", () => {
  it("tags an article change: article and home", () => {
    const plan = resolveRevalidationTags({ collection: "articles", slug: "some-story" });
    expect(plan).toEqual({ purgeEverything: false, tags: ["article:some-story", "home"] });
  });

  it("falls back to home when an article payload has no slug", () => {
    const plan = resolveRevalidationTags({ collection: "articles", slug: null });
    expect(plan).toEqual({ purgeEverything: false, tags: ["home"] });
  });

  it("tags a live_blogs change: live and home", () => {
    const plan = resolveRevalidationTags({ collection: "live_blogs", slug: "election-night" });
    expect(plan).toEqual({ purgeEverything: false, tags: ["live:election-night", "home"] });
  });

  it("falls back to home when a live_blogs payload has no slug", () => {
    const plan = resolveRevalidationTags({ collection: "live_blogs", slug: null });
    expect(plan).toEqual({ purgeEverything: false, tags: ["home"] });
  });

  it("tags a live_blog_entries change via the resolved parent slug", () => {
    const plan = resolveRevalidationTags({ collection: "live_blog_entries", parentSlug: "election-night" });
    expect(plan).toEqual({ purgeEverything: false, tags: ["live:election-night", "home"] });
  });

  it("purges everything for a live_blog_entries change when the parent slug couldn't be resolved", () => {
    expect(resolveRevalidationTags({ collection: "live_blog_entries" })).toEqual({ purgeEverything: true });
  });

  it("purges everything for a sections change — it renders into nav/footer/listings", () => {
    expect(resolveRevalidationTags({ collection: "sections", slug: "tech" })).toEqual({ purgeEverything: true });
  });

  it("purges everything for an authors change", () => {
    expect(resolveRevalidationTags({ collection: "authors", slug: "mara-okafor" })).toEqual({
      purgeEverything: true,
    });
  });

  it("purges everything for site_extras — it renders into every page's nav/footer/banner", () => {
    expect(resolveRevalidationTags({ collection: "site_extras" })).toEqual({ purgeEverything: true });
  });

  it("purges everything for an unrecognized collection", () => {
    expect(resolveRevalidationTags({ collection: "somethingNew" })).toEqual({ purgeEverything: true });
  });
});
