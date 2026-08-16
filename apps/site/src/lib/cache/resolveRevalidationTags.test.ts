import { describe, expect, it } from "vitest";
import { resolveRevalidationTags } from "./resolveRevalidationTags";

describe("resolveRevalidationTags", () => {
  it("tags an article change: article, home, section, authors, tags", () => {
    const plan = resolveRevalidationTags({
      type: "article",
      slug: "some-story",
      sectionSlug: "tech",
      authorSlugs: ["mara-okafor", "j-lee"],
      tags: ["ai", "policy"],
    });

    expect(plan).toEqual({
      purgeEverything: false,
      tags: expect.arrayContaining([
        "article:some-story",
        "home",
        "section:tech",
        "author:mara-okafor",
        "author:j-lee",
        "tag:ai",
        "tag:policy",
      ]),
    });
    if (!plan.purgeEverything) expect(plan.tags).toHaveLength(7);
  });

  it("dedupes tags when an article has no extra section/authors/tags", () => {
    const plan = resolveRevalidationTags({ type: "article", slug: "bare-story" });
    expect(plan).toEqual({ purgeEverything: false, tags: ["article:bare-story", "home"] });
  });

  it("falls back to home when an article payload has no slug", () => {
    const plan = resolveRevalidationTags({ type: "article", slug: null });
    expect(plan).toEqual({ purgeEverything: false, tags: ["home"] });
  });

  it("tags a liveBlog change: live, home, and section if present", () => {
    const plan = resolveRevalidationTags({ type: "liveBlog", slug: "election-night", sectionSlug: "politics" });
    expect(plan).toEqual({
      purgeEverything: false,
      tags: ["live:election-night", "home", "section:politics"],
    });
  });

  it("tags a liveBlog change without a section", () => {
    const plan = resolveRevalidationTags({ type: "liveBlog", slug: "election-night" });
    expect(plan).toEqual({ purgeEverything: false, tags: ["live:election-night", "home"] });
  });

  it("tags a section change: section and home", () => {
    const plan = resolveRevalidationTags({ type: "section", slug: "tech" });
    expect(plan).toEqual({ purgeEverything: false, tags: ["section:tech", "home"] });
  });

  it("purges everything for a section change with no slug", () => {
    expect(resolveRevalidationTags({ type: "section", slug: null })).toEqual({ purgeEverything: true });
  });

  it("tags an author change: author only", () => {
    const plan = resolveRevalidationTags({ type: "author", slug: "mara-okafor" });
    expect(plan).toEqual({ purgeEverything: false, tags: ["author:mara-okafor"] });
  });

  it("purges everything for siteSettings — it renders into every page's nav/footer", () => {
    expect(resolveRevalidationTags({ type: "siteSettings" })).toEqual({ purgeEverything: true });
  });

  it("purges everything for an unrecognized document type", () => {
    expect(resolveRevalidationTags({ type: "somethingNew" })).toEqual({ purgeEverything: true });
  });
});
