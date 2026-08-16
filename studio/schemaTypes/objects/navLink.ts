import {LinkIcon} from '@sanity/icons/Link'
import {defineField, defineType} from 'sanity'

export const navLink = defineType({
  name: 'navLink',
  title: 'Nav link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'linkType',
      title: 'Link type',
      type: 'string',
      options: {
        list: [
          {title: 'Section (internal)', value: 'internal'},
          {title: 'URL (external or path)', value: 'external'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      initialValue: 'external',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'internalLink',
      title: 'Section',
      type: 'reference',
      to: [{type: 'section'}],
      hidden: ({parent}) => parent?.linkType !== 'internal',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {linkType?: string} | undefined
          if (parent?.linkType === 'internal' && !value) return 'Required when link type is Section.'
          return true
        }),
    }),
    defineField({
      name: 'externalUrl',
      title: 'URL',
      type: 'string',
      description: 'An absolute URL (https://...) or a site-relative path (/subscription).',
      hidden: ({parent}) => parent?.linkType !== 'external',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {linkType?: string} | undefined
          if (parent?.linkType === 'external' && !value) return 'Required when link type is URL.'
          return true
        }),
    }),
  ],
  preview: {
    select: {label: 'label', external: 'externalUrl', internalTitle: 'internalLink.title'},
    prepare({label, external, internalTitle}) {
      return {title: label, subtitle: external || internalTitle || ''}
    },
  },
})
