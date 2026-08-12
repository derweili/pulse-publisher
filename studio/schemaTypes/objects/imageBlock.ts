import {ImageIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const imageBlock = defineType({
  name: 'imageBlock',
  title: 'Image',
  type: 'image',
  icon: ImageIcon,
  options: {hotspot: true},
  fields: [
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Important for accessibility and SEO.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
  ],
  preview: {
    select: {media: 'asset', title: 'caption', alt: 'alt'},
    prepare({media, title, alt}) {
      return {title: title || alt || 'Image', media}
    },
  },
})
