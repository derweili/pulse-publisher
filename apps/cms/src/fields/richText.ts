import {
  BlocksFeature,
  HeadingFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { Field } from 'payload'
import { ImageBlock } from '../blocks/ImageBlock'
import { VideoEmbedBlock } from '../blocks/VideoEmbedBlock'

/**
 * Body copy for articles and live-blog entries. Restricted to the same
 * surface the old Sanity `blockContent` object exposed — paragraphs, one
 * heading level, blockquote, bullet/numbered lists, bold/italic, links
 * (with the built-in "open in new tab" field) — plus the two custom blocks
 * that replace `imageBlock`/`videoEmbed`.
 */
export const bodyField = (name = 'body'): Field => ({
  name,
  type: 'richText',
  required: true,
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures.filter((feature) => feature.key !== 'heading'),
      HeadingFeature({ enabledHeadingSizes: ['h2'] }),
      BlocksFeature({ blocks: [ImageBlock, VideoEmbedBlock] }),
    ],
  }),
})
