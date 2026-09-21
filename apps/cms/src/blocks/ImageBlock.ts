import type { Block } from 'payload'

/** Inline body image — embedded in `articles.body` / `liveBlogs.entries[].body` via BlocksFeature. */
export const ImageBlock: Block = {
  slug: 'imageBlock',
  labels: { singular: 'Image', plural: 'Images' },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional. Alt text comes from the image itself (see the Media library).',
      },
    },
  ],
}
