/**
 * Guard for #383: the web-push handlers must actually reach the shipped worker.
 *
 * The bug this prevents: the handlers existed as client/public/sw.js, but
 * (a) .gitignore's blanket `*.js` rule meant the file was in no branch, and
 * (b) workbox runs in `generateSW` mode, which writes its own dist/sw.js and
 * silently discards any hand-written public/sw.js.
 *
 * Net effect was a service worker with zero push listeners while VAPID, the
 * subscribe UI and the server were all correctly configured — so notifications
 * could never be displayed and nothing failed loudly.
 *
 * These are source-level assertions because the alternative (build, then
 * inspect dist/sw.js) takes ~35s and this suite runs on every commit. The full
 * behavioural proof — dispatching a real `push` event into the registered
 * worker and asserting a notification appears — was run against the built
 * artifact; see the PR body. Removing any single assertion below breaks the
 * live handler, so each one is load-bearing.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../../../..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

describe('#383 web-push service worker wiring', () => {
  it('ships the push handler file', () => {
    const p = path.join(ROOT, 'client/public/push-sw.js');
    expect(fs.existsSync(p), 'client/public/push-sw.js is missing').toBe(true);
  });

  it('registers both a push and a notificationclick listener', () => {
    const sw = read('client/public/push-sw.js');
    // Without these the worker loads but ignores every push.
    expect(sw).toContain("addEventListener('push'");
    expect(sw).toContain("addEventListener('notificationclick'");
    expect(sw).toContain('showNotification');
  });

  it('is plain JS, not TypeScript (public/ is copied verbatim, never transpiled)', () => {
    const sw = read('client/public/push-sw.js');
    // A `interface`/`: type` annotation here ships as a syntax error inside the
    // service worker, and no build step would catch it.
    expect(sw, 'push-sw.js must not use TS syntax').not.toMatch(/^\s*interface\s+\w+/m);
    expect(sw, 'push-sw.js must not use TS annotations').not.toMatch(/\)\s*:\s*(void|Promise|boolean)\s*\{/);
  });

  it('is pulled into the generated worker via workbox importScripts', () => {
    const cfg = read('client/vite.config.ts');
    // generateSW mode writes dist/sw.js; without importScripts the handler file
    // is simply never loaded.
    expect(cfg).toContain("importScripts: ['push-sw.js']");
  });

  it('does not call precacheAndRoute (the generated worker already does)', () => {
    const sw = read('client/public/push-sw.js');
    // Strip comments first: the doc block legitimately NAMES precacheAndRoute
    // to explain why it is absent, and matching prose here would be a false fail.
    const code = sw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((l) => !l.trim().startsWith('//'))
      .join('\n');
    // Two precache calls in one scope would register the manifest twice.
    expect(code).not.toContain('precacheAndRoute');
    expect(code).not.toMatch(/import\s+.*workbox-precaching/);
  });

  it('is not swallowed by the .gitignore `*.js` rule', () => {
    const ignore = read('.gitignore');
    // The negation must come after the rule it overrides to take effect.
    const jsRule = ignore.indexOf('\n*.js\n');
    const negation = ignore.indexOf('!client/public/push-sw.js');
    expect(jsRule, 'the *.js build-artifact rule is gone — check whether this guard still applies').toBeGreaterThan(-1);
    expect(negation, 'push-sw.js must be explicitly un-ignored').toBeGreaterThan(jsRule);
  });

  it('does not register the service worker twice', () => {
    const idx = read('client/src/index.tsx');
    const registrations = idx.match(/navigator\.serviceWorker\.register\(/g) ?? [];
    expect(registrations.length, 'the SW registration block was duplicated again').toBe(1);
  });
});
