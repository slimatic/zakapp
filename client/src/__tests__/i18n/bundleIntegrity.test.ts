/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import { describe, it, expect } from 'vitest';

import enDashboard from '../../i18n/locales/en/dashboard.json';
import arDashboard from '../../i18n/locales/ar/dashboard.json';
import enOnboarding from '../../i18n/locales/en/onboarding.json';
import arOnboarding from '../../i18n/locales/ar/onboarding.json';
import enCommon from '../../i18n/locales/en/common.json';
import arCommon from '../../i18n/locales/ar/common.json';

/**
 * Bundle integrity.
 *
 * The failure this prevents is silent by nature: i18next does NOT throw on a
 * missing key. It renders the key itself, so a gap shows up as
 * "charts.assetComposition" in the middle of the dashboard - in English - for an
 * Arabic user, and nothing in a test run or a build complains. That is exactly
 * how the raw key "education.whatIsZakat" once reached production.
 *
 * These are cheap structural assertions over the JSON, so they run instantly and
 * cannot be affected by component state.
 */

type Bundle = Record<string, unknown>;

const flatten = (o: Bundle, prefix = ''): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v as Bundle, key));
    } else {
      out[key] = String(v);
    }
  }
  return out;
};

const BUNDLES: Array<{ ns: string; en: Bundle; ar: Bundle }> = [
  { ns: 'dashboard', en: enDashboard as Bundle, ar: arDashboard as Bundle },
  { ns: 'onboarding', en: enOnboarding as Bundle, ar: arOnboarding as Bundle },
  { ns: 'common', en: enCommon as Bundle, ar: arCommon as Bundle }
];

describe('locale bundles', () => {
  for (const { ns, en, ar } of BUNDLES) {
    describe(`${ns}`, () => {
      it('Arabic defines every key English defines', () => {
        const fe = flatten(en);
        const fa = flatten(ar);
        const missing = Object.keys(fe).filter((k) => !(k in fa));
        // Missing keys fall back to English silently, so this is the assertion
        // that catches a half-finished translation.
        expect(missing, `${ns}.json is missing in ar: ${missing.join(', ')}`).toEqual([]);
      });

      it('has no keys in Arabic that English lacks', () => {
        // An ar-only key is dead weight and usually a typo in the key name, which
        // would leave the English build rendering a raw key.
        const fe = flatten(en);
        const fa = flatten(ar);
        const extra = Object.keys(fa).filter((k) => !(k in fe));
        expect(extra, `${ns}.json has ar-only keys: ${extra.join(', ')}`).toEqual([]);
      });

      it('has no empty string values in either language', () => {
        // An empty value renders as nothing at all, which looks like a layout bug
        // rather than a translation gap.
        for (const [lang, bundle] of [['en', en], ['ar', ar]] as const) {
          const empty = Object.entries(flatten(bundle))
            .filter(([, v]) => v.trim() === '')
            .map(([k]) => k);
          expect(empty, `${ns}.json (${lang}) has empty values: ${empty.join(', ')}`).toEqual([]);
        }
      });

      it('keeps interpolation placeholders consistent between languages', () => {
        // {{count}} in English but {{cnt}} in Arabic silently renders the literal
        // "{{cnt}}". Comparing the placeholder SETS catches that without
        // requiring the translations to be word-for-word.
        const fe = flatten(en);
        const fa = flatten(ar);
        const ph = (s: string) => (s.match(/\{\{\s*\w+\s*\}\}/g) ?? []).map((x) => x.replace(/[\s{}]/g, '')).sort();
        const mismatched = Object.keys(fe)
          .filter((k) => k in fa && ph(fe[k]).join(',') !== ph(fa[k]).join(','))
          .map((k) => `${k} (en: ${ph(fe[k]).join('|') || '-'} vs ar: ${ph(fa[k]).join('|') || '-'})`);
        expect(mismatched, `${ns}.json placeholder mismatch: ${mismatched.join('; ')}`).toEqual([]);
      });

      it('Arabic is actually Arabic where it carries words', () => {
        // Catches an English string pasted into the Arabic bundle. Short tokens
        // with no letters (numbers, symbols) are exempt, and so are values that
        // are legitimately identical in both languages - an example email
        // address, a brand, a technical acronym - which are listed explicitly
        // rather than pattern-matched, so adding one is a deliberate act.
        const IDENTICAL_BY_DESIGN = new Set([
          'you@example.com',   // example address shown to the user, not prose
          'ZakApp',            // product name
          'RST Labs',          // company name
          'GitHub',            // service name
          'AES-GCM',           // technical acronym
          'Zakat',             // transliterated term kept in Latin script
          'Hawl',
          'Nisab'
        ]);
        const fa = flatten(ar);
        const untranslated = Object.entries(fa)
          .filter(([, v]) => !/[\u0600-\u06FF]/.test(v) && /[A-Za-z]{4,}/.test(v))
          .filter(([, v]) => !IDENTICAL_BY_DESIGN.has(v.trim()))
          .map(([k, v]) => `${k}=${v.slice(0, 30)}`);
        expect(untranslated, `${ns}.json (ar) still English: ${untranslated.join('; ')}`).toEqual([]);
      });
    });
  }
});
