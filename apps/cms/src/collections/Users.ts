import type { CollectionConfig } from 'payload'
import { authenticated } from '../access/authenticated'

/**
 * Admin login (email/password) and the service account apps/site
 * authenticates as (API key) share this one collection — see README
 * "Connecting apps/site" for how the service account's key gets minted.
 *
 * `create`/`update`/`delete` require an existing session: Payload itself
 * exempts the very first account ever created from access control (the
 * admin panel's "create first user" screen), so this doesn't block initial
 * setup — it only closes public self-registration once that account exists.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    useAPIKey: true,
  },
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [],
}
