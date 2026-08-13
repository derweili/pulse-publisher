import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {defineField, defineType} from 'sanity'
import {isUniqueSlug} from '../lib/isUniqueSlug'

export const article = defineType({
  name: 'article',
  title: 'Article',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'meta', title: 'Meta'},
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
      description: 'Subtitle shown under the headline. Also used as the default meta description.',
      validation: (Rule) => Rule.required().max(240),
    }),
    defineField({
      name: 'section',
      title: 'Section',
      type: 'reference',
      group: 'content',
      to: [{type: 'section'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'authors',
      title: 'Authors',
      type: 'array',
      group: 'content',
      of: [{type: 'reference', to: [{type: 'author'}]}],
      validation: (Rule) => Rule.required().min(1),
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
      name: 'body',
      title: 'Body',
      type: 'blockContent',
      group: 'content',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'meta',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'readTime',
      title: 'Read time (minutes)',
      type: 'number',
      group: 'meta',
      description: 'Roughly word count / 200.',
      validation: (Rule) => Rule.required().integer().positive(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'meta',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'premium',
      title: 'Premium',
      type: 'boolean',
      group: 'meta',
      initialValue: false,
      description: 'Shows the PULSE+ banner and gates the article as subscriber content.',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      group: 'meta',
      initialValue: false,
      description: 'Surfaces this article in homepage featured placements.',
    }),
    defineField({
      name: 'trendingRank',
      title: 'Trending rank',
      type: 'number',
      group: 'meta',
      description: 'Set to 1 (most trending) and up to feature this article in the "Trending now" module, ranked lowest-first. Leave empty to exclude it.',
      validation: (Rule) => Rule.integer().positive(),
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
      title: 'Published, new to old',
      name: 'publishedAtDesc',
      by: [{field: 'publishedAt', direction: 'desc'}],
    },
    {
      title: 'Featured first',
      name: 'featuredFirst',
      by: [
        {field: 'featured', direction: 'desc'},
        {field: 'publishedAt', direction: 'desc'},
      ],
    },
    {
      title: 'Title A-Z',
      name: 'titleAsc',
      by: [{field: 'title', direction: 'asc'}],
    },
    {
      title: 'Trending rank',
      name: 'trendingRankAsc',
      by: [{field: 'trendingRank', direction: 'asc'}],
    },
  ],
  preview: {
    select: {title: 'title', media: 'hero', sectionTitle: 'section.title', premium: 'premium'},
    prepare({title, media, sectionTitle, premium}) {
      return {
        title,
        subtitle: [sectionTitle, premium ? 'Premium' : null].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
