import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { seoField } from '../fields/seo'
import { bodyField } from '../fields/richText'
import { formatSlugHook } from '../utilities/formatSlug'
import { triggerRevalidate } from '../hooks/revalidate'

const integerValidate = (value: number | null | undefined) => {
  if (value === undefined || value === null) return true
  return Number.isInteger(value) ? true : 'Must be a whole number.'
}

async function slugFor(req: import('payload').PayloadRequest, collection: 'sections' | 'authors', id: unknown) {
  if (!id) return null
  const resolvedId = typeof id === 'object' && id !== null ? (id as { id: string | number }).id : id
  try {
    const doc = await req.payload.findByID({ collection, id: resolvedId as string | number, depth: 0 })
    return (doc?.slug as string) ?? null
  } catch {
    return null
  }
}

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'section', 'premium', 'featured', 'publishedAt'],
  },
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    drafts: { autosave: { interval: 2000 } },
    maxPerDoc: 25,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'title', type: 'text', required: true, maxLength: 120 },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              hooks: { beforeValidate: [formatSlugHook('title')] },
            },
            {
              name: 'dek',
              type: 'textarea',
              required: true,
              maxLength: 240,
              admin: { description: 'Subtitle shown under the headline. Also used as the default meta description.' },
            },
            { name: 'section', type: 'relationship', relationTo: 'sections', required: true },
            {
              name: 'authors',
              type: 'relationship',
              relationTo: 'authors',
              hasMany: true,
              required: true,
              minRows: 1,
            },
            { name: 'hero', type: 'upload', relationTo: 'media', required: true },
            bodyField('body'),
            {
              name: 'freePreviewBlocks',
              type: 'number',
              defaultValue: 3,
              min: 0,
              validate: integerValidate,
              admin: {
                description:
                  'How many top-level body blocks (paragraphs, headings, images, lists — a whole list counts as one) are visible before the paywall.',
              },
            },
          ],
        },
        {
          label: 'Meta',
          fields: [
            {
              name: 'publishedAt',
              type: 'date',
              required: true,
              defaultValue: () => new Date().toISOString(),
              admin: { date: { pickerAppearance: 'dayAndTime' } },
            },
            {
              name: 'readTime',
              type: 'number',
              required: true,
              min: 1,
              validate: integerValidate,
              admin: { description: 'Roughly word count / 200.' },
            },
            { name: 'tags', type: 'text', hasMany: true },
            {
              name: 'premium',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Shows the PULSE+ banner and gates the article as subscriber content.' },
            },
            {
              name: 'featured',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Surfaces this article in homepage featured placements.' },
            },
            {
              name: 'trendingRank',
              type: 'number',
              min: 1,
              validate: integerValidate,
              admin: {
                description:
                  'Set to 1 (most trending) and up to feature this article in the "Trending now" module, ranked lowest-first. Leave empty to exclude it.',
              },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [seoField],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (doc._status && doc._status !== 'published') return
        const [sectionSlug, authorSlugs] = await Promise.all([
          slugFor(req, 'sections', doc.section),
          Promise.all((doc.authors ?? []).map((a: unknown) => slugFor(req, 'authors', a))),
        ])
        await triggerRevalidate({
          type: 'article',
          slug: doc.slug,
          sectionSlug,
          authorSlugs,
          tags: doc.tags ?? null,
        })
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        const [sectionSlug, authorSlugs] = await Promise.all([
          slugFor(req, 'sections', doc.section),
          Promise.all((doc.authors ?? []).map((a: unknown) => slugFor(req, 'authors', a))),
        ])
        await triggerRevalidate({
          type: 'article',
          slug: doc.slug,
          sectionSlug,
          authorSlugs,
          tags: doc.tags ?? null,
        })
      },
    ],
  },
}
