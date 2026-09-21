import type { Block } from 'payload'

/** Inline body video embed — embedded in `articles.body` / `liveBlogs.entries[].body` via BlocksFeature. */
export const VideoEmbedBlock: Block = {
  slug: 'videoEmbed',
  labels: { singular: 'Video embed', plural: 'Video embeds' },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: {
        description: 'The embeddable iframe URL (e.g. a YouTube/Vimeo embed link), not a regular watch page link.',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return 'Required.'
        try {
          const parsed = new URL(value)
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return 'Must be an http(s) URL.'
          }
        } catch {
          return 'Must be a valid URL.'
        }
        return true
      },
    },
  ],
}
