import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

if (!projectId) {
  throw new Error(
    'Missing SANITY_STUDIO_PROJECT_ID. Copy studio/.env.example to studio/.env and fill it in.',
  )
}

export default defineConfig({
  name: 'pulse',
  title: 'PULSE',

  projectId,
  dataset,

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
  },

  document: {
    // siteSettings is a singleton: no creating a second one, no duplicating
    // the one that exists (see structure.ts for how it's surfaced instead
    // of appearing in a generic document list).
    actions: (input, context) =>
      context.schemaType === 'siteSettings'
        ? input.filter(({action}) => action !== 'duplicate')
        : input,
    newDocumentOptions: (input, context) =>
      context.creationContext.type === 'global'
        ? input.filter((item) => item.templateId !== 'siteSettings')
        : input,
  },
})
