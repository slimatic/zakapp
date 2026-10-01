/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * The top of the dashboard, in the mockup's composition order:
 *
 *   1. greeting (small, muted)
 *   2. the zakat figure at display size - the page's focal point
 *   3. the hawl card: moon arc, progress sentence, two actions
 *   4. quick actions
 *
 * These three live together because they only ever appear in this order, as one
 * unit, at the top of the dashboard. Splitting them into three files would
 * scatter a single composition across the tree.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import {
  Wallet,
  Moon,
  Calculator,
  BookOpen,
  Landmark,
  Coins,
  TrendingUp,
  Bitcoin,
  Package,
  Building2,
  PiggyBank,
  CircleDollarSign,
  CreditCard,
  type LucideIcon
} from 'lucide-react';
import { Money } from '../ui/Money';
import { MoonArc } from '../tracking/MoonArc';

/* ────────────────────────── greeting + hero figure ────────────────────────── */

export interface DashboardHeroProps {
  /** Used for the greeting. Falls back to a neutral address. */
  userName?: string;
  /**
   * Zakat due in the display currency, or `null` when it cannot be determined
   * yet (still loading, prices unavailable, or no calculation).
   *
   * `null` is NOT zero and NOT "no assets": zero is a real, reportable result
   * (wealth below nisab). When null the hero states that the figure is not
   * calculated instead of showing a fabricated estimate.
   */
  zakatDue: number | null;
  /** Currency the figure is denominated in, when it differs from display. */
  currency?: string;
  /** Hijri year label, e.g. '1448'. Omitted when unknown. */
  hijriYear?: string;
  /** Methodology label, e.g. "Shafi'i". */
  methodology?: string;
  /** Where "See how this was calculated" points. */
  calculationHref?: string;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  userName,
  zakatDue,
  currency,
  hijriYear,
  methodology,
  calculationHref = '/calculator'
}) => {
  const { t, i18n } = useTranslation('dashboard');
  // Locale-aware date. This was pinned to 'en-US', which rendered an English
  // date order inside an otherwise right-to-left Arabic layout - the exact
  // inconsistency the branch's own RTL work exists to remove.
  const today = new Date().toLocaleDateString(i18n.language, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  // Build the note from whichever qualifiers we actually have, so it never
  // renders "for · · See how".
  const qualifiers = [
    hijriYear ? t('hero.hijriYear', { year: hijriYear }) : null,
    methodology || null
  ].filter(Boolean);

  const notCalculated = zakatDue === null;

  return (
    <section className="text-start">
      <p className="text-[13px] font-medium text-muted-foreground">
        {t('hero.greeting')}
        {userName ? `, ${userName}` : ''} · <span className="tabular-nums">{today}</span>
      </p>

      {notCalculated ? (
        // No canonical figure available. Showing 2.5% of every asset here would
        // present an invented number as a financial obligation, so we say so.
        <p
          className="mt-1 text-2xl font-semibold text-secondary"
          aria-describedby="hero-zakat-status"
        >
          {t('hero.notCalculated')}
        </p>
      ) : (
        <Money
          value={zakatDue}
          currency={currency}
          size="hero"
          tone="default"
          className="mt-1 text-primary"
        />
      )}

      <p id="hero-zakat-status" className="mt-1 text-[13px] text-muted-foreground">
        {notCalculated ? (
          <>
            {t('hero.notCalculatedHint')}{' '}
            <Link to={calculationHref} className="text-primary hover:underline underline-offset-2">
              {t('hero.calculateNow')}
            </Link>
          </>
        ) : (
          <>
            {qualifiers.length
              ? t('hero.estimatedDueWith', { qualifiers: qualifiers.join(' · ') })
              : t('hero.estimatedDue')}{' '}
            ·{' '}
            <Link to={calculationHref} className="text-primary hover:underline underline-offset-2">
              {t('hero.seeCalculation')}
            </Link>
          </>
        )}
      </p>
    </section>
  );
};

/* ──────────────────────────────── hawl card ──────────────────────────────── */

export interface HawlCardProps {
  /** Fraction of the hawl completed, 0..1. */
  progress: number;
  daysElapsed: number;
  totalDays: number;
  daysRemaining: number;
  /** Human-readable due date, e.g. 'Mar 4, 2027'. */
  dueDate?: string;
  /** Whether current wealth is at or above nisab; `null` when the nisab
   *  threshold is not known yet (loading, or prices unavailable). An unknown
   *  state must never render as "Below nisab" — that is a claim about the
   *  user's obligation, not a placeholder. */
  aboveNisab: boolean | null;
  hawlHref?: string;
  paymentHref?: string;
}

export const HawlCard: React.FC<HawlCardProps> = ({
  progress,
  daysElapsed,
  totalDays,
  daysRemaining,
  dueDate,
  aboveNisab,
  hawlHref = '/nisab-records',
  paymentHref = '/payments'
}) => {
  const { t } = useTranslation('dashboard');
  const pct = Math.round(progress * 1000) / 10;
  const arcLabel = t('hawl.arcLabel', { percent: pct, elapsed: daysElapsed, total: totalDays });

  return (
    <section
      className="rounded-lg border border-border p-4 sm:p-5 shadow-elev-1"
      style={{
        backgroundImage:
          'radial-gradient(120% 90% at 85% -10%, hsl(var(--primary) / 0.10), transparent 60%)'
      }}
    >
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
        <MoonArc progress={progress} size={128} className="shrink-0 sm:mx-0" label={arcLabel} />

        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <strong className="font-heading font-semibold text-[15px] text-foreground">
              {t('hawl.inProgress')}
            </strong>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                aboveNisab === null
                  ? 'bg-muted text-muted-foreground'
                  : aboveNisab
                    ? 'bg-success-soft text-success'
                    : 'bg-warn-soft text-warn-strong'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  // bg-muted-foreground is NOT a Tailwind class here (it is a text
                  // colour only), so an unknown state reuses the warn dot rather
                  // than rendering an unstyled element. The label carries the
                  // meaning; the dot only needs to be visible.
                  aboveNisab === null || !aboveNisab ? 'bg-warn' : 'bg-success'
                }`}
                aria-hidden="true"
              />
              {aboveNisab === null
                ? t('hawl.nisabUnknown')
                : aboveNisab
                  ? t('hawl.aboveNisab')
                  : t('hawl.belowNisab')}
            </span>
          </div>

          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {dueDate ? (
              <Trans
                ns="dashboard"
                i18nKey="hawl.progressWithDate"
                values={{ elapsed: daysElapsed, total: totalDays, percent: pct, days: daysRemaining, date: dueDate }}
                components={{ b: <strong className="text-foreground" /> }}
              />
            ) : (
              <Trans
                ns="dashboard"
                i18nKey="hawl.progress"
                values={{ elapsed: daysElapsed, total: totalDays, percent: pct, days: daysRemaining }}
                components={{ b: <strong className="text-foreground" /> }}
              />
            )}
          </p>

          <div className="mt-3 flex flex-wrap gap-2.5">
            <Link
              to={hawlHref}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors min-h-[40px]"
            >
              {t('hawl.openRecord')}
            </Link>
            <Link
              to={paymentHref}
              className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-primary hover:underline underline-offset-2 transition-colors min-h-[40px]"
            >
              {t('hawl.recordPayment')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────────────────────────── quick actions ───────────────────────────── */

interface QuickAction {
  to: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Icon chip tint. Amber is reserved for the hawl, so it is used at most once. */
  tone: 'teal' | 'amber' | 'green';
}

// i18n keys, not literals. Resolved inside QuickActions so the array stays a
// plain constant instead of being rebuilt on every render.
const ACTIONS: Array<{
  to: string;
  icon: typeof Wallet;
  titleKey: string;
  subtitleKey: string;
  tone: 'teal' | 'amber' | 'green';
}> = [
  { to: '/assets', icon: Wallet, titleKey: 'quickActions.addAsset', subtitleKey: 'quickActions.addAssetHint', tone: 'teal' },
  { to: '/nisab-records', icon: Moon, titleKey: 'quickActions.hawlRecords', subtitleKey: 'quickActions.hawlRecordsHint', tone: 'amber' },
  { to: '/calculator', icon: Calculator, titleKey: 'quickActions.calculator', subtitleKey: 'quickActions.calculatorHint', tone: 'green' },
  { to: '/learn', icon: BookOpen, titleKey: 'quickActions.learn', subtitleKey: 'quickActions.learnHint', tone: 'teal' }
];

const CHIP_TONES = {
  teal: 'bg-accent text-secondary',
  amber: 'bg-warn-soft text-warn-strong',
  green: 'bg-success-soft text-success'
} as const;

export const QuickActions: React.FC = () => {
  const { t } = useTranslation('dashboard');
  return (
  <>
    <h2 className="font-heading font-semibold text-base text-secondary mt-7 mb-3">
      {t('quickActions.title')}
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
      {ACTIONS.map(({ to, icon: Icon, titleKey, subtitleKey, tone }) => (
        <Link
          key={to}
          to={to}
          className="flex flex-col items-start gap-2 rounded-lg border border-border bg-card p-3.5 shadow-elev-1 hover:border-border-strong transition-colors"
        >
          <span
            className={`inline-flex h-9 w-9 items-center justify-center rounded-[10px] ${CHIP_TONES[tone]}`}
            aria-hidden="true"
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <span className="font-semibold text-[13px] text-foreground">{t(titleKey)}</span>
          <span className="text-xs text-muted-foreground">{t(subtitleKey)}</span>
        </Link>
      ))}
    </div>
  </>
  );
};

/* ──────────────────────── asset row (for the wealth list) ─────────────────── */

const ASSET_ICONS: Record<string, LucideIcon> = {
  cash: Landmark,
  bank: Landmark,
  bank_account: Landmark,
  gold: Coins,
  silver: Coins,
  metals: Coins,
  stocks: TrendingUp,
  investment: TrendingUp,
  investment_account: TrendingUp,
  crypto: Bitcoin,
  cryptocurrency: Bitcoin,
  business: Package,
  business_assets: Package,
  property: Building2,
  real_estate: Building2,
  retirement: PiggyBank,
  debts: CircleDollarSign,
  debts_owed_to_you: CircleDollarSign,
  liability: CreditCard
};

export interface AssetRowProps {
  name: string;
  /** Raw asset type/category; normalised before lookup. */
  type: string;
  value: number;
  currency?: string;
  /** Secondary line, e.g. 'Chase Savings' or '187.4 g'. */
  detail?: string;
  zakatable?: boolean;
}

export const AssetRow: React.FC<AssetRowProps> = ({
  name,
  type,
  value,
  currency,
  detail,
  zakatable
}) => {
  const key = type.toLowerCase().replace(/[\s-]/g, '_');
  const Icon = ASSET_ICONS[key] ?? Wallet;

  return (
    <div className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
      <span
        className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-accent text-secondary"
        aria-hidden="true"
      >
        <Icon className="h-[18px] w-[18px]" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-sm text-foreground">{name}</p>
        {detail && <p className="truncate text-xs text-muted-foreground">{detail}</p>}
      </div>

      <div className="text-end shrink-0">
        <Money value={value} currency={currency} size="sm" />
        {zakatable !== undefined && (
          <p className={`text-xs font-medium ${zakatable ? 'text-success' : 'text-muted-foreground'}`}>
            {zakatable ? 'Zakatable' : 'Exempt'}
          </p>
        )}
      </div>
    </div>
  );
};
