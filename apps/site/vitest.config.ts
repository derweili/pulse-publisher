import { defineConfig } from "vitest/config";

// auth-reconcile.ts is a pure function plus sessionStorage wrappers — jsdom
// gives us a real sessionStorage to exercise the fail-closed try/catch paths
// against, without needing the Workers runtime this app otherwise ships on.
export default defineConfig({
  test: {
    environment: "jsdom",
  },
});
