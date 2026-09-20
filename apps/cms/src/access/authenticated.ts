import type { Access } from 'payload'

/**
 * Every content collection (and the site-settings global) requires this.
 * The site's own Worker authenticates as a service user via API key (see
 * README "Connecting apps/site"); the admin UI authenticates via session
 * cookie. Either way, an anonymous request gets nothing back — content is
 * gated the same way the old private Sanity dataset + read token was,
 * because a public premium article body would bypass the paywall entirely
 * (see apps/site's CLAUDE.md).
 */
export const authenticated: Access = ({ req: { user } }) => Boolean(user)
