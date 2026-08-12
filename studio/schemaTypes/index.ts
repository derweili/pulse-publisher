import type {SchemaTypeDefinition} from 'sanity'

import {article} from './documents/article'
import {author} from './documents/author'
import {section} from './documents/section'
import {siteSettings} from './documents/siteSettings'
import {blockContent} from './objects/blockContent'
import {footerLinkGroup} from './objects/footerLinkGroup'
import {imageBlock} from './objects/imageBlock'
import {navLink} from './objects/navLink'
import {seo} from './objects/seo'
import {socialLink} from './objects/socialLink'
import {videoEmbed} from './objects/videoEmbed'

export const schemaTypes: SchemaTypeDefinition[] = [
  // Documents
  siteSettings,
  section,
  author,
  article,
  // Objects
  seo,
  navLink,
  footerLinkGroup,
  socialLink,
  blockContent,
  imageBlock,
  videoEmbed,
]
