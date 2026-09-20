import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { buildConfig } from 'payload'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Sections } from './collections/Sections'
import { Authors } from './collections/Authors'
import { Articles } from './collections/Articles'
import { LiveBlogs } from './collections/LiveBlogs'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const s3Endpoint = process.env.S3_ENDPOINT
const s3Bucket = process.env.S3_BUCKET

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  collections: [Users, Media, Sections, Authors, Articles, LiveBlogs],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  // Content is not deployed with the app — every article/section/author read
  // is a live query, same as the old Sanity setup (see apps/site's
  // lib/payload/fetch.ts). Uploaded files live in S3/R2 rather than local
  // disk so they survive redeploys and work on serverless hosts.
  plugins: s3Bucket
    ? [
        s3Storage({
          collections: { media: true },
          bucket: s3Bucket,
          config: {
            region: process.env.S3_REGION || 'auto',
            endpoint: s3Endpoint,
            forcePathStyle: Boolean(s3Endpoint),
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
            },
          },
        }),
      ]
    : [],
  onInit: async (payload) => {
    // Bootstraps the service account apps/site authenticates as, so a fresh
    // environment needs nothing more than the PAYLOAD_SERVICE_API_KEY env
    // var (set the same value in apps/site's PAYLOAD_API_KEY) — no manual
    // admin-panel step. Re-running this is a no-op once the account exists;
    // rotating the key means changing PAYLOAD_SERVICE_API_KEY here and
    // updating the user's API key from the admin panel (Users → the service
    // account → Enable API Key).
    const apiKey = process.env.PAYLOAD_SERVICE_API_KEY
    if (!apiKey) return

    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: 'site@pulse.internal' } },
      limit: 1,
      overrideAccess: true,
    })
    if (existing.docs.length > 0) return

    await payload.create({
      collection: 'users',
      data: {
        email: 'site@pulse.internal',
        password: crypto.randomUUID(),
        enableAPIKey: true,
        apiKey,
      },
      overrideAccess: true,
    })
    payload.logger.info('Created apps/site service account (site@pulse.internal)')
  },
})
