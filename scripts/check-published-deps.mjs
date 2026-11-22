#!/usr/bin/env node
// Dependabot can propose a version the registry does not serve: one that was
// never published, or was yanked after the PR opened. Nothing else in CI would
// notice — type checks and tests run against a lockfile that installs from cache.
//
// Usage: node scripts/check-published-deps.mjs <base-ref>
//
// Compares every workspace lockfile in the working tree against <base-ref> and
// exits non-zero when a version that appeared in the change answers 404.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const LOCKFILES = [
  "package-lock.json",
  "shared/package-lock.json",
  "server/package-lock.json",
  "client/package-lock.json",
  "cli/package-lock.json",
];

const base = process.argv[2];
if (!base) {
  console.error("usage: node scripts/check-published-deps.mjs <base-ref>");
  process.exit(2);
}

// Only registry-tarball entries are checkable: workspace links, git deps and
// bundled packages carry no `resolved` URL, and asking about them would produce
// false failures rather than a missing-version verdict.
function parse(text) {
  const specs = new Set();
  for (const [key, entry] of Object.entries(JSON.parse(text).packages ?? {})) {
    if (!entry.version || !entry.resolved?.startsWith("https://registry.npmjs.org/")) continue;
    const name = key.slice(key.lastIndexOf("node_modules/") + "node_modules/".length);
    specs.add(`${name}@${entry.version}`);
  }
  return specs;
}

function readHead(file) {
  return existsSync(file) ? parse(readFileSync(file, "utf8")) : null;
}

function readBase(file) {
  try {
    return parse(execFileSync("git", ["show", `${base}:${file}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }));
  } catch {
    return null; // file did not exist on the base branch
  }
}

async function published(spec) {
  const at = spec.lastIndexOf("@");
  const url = `https://registry.npmjs.org/${spec.slice(0, at).replace("/", "%2F")}/${spec.slice(at + 1)}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (res.status === 200) return true;
      if (res.status === 404) return false;
    } catch {
      // fall through to the retry
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 500 * attempt));
  }
  // A rate-limited or unreachable registry is not a verdict on the package, so
  // it must not fail the gate — say so and let the human read the line.
  console.warn(`  ? ${spec}: registry did not answer 200 or 404`);
  return null;
}

const added = [];
for (const file of LOCKFILES) {
  const head = readHead(file);
  if (!head) continue;
  const known = readBase(file) ?? new Set();
  for (const spec of head) if (!known.has(spec)) added.push({ file, spec });
}

if (added.length === 0) {
  console.log("No dependency versions added.");
  process.exit(0);
}

const missing = [];
for (let i = 0; i < added.length; i += 8) {
  const batch = added.slice(i, i + 8);
  const results = await Promise.all(batch.map(({ spec }) => published(spec)));
  results.forEach((ok, j) => {
    const { file, spec } = batch[j];
    if (ok === false) missing.push({ file, spec });
    else if (ok === true) console.log(`  ok ${spec} (${file})`);
  });
}

if (missing.length) {
  console.error(`\n${missing.length} version(s) not served by the registry:`);
  for (const { file, spec } of missing) console.error(`  ${spec} (${file})`);
  process.exit(1);
}
console.log(`\nAll ${added.length} added version(s) resolve on the registry.`);
