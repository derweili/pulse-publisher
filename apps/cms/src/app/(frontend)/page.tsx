import { redirect } from 'next/navigation'
import configPromise from '@payload-config'

// This app has no public frontend — it's the CMS backend for apps/site
// (see the repo root README). The only human-facing surface is /admin.
export default async function HomePage() {
  const config = await configPromise
  redirect(config.routes.admin)
}
