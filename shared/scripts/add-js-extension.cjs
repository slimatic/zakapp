#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '..', 'dist');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  // replace import/export from relative paths missing .js extension
  content = content.replace(/(from\s+['"])(\.\.?:\/[^'";]+)(['"]\s*;?)/g, (m, p1, rel, p3) => {
    // if already has an extension, skip
    if (/\.[a-zA-Z0-9]+$/.test(rel)) return m;
    const candidate = path.resolve(path.dirname(filePath), rel) + '.js';
    if (fs.existsSync(candidate)) {
      return `${p1}${rel}.js${p3}`;
    }
    return m;
  });
  fs.writeFileSync(filePath, content, 'utf8');
}

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.isFile() && full.endsWith('.js')) processFile(full);
  }
}

if (!fs.existsSync(DIST)) {
  console.error('No dist directory found, skipping add-js-extension');
  process.exit(0);
}
walk(DIST);
console.log('Fixed relative import extensions in dist');

// Ensure top-level type exports include `types` barrel so consumers get the types
// Keep declaration file tidy: ensure we do NOT add a directory-style `export * from './types'`
// which can cause runtime resolution issues under Node ESM. We rely on explicit type
// barrels like './types/tracking' to be exported from the package root.
