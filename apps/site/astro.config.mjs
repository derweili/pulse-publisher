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
  integrations: [clerk(), react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
