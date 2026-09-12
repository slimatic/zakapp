/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * i18n foundation (#338)
 *
 * - English is the complete reference language (namespaces: onboarding,
 *   dashboard).
 * - Arabic ships with RTL support and onboarding/dashboard translations.
 * - Remaining target languages (ms, ur, fr, tr, id, bn) fall back to English
 *   until their namespaces are filled in follow-up PRs.
 * - Language preference persists in localStorage key `zakapp_lang`.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enOnboarding from './locales/en/onboarding.json';
import enDashboard from './locales/en/dashboard.json';
import arOnboarding from './locales/ar/onboarding.json';
import arDashboard from './locales/ar/dashboard.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'ms', name: 'Bahasa Melayu', dir: 'ltr' },
  { code: 'ur', name: 'اردو', dir: 'rtl' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'tr', name: 'Türkçe', dir: 'ltr' },
  { code: 'id', name: 'Bahasa Indonesia', dir: 'ltr' },
  { code: 'bn', name: 'বাংলা', dir: 'ltr' }
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export function getLanguageDir(lang: string): 'ltr' | 'rtl' {
  return SUPPORTED_LANGUAGES.find(l => l.code === lang)?.dir === 'rtl' ? 'rtl' : 'ltr';
}

/** Apply (or clear) RTL direction on the document for the active language. */
export function applyDocumentDirection(lang: string): void {
  document.documentElement.dir = getLanguageDir(lang);
  document.documentElement.lang = lang;
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        onboarding: enOnboarding,
        dashboard: enDashboard
      },
      ar: {
        onboarding: arOnboarding,
        dashboard: arDashboard
      },
      // Skeleton locales: no bundles yet — fall back to English until the
      // community/follow-up translations land.
      ms: {},
      ur: {},
      fr: {},
      tr: {},
      id: {},
      bn: {}
    },
    fallbackLng: 'en',
    // Keep the user's explicit choice sticky; detect browser language first visit.
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'zakapp_lang',
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false // React already escapes
    },
    returnNull: false
  });

// Reflect the initial language in the document direction.
applyDocumentDirection(i18n.resolvedLanguage || 'en');

// Keep direction in sync when the user changes language at runtime.
i18n.on('languageChanged', (lng) => applyDocumentDirection(lng));

export default i18n;