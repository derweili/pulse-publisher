import type {SlugIsUniqueValidator} from 'sanity'

/**
 * Standard Sanity slug-uniqueness check, scoped per document type so e.g.
 * an article and a section can never collide even if (hypothetically) they
 * shared a slug value, while two articles with the same slug are rejected.
 */
export const isUniqueSlug: SlugIsUniqueValidator = async (slug, context) => {
  const {document, getClient} = context
  const client = getClient({apiVersion: '2025-02-01'})
  const id = document?._id.replace(/^drafts\./, '')
  const params = {
    draft: `drafts.${id}`,
    published: id,
    slug,
    type: document?._type,
  }
  const query = `!defined(*[
    !(_id in [$draft, $published]) &&
    _type == $type &&
    slug.current == $slug
  ][0]._id)`
  const result = await client.fetch(query, params)
  return result
}
