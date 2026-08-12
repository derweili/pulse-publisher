import {ShareIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

const PLATFORMS = ['twitter', 'instagram', 'linkedin', 'youtube', 'tiktok', 'facebook'] as const

export const socialLink = defineType({
  name: 'socialLink',
  title: 'Social link',
  type: 'object',
  icon: ShareIcon,
  fields: [
    defineField({
      name: 'platform',
      title: 'Platform',
      type: 'string',
      options: {list: PLATFORMS.map((p) => ({title: p[0].toUpperCase() + p.slice(1), value: p}))},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'URL',
      type: 'url',
      validation: (Rule) =>
        Rule.required().uri({scheme: ['http', 'https'], allowRelative: false}),
    }),
  ],
  preview: {
    select: {title: 'platform', subtitle: 'url'},
  },
})
