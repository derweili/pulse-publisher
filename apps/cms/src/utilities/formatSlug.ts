import type { FieldHook } from 'payload'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Auto-fills `slug` from `sourceField` on create when left empty — editor
 * convenience, not a constraint. Uniqueness itself comes from the field's
 * own `unique: true` (a DB-level constraint, enforced atomically, unlike
 * the old Sanity setup's client-side async uniqueness check).
 */
export const formatSlugHook = (sourceField: string): FieldHook =>
  ({ value, data, originalDoc }) => {
    if (typeof value === 'string' && value.length > 0) return slugify(value)
    const source = (data?.[sourceField] ?? originalDoc?.[sourceField]) as string | undefined
    if (source) return slugify(source)
    return value
  }
