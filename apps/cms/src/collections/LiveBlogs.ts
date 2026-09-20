import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { seoField } from '../fields/seo'
import { bodyField } from '../fields/richText'
import { formatSlugHook } from '../utilities/formatSlug'
import { triggerRevalidate } from '../hooks/revalidate'

async function sectionSlugFor(req: import('payload').PayloadRequest, id: unknown) {
  if (!id) return null
  const resolvedId = typeof id === 'object' && id !== null ? (id as { id: string | number }).id : id
  try {
    const doc = await req.payload.findByID({ collection: 'sections', id: resolvedId as string | number, depth: 0 })
    return (doc?.slug as string) ?? null
  } catch {
    return null
  }
}

export const LiveBlogs: CollectionConfig = {
  slug: 'live-blogs',
  labels: { singular: 'Live blog', plural: 'Live blogs' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'startedAt'],
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
      admin: { description: 'What this live blog is covering. Also used as the default meta description.' },
    },
    {
      name: 'section',
      type: 'relationship',
      relationTo: 'sections',
      admin: { description: 'Optional — ties this live blog into a section for nav/breadcrumbs.' },
    },
    { name: 'hero', type: 'upload', relationTo: 'media', required: true },
    {
      // Not named "status": with `versions.drafts` enabled, Payload's own
      // draft/published state is stored as `_status`, and Postgres enum
      // type names are derived from `<collection>_<field>` with the
      // underscore prefix stripped — a field literally named `status`
      // collides with that generated `enum_live_blogs_status` type.
      name: 'liveStatus',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'live',
      options: [
        { label: 'Live', value: 'live' },
        { label: 'Ended', value: 'ended' },
      ],
    },
    {
      name: 'startedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'entries',
      type: 'array',
      admin: {
        description: 'Newest update does not need to be first — the site sorts by timestamp automatically.',
      },
      fields: [
        {
          name: 'timestamp',
          type: 'date',
          required: true,
          defaultValue: () => new Date().toISOString(),
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        { name: 'headline', type: 'text' },
        bodyField('body'),
        { name: 'author', type: 'relationship', relationTo: 'authors' },
      ],
    },
    seoField,
  ],
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (doc._status && doc._status !== 'published') return
        await triggerRevalidate({
          type: 'liveBlog',
          slug: doc.slug,
          sectionSlug: await sectionSlugFor(req, doc.section),
        })
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await triggerRevalidate({
          type: 'liveBlog',
          slug: doc.slug,
          sectionSlug: await sectionSlugFor(req, doc.section),
        })
      },
    ],
  },
}
