import {ClockIcon} from '@sanity/icons/Clock'
import {defineField, defineType} from 'sanity'

export const liveBlogEntry = defineType({
  name: 'liveBlogEntry',
  title: 'Update',
  type: 'object',
  icon: ClockIcon,
  fields: [
    defineField({
      name: 'timestamp',
      title: 'Posted at',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      description: 'Optional short headline for this update.',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'author',
      title: 'Posted by',
      type: 'reference',
      to: [{type: 'author'}],
    }),
  ],
  preview: {
    select: {timestamp: 'timestamp', headline: 'headline', body: 'body'},
    prepare({timestamp, headline, body}) {
      const firstBlock = Array.isArray(body) ? body.find((b: {_type?: string}) => b._type === 'block') : undefined
      const firstSpan = firstBlock?.children?.find((c: {_type?: string}) => c._type === 'span')
      const fallback = firstSpan?.text ?? 'Update'
      return {
        title: headline || fallback,
        subtitle: timestamp ? new Date(timestamp).toLocaleString() : undefined,
      }
    },
  },
})
