import {PlayIcon} from '@sanity/icons/Play'
import {defineField, defineType} from 'sanity'

export const videoEmbed = defineType({
  name: 'videoEmbed',
  title: 'Video embed',
  type: 'object',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'url',
      title: 'Embed URL',
      type: 'url',
      description: 'The embeddable iframe URL (e.g. a YouTube/Vimeo embed link), not a regular watch page link.',
      validation: (Rule) => Rule.required().uri({scheme: ['http', 'https'], allowRelative: false}),
    }),
  ],
  preview: {
    select: {subtitle: 'url'},
    prepare({subtitle}) {
      return {title: 'Video embed', subtitle}
    },
  },
})
