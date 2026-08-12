import { createClient } from "@sanity/client";

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || "production";
const apiVersion = import.meta.env.PUBLIC_SANITY_API_VERSION || "2025-02-01";
const token = import.meta.env.SANITY_API_READ_TOKEN;

if (!projectId) {
  throw new Error(
    "Missing PUBLIC_SANITY_PROJECT_ID. Copy .env.example to .env and fill it in."
  );
}

// The site is fully static: every read happens once, at build time, inside
// getStaticPaths/frontmatter. `useCdn: false` + a token gets us fresh,
// non-cached reads from a private dataset at build time; there's no
// runtime/browser fetching to optimize for a CDN here.
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
  perspective: "published",
});
