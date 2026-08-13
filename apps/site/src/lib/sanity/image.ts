import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";

// Image URL building is pure string construction (no data fetching, no
// token needed), so it can use the build-time-inlined PUBLIC_ vars directly
// instead of the per-request Sanity client.
const builder = createImageUrlBuilder({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || "production",
});

/** Build a responsive derivative URL for any Sanity image reference. */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
