import {SearchIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  icon: SearchIcon,
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta title',
      type: 'string',
      description: 'Overrides the default page title used in the browser tab and search results.',
      validation: (Rule) => Rule.max(70).warning('Longer titles may be truncated by search engines.'),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta description',
      type: 'text',
      rows: 3,
      description: 'Overrides the default description used for search results and social shares.',
      validation: (Rule) =>
        Rule.max(200).warning('Longer descriptions may be truncated by search engines.'),
    }),
    defineField({
      name: 'ogImage',
      title: 'Social share image',
      type: 'image',
      description: 'Used for Open Graph / Twitter card previews when this page is shared.',
      options: {hotspot: true},
    }),
  ],
})
