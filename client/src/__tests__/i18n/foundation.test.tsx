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

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import i18n from '../../i18n';
import { getLanguageDir, SUPPORTED_LANGUAGES } from '../../i18n';

describe('i18n foundation (#338)', () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage('en');
    });
  });

  it('initializes with English fallback and exposes onboarding keys', () => {
    expect(i18n.hasLoadedNamespace('onboarding')).toBe(true);
    expect(i18n.t('onboarding:steps.cash.title')).toBe('Cash Assets');
    expect(i18n.t('onboarding:nav.next')).toBe('Next');
  });

  it('switches to Arabic and translates onboarding keys', async () => {
    await act(async () => {
      await i18n.changeLanguage('ar');
    });
    expect(i18n.t('onboarding:steps.cash.title')).toBe('الأصول النقدية');
    expect(i18n.t('onboarding:nav.next')).toBe('التالي');
  });

  it('falls back to English for skeleton locales (e.g. fr)', async () => {
    await act(async () => {
      await i18n.changeLanguage('fr');
    });
    expect(i18n.t('onboarding:steps.cash.title')).toBe('Cash Assets');
  });

  it('persists the chosen language in localStorage under zakapp_lang', async () => {
    await act(async () => {
      await i18n.changeLanguage('ar');
    });
    expect(window.localStorage.getItem('zakapp_lang')).toBe('ar');
  });

  it('reports rtl direction for Arabic and Urdu, ltr otherwise', () => {
    expect(getLanguageDir('ar')).toBe('rtl');
    expect(getLanguageDir('ur')).toBe('rtl');
    expect(getLanguageDir('en')).toBe('ltr');
    expect(getLanguageDir('ms')).toBe('ltr');
  });

  it('declares exactly the 8 target languages from the issue', () => {
    expect(SUPPORTED_LANGUAGES.map(l => l.code)).toEqual(
      expect.arrayContaining(['en', 'ar', 'ms', 'ur', 'fr', 'tr', 'id', 'bn'])
    );
    expect(SUPPORTED_LANGUAGES).toHaveLength(8);
  });
});