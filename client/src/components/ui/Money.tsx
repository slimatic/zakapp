/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * Money - display-grade currency rendering.
 *
 * The mockup renders money with the currency symbol set smaller than the
 * digits, right-aligned with tabular numerals, so columns of figures line up
 * (`.amount` / `.cur` in the mockup's ui.css). This component is that
 * treatment, and it is the only thing that should ever decide how an amount
 * looks.
 *
 * It deliberately owns NO formatting logic: useDisplayCurrency() already
 * resolves the currency and applies the privacy mask (#310 / #341). This
 * splits the formatted string into symbol + digits for styling, nothing more.
 */

import React from 'react';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';

export type MoneySize = 'hero' | 'lg' | 'md' | 'sm';

export interface MoneyProps {
  /** Amount in the display currency. */
  value: number;
  /** Format in a different code than the display currency (e.g. a stored IDR record). */
  currency?: string;
  /**
   * `hero` is the zakat-due figure on the dashboard: display font, the only
   * place an amount is allowed to be the loudest thing on the page.
   */
  size?: MoneySize;
  /** Render with a leading + for positive values (deltas). */
  signed?: boolean;
  /** Applies the semantic colour for the value's sign (danger for negative). */
  tone?: 'default' | 'success' | 'danger' | 'muted';
  className?: string;
  /** Accessible label, when the surrounding copy already states what the figure is. */
  'aria-label'?: string;
}

/**
 * Split a formatted currency string into its leading symbol and the digits.
 *
 * Handles the three shapes formatCurrency can produce:
 *   "$1,218.26"      -> ["$", "1,218.26"]
 *   "IDR 15,750"     -> ["IDR", "15,750"]   (unknown/unsupported code fallback)
 *   "1,218.26"       -> ["", "1,218.26"]    (showSymbol false; not used here)
 *   "-$640.20"       -> ["-$", "640.20"]    (negative: sign rides with the symbol)
 *
 * Intl also emits non-breaking spaces and RTL marks for some locales; anything
 * up to the first digit is treated as the symbol, spaces included.
 */
export function splitCurrency(formatted: string): [string, string] {
  const match = formatted.match(/^([^\d]*)([\d.,\s]*)$/);
  if (!match) return ['', formatted];
  return [match[1].trim(), match[2].trim()];
}

const SIZE_CLASSES: Record<MoneySize, { wrap: string; symbol: string }> = {
  // Hero: the dashboard zakat figure. Outfit at display scale, tight tracking.
  hero: {
    wrap: 'font-heading font-semibold text-5xl sm:text-6xl tracking-tight',
    symbol: 'text-[0.5em] translate-y-[-0.35em] inline-block me-0.5'
  },
  lg: {
    wrap: 'font-heading font-semibold text-3xl tracking-tight',
    symbol: 'text-[0.55em] translate-y-[-0.3em] inline-block me-0.5'
  },
  md: {
    wrap: 'font-semibold text-base',
    symbol: 'text-[0.72em] align-top me-0.5'
  },
  sm: {
    wrap: 'font-medium text-sm',
    symbol: 'text-[0.72em] align-top me-0.5'
  }
};

const TONE_CLASSES = {
  default: '',
  success: 'text-success',
  danger: 'text-danger',
  muted: 'text-muted-foreground'
} as const;

export const Money: React.FC<MoneyProps> = ({
  value,
  currency,
  size = 'md',
  signed = false,
  tone = 'default',
  className = '',
  'aria-label': ariaLabel
}) => {
  const { formatCurrency } = useDisplayCurrency();
  // When the caller wants a signed display we format the magnitude and supply
  // the sign ourselves, so + and - sit in the same position.
  const formatted = formatCurrency(signed ? Math.abs(value) : value, currency);
  const [symbol, digits] = splitCurrency(formatted);
  const sizes = SIZE_CLASSES[size];

  // Intl carries the negative sign inside the symbol ("-$640.20"). Pull it out
  // so the sign renders in our own slot and the symbol stays clean.
  const cleanSymbol = symbol.replace('-', '');
  const showMinus = value < 0;
  const showPlus = signed && value >= 0;

  return (
    <span
      className={`inline-flex items-baseline whitespace-nowrap tabular-nums ${sizes.wrap} ${TONE_CLASSES[tone]} ${className}`}
      aria-label={ariaLabel}
    >
      {showMinus && <span className={sizes.symbol} aria-hidden="true">-</span>}
      {showPlus && <span className={sizes.symbol} aria-hidden="true">+</span>}
      {cleanSymbol && (
        <span className={`${sizes.symbol} text-muted-foreground`} aria-hidden="true">
          {cleanSymbol}
        </span>
      )}
      <span>{digits}</span>
    </span>
  );
};
