import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  // `sanity schema extract` / `sanity typegen generate` (run from studio/)
  // read this to know where the Astro app's queries live and where to
  // write the generated types, so the Astro app can commit + import them
  // without depending on the studio/ package at build time.
  autoUpdates: true,
})
