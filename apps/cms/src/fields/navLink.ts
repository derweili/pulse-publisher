import type { ArrayField } from 'payload'

interface NavLinkSiblingData {
  linkType?: 'internal' | 'external'
}

/** Shared by SiteSettings' `mainNav` and each `footerLinkGroups[].links`. */
export const navLinkField = (
  name: string,
  options?: { admin?: ArrayField['admin']; minRows?: number }
): ArrayField => ({
  type: 'array',
  name,
  admin: options?.admin,
  minRows: options?.minRows,
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'linkType',
      type: 'radio',
      required: true,
      defaultValue: 'external',
      options: [
        { label: 'Section (internal)', value: 'internal' },
        { label: 'URL (external or path)', value: 'external' },
      ],
    },
    {
      name: 'internalLink',
      type: 'relationship',
      relationTo: 'sections',
      admin: {
        condition: (_, siblingData: NavLinkSiblingData) => siblingData?.linkType === 'internal',
      },
      validate: (value: unknown, { siblingData }: { siblingData: NavLinkSiblingData }) => {
        if (siblingData?.linkType === 'internal' && !value) return 'Required when link type is Section.'
        return true
      },
    },
    {
      name: 'externalUrl',
      type: 'text',
      admin: {
        description: 'An absolute URL (https://...) or a site-relative path (/subscription).',
        condition: (_, siblingData: NavLinkSiblingData) => siblingData?.linkType === 'external',
      },
      validate: (value: unknown, { siblingData }: { siblingData: NavLinkSiblingData }) => {
        if (siblingData?.linkType === 'external' && !value) return 'Required when link type is URL.'
        return true
      },
    },
  ],
})
