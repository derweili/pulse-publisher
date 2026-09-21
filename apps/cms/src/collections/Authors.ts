import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { seoField } from '../fields/seo'
import { formatSlugHook } from '../utilities/formatSlug'
import { triggerRevalidate } from '../hooks/revalidate'

export const Authors: CollectionConfig = {
  slug: 'authors',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'role'],
  },
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [formatSlugHook('name')] },
    },
    {
      name: 'role',
      type: 'text',
      required: true,
    },
    {
      name: 'bio',
      type: 'textarea',
      required: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'twitter',
      type: 'text',
      admin: { description: 'Handle only, without the @ (e.g. maraokafor).' },
      validate: (value: string | null | undefined) => {
        if (!value) return true
        return value.startsWith('@') ? 'Enter the handle without the leading @' : true
      },
    },
    seoField,
  ],
  hooks: {
    afterChange: [
      async ({ doc }) => {
        await triggerRevalidate({ type: 'author', slug: doc.slug })
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        await triggerRevalidate({ type: 'author', slug: doc.slug })
      },
    ],
  },
}
