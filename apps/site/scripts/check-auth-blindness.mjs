#!/usr/bin/env node
// The origin (pulse-today) must render byte-identical HTML for every reader,
// signed in or not — that's what makes it safe to cache anonymized and
// shared globally behind the mOS edge proxy. The moment `Astro.locals.auth`
// (or anything that resolves it, like `clerkMiddleware()`) exists on this
// app, `@clerk/astro`'s `<Show>` switches from its CSR variant to its SSR
// variant and starts rendering different HTML per reader — silently
// poisoning the shared Workers Cache. See CLAUDE.md and
// docs/mos-integration-plan.md ("Q1").
//
// This is a grep-based guard rather than a byte-diff test: diffing rendered
// HTML needs a live signed-in session to compare against, which isn't
// available in CI. Forbidding the handful of APIs that flip that CSR/SSR
// switch is a cheap, durable proxy for the same guarantee.

import { readFileSync, readdirSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = fileURLToPath(new URL("..", import.meta.url));
const srcDir = join(siteRoot, "src");
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".astro"]);

const FORBIDDEN_PATTERNS = [
  { needle: "clerkMiddleware", reason: "adds server-side auth resolution, which flips <Show> to its SSR variant" },
  { needle: "@clerk/astro/server", reason: "the server-side Clerk import is how clerkMiddleware()/auth() get pulled in" },
  { needle: "locals.auth", reason: "reading Astro.locals.auth requires clerkMiddleware() to have run first" },
];

/** @type {string[]} */
let violations = [];

function walk(dir) {
  /** @type {string[]} */
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (SCAN_EXTENSIONS.has(extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

function scanSourceFiles() {
  const files = walk(srcDir);
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    const lines = content.split("\n");
    for (const { needle, reason } of FORBIDDEN_PATTERNS) {
      lines.forEach((line, i) => {
        if (line.includes(needle)) {
          violations.push(`${relative(siteRoot, file)}:${i + 1}: found "${needle}" — ${reason}`);
        }
      });
    }
  }
}

function scanMiddleware() {
  const middlewarePath = join(srcDir, "middleware.ts");
  let content;
  try {
    content = readFileSync(middlewarePath, "utf8");
  } catch {
    return; // no middleware.ts yet (added in a later session) — nothing to check
  }
  const cookiePatterns = [/\bAstro\.cookies\b/, /headers\.get\(\s*["']cookie["']\s*\)/i];
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    if (cookiePatterns.some((re) => re.test(line))) {
      violations.push(
        `${relative(siteRoot, middlewarePath)}:${i + 1}: middleware reads a cookie — cacheable routes must not vary by reader`
      );
    }
  });
}

scanSourceFiles();
scanMiddleware();

if (violations.length > 0) {
  console.error("Auth-blindness guard failed — the origin must render identical HTML for every reader:\n");
  for (const v of violations) console.error(`  ${v}`);
  console.error("\nAll reader variance belongs in the edge Worker (apps/edge), sourced from the mOS Decision API.");
  process.exit(1);
}

console.log("Auth-blindness guard passed — no server-side auth signal found in apps/site/src.");
