import {ClockIcon, CogIcon, DocumentTextIcon, FolderIcon, UserIcon} from '@sanity/icons'
import type {StructureResolver} from 'sanity/structure'
import {SITE_SETTINGS_DOC_ID} from './schemaTypes/documents/siteSettings'

const HIDDEN_FROM_GENERIC_LIST = new Set(['siteSettings'])

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site settings')
        .id('siteSettings')
        .icon(CogIcon)
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId(SITE_SETTINGS_DOC_ID)
            .title('Site settings'),
        ),
      S.divider(),
      S.listItem()
        .title('Articles')
        .icon(DocumentTextIcon)
        .child(S.documentTypeList('article').title('Articles')),
      S.listItem()
        .title('Sections')
        .icon(FolderIcon)
        .child(S.documentTypeList('section').title('Sections')),
      S.listItem()
        .title('Authors')
        .icon(UserIcon)
        .child(S.documentTypeList('author').title('Authors')),
      S.listItem()
        .title('Live blogs')
        .icon(ClockIcon)
        .child(S.documentTypeList('liveBlog').title('Live blogs')),
      // Any future document types are still listed automatically, minus
      // the ones we've already surfaced above (avoids double listing) and
      // the singleton (which must never appear in a generic collection).
      ...S.documentTypeListItems().filter(
        (item) =>
          !['article', 'section', 'author', 'liveBlog'].includes(item.getId() ?? '') &&
          !HIDDEN_FROM_GENERIC_LIST.has(item.getId() ?? ''),
      ),
    ])
