import type { Media, MediaSizes } from "./types";

export type MediaSize = keyof MediaSizes;

/**
 * Payload pre-generates every size apps/site needs at upload time (see
 * apps/cms/src/collections/Media.ts) and returns ready-made URLs in the
 * REST response — unlike the old Sanity setup, there's no client-side URL
 * builder constructing derivatives on the fly. This just picks the right
 * one, falling back to the original when a size wasn't generated (e.g. the
 * source image was smaller than that size).
 */
export function imageUrl(media: Media | null | undefined, size?: MediaSize): string {
  if (!media) return "";
  if (size) {
    const variant = media.sizes?.[size];
    if (variant?.url) return variant.url;
  }
  return media.url ?? "";
}
