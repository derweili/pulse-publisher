import {UserIcon} from '@sanity/icons/User'
import {defineField, defineType} from 'sanity'
import {isUniqueSlug} from '../lib/isUniqueSlug'

export const author = defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  icon: UserIcon,
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name', maxLength: 60, isUnique: isUniqueSlug},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'avatar',
      title: 'Avatar',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'twitter',
      title: 'Twitter / X handle',
      type: 'string',
      description: 'Handle only, without the @ (e.g. maraokafor).',
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value) return true
          return value.startsWith('@') ? 'Enter the handle without the leading @' : true
        }),
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'seo',
      description: 'Falls back to name/bio when left empty.',
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'role', media: 'avatar'},
  },
})
