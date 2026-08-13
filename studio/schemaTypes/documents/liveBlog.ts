import {ClockIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'
import {isUniqueSlug} from '../lib/isUniqueSlug'

export const liveBlog = defineType({
  name: 'liveBlog',
  title: 'Live blog',
  type: 'document',
  icon: ClockIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'seo', title: 'SEO'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      options: {source: 'title', maxLength: 96, isUnique: isUniqueSlug},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'dek',
      title: 'Dek (standfirst)',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'What this live blog is covering. Also used as the default meta description.',
      validation: (Rule) => Rule.required().max(240),
    }),
    defineField({
      name: 'section',
      title: 'Section',
      type: 'reference',
      group: 'content',
      to: [{type: 'section'}],
      description: 'Optional — ties this live blog into a section for nav/breadcrumbs.',
    }),
    defineField({
      name: 'hero',
      title: 'Hero image',
      type: 'image',
      group: 'content',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'content',
      options: {list: [
        {title: 'Live', value: 'live'},
        {title: 'Ended', value: 'ended'},
      ]},
      initialValue: 'live',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startedAt',
      title: 'Started at',
      type: 'datetime',
      group: 'content',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'entries',
      title: 'Updates',
      type: 'array',
      group: 'content',
      of: [{type: 'liveBlogEntry'}],
      description: 'Newest update does not need to be first — the site sorts by timestamp automatically.',
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      group: 'seo',
      description: 'Falls back to title/dek/hero when left empty.',
    }),
  ],
  orderings: [
    {
      title: 'Started, new to old',
      name: 'startedAtDesc',
      by: [{field: 'startedAt', direction: 'desc'}],
    },
  ],
  preview: {
    select: {title: 'title', media: 'hero', status: 'status'},
    prepare({title, media, status}) {
      return {
        title,
        subtitle: status === 'live' ? '🔴 Live' : 'Ended',
        media,
      }
    },
  },
})
