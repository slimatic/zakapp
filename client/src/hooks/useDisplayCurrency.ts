/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * useDisplayCurrency — single source of truth for the user's display currency
 * and privacy-masked currency formatting (#310 / #341 consolidation).
 *
 * Before this hook, the resolver chain (local settings → auth settings →
 * profile prefs → USD) was copy-pasted into 12+ files and the
 * Intl.NumberFormat + maskedCurrency pairing into 15 more, with local
 * drift (LiabilitiesPage hardcoded USD — fixed in #357; AssetList read a
 * nonexistent `currency` field — fixed in #357 round 5). This hook is the
 * canonical implementation; call sites migrate to it one by one.
 *
 * Resolution order (matches #310 round 5 semantics):
 *   1. Local RxDB user_settings.baseCurrency  (fastest, offline-first)
 *   2. Auth-context user.settings.currency    (server-synced settings)
 *   3. Auth-context user.preferences.currency (legacy profile field)
 *   4. 'USD' fallback
 */

import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMaskedCurrency } from '../contexts/PrivacyContext';
import { useUserSettingsRepository } from './useUserSettingsRepository';
import { formatCurrency as formatCanonical } from '../utils/formatters';
import { getNisabStandard } from '../core/calculations/nisab';

export interface DisplayCurrency {
  /** Resolved ISO-4217 currency code, e.g. 'USD', 'IDR'. */
  currency: string;
  /**
   * Resolved nisab gram convention: 'tola' (87.48/612.36 g, default) or 'aaoifi'
   * (85/595 g). Lives here because this hook is already the single reader of the
   * local settings document, and every nisab call site needs both values — passing a
   * second hook around would just be another way for the two to disagree.
   */
  nisabStandard: string;
  /**
   * Format an amount in the display currency with privacy masking applied.
   * Pass an explicit currency to format in a different code (e.g. a record
   * stored in IDR while the display currency is USD).
   */
  formatCurrency: (amount: number, currency?: string) => string;
}

export function useDisplayCurrency(): DisplayCurrency {
  const { settings } = useUserSettingsRepository();
  const { user } = useAuth();
  const maskedCurrency = useMaskedCurrency();

  // A settings document written before schema v8 has no such field, and an unknown
  // value must not disable the threshold — getNisabStandard falls back for both.
  const nisabStandard = getNisabStandard(settings?.nisabStandard).id;

  const currency =
    settings?.baseCurrency ||
    (user as { settings?: { currency?: string } } | null)?.settings?.currency ||
    (user as { preferences?: { currency?: string } } | null)?.preferences?.currency ||
    'USD';

  const formatCurrency = useCallback(
    (amount: number, fmtCurrency: string = currency): string => {
      const formatted = formatCanonical(amount, fmtCurrency as never);
      return maskedCurrency(formatted);
    },
    [currency, maskedCurrency]
  );

  return { currency, nisabStandard, formatCurrency };
}