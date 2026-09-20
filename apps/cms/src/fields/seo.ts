import type { Field } from 'payload'

/** Raw fields, reused by both `seoField` (name "seo") and SiteSettings' "defaultSeo" group. */
export const seoFields: Field[] = [
  {
    name: 'metaTitle',
    type: 'text',
    maxLength: 70,
    admin: {
      description: 'Overrides the default page title used in the browser tab and search results.',
    },
  },
  {
    name: 'metaDescription',
    type: 'textarea',
    maxLength: 200,
    admin: {
      description: 'Overrides the default description used for search results and social shares.',
    },
  },
  {
    name: 'ogImage',
    type: 'upload',
    relationTo: 'media',
    admin: {
      description: 'Used for Open Graph / Twitter card previews when this page is shared.',
    },
  },
]

/**
 * Mirrors the old Sanity `seo` object: an optional override group, falling
 * back to the document's own title/description/hero at render time (that
 * fallback lives in apps/site, not here — this field only stores overrides).
 */
export const seoField: Field = {
  name: 'seo',
  type: 'group',
  admin: {
    description: "Falls back to the document's own title/description/image when left empty.",
  },
  fields: seoFields,
}
