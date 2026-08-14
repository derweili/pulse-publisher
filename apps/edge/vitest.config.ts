import { defineConfig } from "vitest/config";

// router.ts and anonymize.ts are pure functions over standard Request/Headers/URL —
// no Miniflare/Workers runtime needed to test them, so a plain Node environment is
// enough rather than @cloudflare/vitest-pool-workers.
export default defineConfig({
  test: {
    environment: "node",
  },
});
