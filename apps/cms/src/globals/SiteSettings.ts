import type { GlobalConfig } from 'payload'
import { authenticated } from '../access/authenticated'
import { seoFields } from '../fields/seo'
import { navLinkField } from '../fields/navLink'
import { triggerRevalidate } from '../hooks/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: {
    read: authenticated,
    update: authenticated,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'tagline', type: 'textarea', required: true },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional. Falls back to a styled text mark if left empty.' },
    },
    {
      name: 'defaultSeo',
      type: 'group',
      admin: { description: 'Fallback title/description/social image used by any page without its own override.' },
      fields: seoFields,
    },
    navLinkField('mainNav', {
      admin: { description: 'Sections are added to the header automatically. Use this for extra links like Subscribe.' },
    }),
    {
      name: 'footerLinkGroups',
      type: 'array',
      fields: [
        { name: 'heading', type: 'text', required: true },
        navLinkField('links', { minRows: 1 }),
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'Twitter', value: 'twitter' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'TikTok', value: 'tiktok' },
            { label: 'Facebook', value: 'facebook' },
          ],
        },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'copyrightText',
      type: 'text',
      admin: {
        description: 'Optional override. If empty, the site falls back to "© {year} {title}. All rights reserved."',
      },
    },
    {
      name: 'breakingNews',
      type: 'group',
      admin: {
        description:
          'A dismissible banner shown site-wide. Toggle it on/off any time — the live site picks it up immediately, no redeploy.',
      },
      fields: [
        { name: 'active', type: 'checkbox', defaultValue: false, label: 'Show banner' },
        { name: 'headline', type: 'text', maxLength: 140 },
        {
          name: 'href',
          type: 'text',
          admin: { description: 'Where the banner links to, e.g. /articles/some-story. Leave empty for a non-clickable banner.' },
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async () => {
        // Renders into every page's nav/footer/breaking-news banner — no
        // narrower tag covers it, so this always purges everything.
        await triggerRevalidate({ type: 'siteSettings' })
      },
    ],
  },
}
