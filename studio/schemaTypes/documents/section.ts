import {FolderIcon} from '@sanity/icons/Folder'
import {defineField, defineType} from 'sanity'
import {isUniqueSlug} from '../lib/isUniqueSlug'

export const section = defineType({
  name: 'section',
  title: 'Section',
  type: 'document',
  icon: FolderIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().max(40),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 60, isUnique: isUniqueSlug},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'accentColor',
      title: 'Accent color',
      type: 'string',
      description: 'A hex color used for section badges and links, e.g. #2563eb.',
      validation: (Rule) =>
        Rule.required().regex(/^#([0-9A-Fa-f]{6})$/, {name: 'hex color'}),
    }),
    defineField({
      name: 'order',
      title: 'Display order',
      type: 'number',
      description: 'Controls ordering across nav, footer and homepage section blocks (lowest first).',
      validation: (Rule) => Rule.required().integer(),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      description: 'Falls back to title/tagline when left empty.',
    }),
  ],
  orderings: [
    {
      title: 'Display order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
  preview: {
    select: {title: 'title', subtitle: 'tagline'},
  },
})
