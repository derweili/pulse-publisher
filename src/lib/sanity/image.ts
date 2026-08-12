import { createImageUrlBuilder } from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import { sanityClient } from "./client";

const builder = createImageUrlBuilder(sanityClient);

/** Build a responsive derivative URL for any Sanity image reference. */
export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
