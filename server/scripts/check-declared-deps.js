#!/usr/bin/env node
/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * Every package the server imports at runtime must be a production dependency.
 *
 * The image installs `server/package.json` dependencies and then prunes
 * development ones, so a package that is undeclared, or declared only as a
 * devDependency, resolves from a hoisted copy in a development tree and is
 * absent from the image. The failure is at container start: the type build,
 * the test suite and the image build all succeed without the package.
 *
 * Scope is `server/src`: that is what is compiled into `dist` and shipped.
 * Tests are not shipped and are not scanned.
 */

const fs = require('fs');
const path = require('path');
const moduleApi = require('module');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const production = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.optionalDependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
]);

const builtins = new Set(moduleApi.builtinModules);

const srcPath = path.resolve(SRC);
// The build's own exclusions in server/tsconfig.json: the top-level `src/__tests__`
// directory and any `*.test.ts`. Everything else under src is compiled into dist and
// shipped, so it must resolve from production dependencies alone.
const isTestPath = full => {
  const rel = path.relative(srcPath, full).split(path.sep);
  return (rel[0] === '__tests__' && rel.length > 1) || /\.test\.ts$/.test(full);
};

const SOURCE_FILE = /\.(ts|tsx|mts|cts|js|mjs|cjs)$/;

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (SOURCE_FILE.test(entry.name) && !entry.name.endsWith('.d.ts') && !isTestPath(full)) {
      out.push(full);
    }
  }
  return out;
}

// `import x from 'pkg'` / `export * from 'pkg'`. Anchored at the line start, so a
// commented-out import cannot match. The character class keeps the match inside
// one specifier list.
const IMPORT_FROM = /^[ \t]*(?:import|export)\b[^'"]*?\bfrom\s*['"]([^'"]+)['"]/gm;
// Bare side-effect import: `import 'pkg'`.
const IMPORT_BARE = /^[ \t]*import\s*['"]([^'"]+)['"]/gm;
// Call forms, matched on comment-stripped text.
const CALLS = [
  /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
];

// Comments are stripped, string literals are not, so source-like text inside a
// template literal can still be read as an import. That direction is safe: the worst
// case is a false failure, never a missed undeclared import.
const stripComments = text =>
  text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const files = walk(SRC, []);
if (files.length === 0) {
  console.error('check-declared-deps: scanned 0 files under ' + SRC + ' - wrong scan root, failing');
  process.exit(1);
}

const offenders = new Map();
const record = (spec, file) => {
  if (spec.startsWith('.') || spec.startsWith('/') || spec.startsWith('node:')) return;
  const name = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
  if (builtins.has(name) || production.has(name)) return;
  if (!offenders.has(name)) offenders.set(name, new Set());
  offenders.get(name).add(path.relative(ROOT, file));
};

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf8');
  const bare = stripComments(raw);
  for (const pattern of [IMPORT_FROM, IMPORT_BARE, ...CALLS]) {
    pattern.lastIndex = 0;
    for (const match of bare.matchAll(pattern)) record(match[1], file);
  }
}

if (offenders.size > 0) {
  console.error('check-declared-deps: ' + offenders.size + ' package(s) imported but not a production dependency in server/package.json:');
  for (const [name, where] of [...offenders].sort()) {
    console.error('  ' + name + '  <- ' + [...where].sort().join(', '));
  }
  console.error('A package that is undeclared or development-only resolves here, and is pruned out of the image.');
  process.exit(1);
}

console.log('check-declared-deps: ' + files.length + ' source files, every import is a production dependency');
