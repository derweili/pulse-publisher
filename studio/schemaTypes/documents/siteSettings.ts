import {CogIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const SITE_SETTINGS_DOC_ID = 'siteSettings'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  // There is only ever one of these — see structure.ts, which pins the
  // document to a fixed _id and hides create/duplicate actions for it.
  fields: [
    defineField({
      name: 'title',
      title: 'Site title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      description: 'Optional. Falls back to a styled text mark if left empty.',
      options: {hotspot: true},
    }),
    defineField({
      name: 'defaultSeo',
      title: 'Default SEO',
      type: 'seo',
      description: 'Fallback title/description/social image used by any page without its own override.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mainNav',
      title: 'Main navigation (extra links)',
      type: 'array',
      of: [{type: 'navLink'}],
      description: 'Sections are added to the header automatically. Use this for extra links like Subscribe.',
    }),
    defineField({
      name: 'footerLinkGroups',
      title: 'Footer link groups',
      type: 'array',
      of: [{type: 'footerLinkGroup'}],
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social links',
      type: 'array',
      of: [{type: 'socialLink'}],
    }),
    defineField({
      name: 'copyrightText',
      title: 'Copyright text',
      type: 'string',
      description: 'Optional override. If empty, the site falls back to "© {year} {title}. All rights reserved."',
    }),
    defineField({
      name: 'breakingNews',
      title: 'Breaking news banner',
      type: 'object',
      description: 'A dismissible banner shown site-wide. Toggle it on/off any time — the live site picks it up immediately, no redeploy.',
      fields: [
        defineField({
          name: 'active',
          title: 'Show banner',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'headline',
          title: 'Headline',
          type: 'string',
          validation: (Rule) => Rule.max(140),
        }),
        defineField({
          name: 'href',
          title: 'Link (optional)',
          type: 'string',
          description: 'Where the banner links to, e.g. /articles/some-story. Leave empty for a non-clickable banner.',
        }),
      ],
      preview: {
        select: {active: 'active', headline: 'headline'},
        prepare({active, headline}) {
          return {title: headline || 'Breaking news banner', subtitle: active ? 'Active' : 'Off'}
        },
      },
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {title: title || 'Site settings'}
    },
  },
})
