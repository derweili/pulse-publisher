import { defineLiveCollection } from "astro:content";
import { emdashLoader } from "emdash/runtime";

// Required wiring for EmDash's runtime query API (getEmDashCollection(),
// getEmDashEntry(), etc.) used by this app's own admin/preview machinery.
// apps/site does not use this loader — it reads published content from this
// app's REST API instead (see docs/emdash-migration-plan.md).
export const collections = {
  _emdash: defineLiveCollection({ loader: emdashLoader() }),
};
