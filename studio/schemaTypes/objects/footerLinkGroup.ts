import {UlistIcon} from '@sanity/icons/Ulist'
import {defineField, defineType} from 'sanity'

export const footerLinkGroup = defineType({
  name: 'footerLinkGroup',
  title: 'Footer link group',
  type: 'object',
  icon: UlistIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'links',
      title: 'Links',
      type: 'array',
      of: [{type: 'navLink'}],
      validation: (Rule) => Rule.min(1),
    }),
  ],
  preview: {
    select: {title: 'heading', links: 'links'},
    prepare({title, links}) {
      return {title, subtitle: `${links?.length ?? 0} link(s)`}
    },
  },
})
