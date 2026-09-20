import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { seoField } from '../fields/seo'
import { formatSlugHook } from '../utilities/formatSlug'
import { triggerRevalidate } from '../hooks/revalidate'

export const Sections: CollectionConfig = {
  slug: 'sections',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'order'],
  },
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 40,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [formatSlugHook('title')] },
    },
    {
      name: 'tagline',
      type: 'textarea',
      required: true,
    },
    {
      name: 'accentColor',
      type: 'text',
      required: true,
      admin: { description: 'A hex color used for section badges and links, e.g. #2563eb.' },
      validate: (value: string | null | undefined) => {
        if (!value || !/^#([0-9A-Fa-f]{6})$/.test(value)) return 'Must be a 6-digit hex color, e.g. #2563eb.'
        return true
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      admin: { description: 'Controls ordering across nav, footer and homepage section blocks (lowest first).' },
    },
    seoField,
  ],
  hooks: {
    afterChange: [
      async ({ doc }) => {
        await triggerRevalidate({ type: 'section', slug: doc.slug })
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await triggerRevalidate({ type: 'section', slug: doc.slug })
      },
    ],
  },
}
