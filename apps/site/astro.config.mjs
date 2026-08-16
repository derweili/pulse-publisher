// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import clerk from '@clerk/astro';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    // Reads Worker bindings/secrets from `.dev.vars` during `astro dev`, so
    // local dev matches the deployed Worker's `Astro.locals.runtime.env`.
    platformProxy: { enabled: true },
  }),
  integrations: [
    clerk({
      // Points Clerk's OAuth/SSO redirect machinery at src/pages/sso-callback.astro
      // instead of the page the sign-in modal happened to be opened from (see
      // CLAUDE.md, Session 3.5). This app has no mounted `<SignIn />` page —
      // sign-in is exclusively `<SignInButton mode="modal">` — so there is no
      // per-button prop for the OAuth transit URL in @clerk/astro 4.0.11
      // (`SignInButtonProps` in modal mode only takes `mode`/`appearance`, plus
      // post-auth redirect props that don't apply to the mid-flow hop). This
      // integration-level `signInUrl` is the one documented knob for it
      // ("used for any redirects that might happen"). Verify with a live Google
      // sign-in before shipping — the exact default-URL construction lives in
      // the CDN-hotloaded clerk-js bundle, outside what's inspectable here.
      signInUrl: '/sso-callback',
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
