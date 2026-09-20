import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'

/**
 * Image sizes are named for the exact placements apps/site renders — see
 * `apps/site/src/lib/payload/image.ts`, which just picks `sizes.<name>.url`
 * off whatever this collection returns rather than building URLs itself
 * (unlike the old Sanity setup's dynamic `urlFor()` builder). `position:
 * "centre"` plus each upload's optional focal point mirrors Sanity's
 * hotspot-driven crop.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    // Public: <img> tags hit these URLs directly with no Authorization
    // header, same as Sanity's public image CDN was.
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description: 'Required for accessibility and used as the image\'s alt text everywhere it appears.',
      },
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    focalPoint: true,
    imageSizes: [
      { name: 'avatarSm', width: 56, height: 56, position: 'centre' },
      { name: 'avatarMd', width: 128, height: 128, position: 'centre' },
      { name: 'avatarLg', width: 240, height: 240, position: 'centre' },
      { name: 'thumbSquare', width: 200, height: 200, position: 'centre' },
      { name: 'thumbList', width: 240, height: 160, position: 'centre' },
      { name: 'thumbRail', width: 160, height: 160, position: 'centre' },
      { name: 'thumbRelated', width: 160, height: 120, position: 'centre' },
      { name: 'card', width: 800, height: 500, position: 'centre' },
      { name: 'cardWide', width: 1200, height: 750, position: 'centre' },
      { name: 'hero', width: 1600, height: 900, position: 'centre' },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
      { name: 'inline', width: 1200, height: 750, position: 'centre' },
      { name: 'full', width: 2400 },
    ],
  },
}
