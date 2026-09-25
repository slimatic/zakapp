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

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { useAssetRepository } from '../hooks/useAssetRepository';
import { useNisabRecordRepository } from '../hooks/useNisabRecordRepository';
import { usePaymentRepository } from '../hooks/usePaymentRepository';
import { useLiabilityRepository } from '../hooks/useLiabilityRepository';
import { useUserSettingsRepository } from '../hooks/useUserSettingsRepository';
import { calculateZakat } from '../core/calculations/zakat';
import { DashboardHero, HawlCard, QuickActions, AssetRow } from '../components/dashboard/DashboardTop';
import { WealthSummaryCard } from '../components/dashboard/WealthSummaryCard';
import { OnboardingGuide } from '../components/dashboard/OnboardingGuide';
import { DashboardActionCards } from '../components/dashboard/DashboardActionCards';
import { SkeletonCard } from '../components/common/SkeletonLoader';
import { AssetsBreakdownChart } from '../components/dashboard/AssetsBreakdownChart';
import { useNisabThreshold } from '../hooks/useNisabThreshold';
import { useDisplayCurrency } from '../hooks/useDisplayCurrency';
import type { Asset } from '../types';
import { useBestAction } from '../hooks/useBestAction';
import { GlossaryTerm } from '../components/common/GlossaryTerm';
import { MigrationWizard } from '../components/migration/MigrationWizard';
import { useMigration } from '../hooks/useMigration';
import { Button } from '../components/ui/Button';

/**
 * Educational Module Component
 * Collapsible educational content about Zakat and Nisab
 */
const EducationalModule: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('zakapp_educational_expanded');
    if (saved === 'true') {
      setIsExpanded(true);
    }
  }, []);

  const toggleExpanded = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('zakapp_educational_expanded', String(newState));
  };

  return (
    <div className="bg-muted rounded-lg border border-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent rounded-lg">
            <svg
              className="w-6 h-6 text-accent-foreground"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-secondary">{t('education.understandingZakat')}</h2>
        </div>

        <button
          onClick={toggleExpanded}
          className="p-2 rounded-md text-muted-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={isExpanded ? 'Collapse educational content' : 'Expand educational content'}
          aria-expanded={isExpanded}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-secondary mb-2">
              <Trans ns="dashboard" i18nKey="education.whatIsZakat" components={{ glossary: <GlossaryTerm term="zakat" /> }} />
            </h3>
            <p className="text-sm text-foreground leading-relaxed">
              <GlossaryTerm term="zakat" /> is one of the Five Pillars of Islam and is an
              obligatory act of charity. It requires Muslims who meet specific wealth criteria
              to donate 2.5% of their qualifying wealth annually to those in need.{' '}
              <GlossaryTerm term="zakat" /> purifies wealth and helps create a more equitable
              society.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-secondary mb-2">
              <Trans ns="dashboard" i18nKey="education.whatIsNisab" components={{ glossary: <GlossaryTerm term="nisab" /> }} />
            </h3>
            <p className="text-sm text-foreground leading-relaxed">
              <GlossaryTerm term="nisab" /> is the minimum threshold of wealth a Muslim
              must possess for one lunar year (<GlossaryTerm term="hawl" />) before{' '}
              <GlossaryTerm term="zakat" /> becomes obligatory. The <GlossaryTerm term="nisab" />{' '}
              can be calculated based on the value of gold (85 grams) or silver (595 grams).
              ZakApp helps you track your wealth and determine when you've reached the{' '}
              <GlossaryTerm term="nisab" /> threshold.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-secondary mb-2">
              <Trans ns="dashboard" i18nKey="education.hawlPeriod" components={{ glossary: <GlossaryTerm term="hawl" /> }} />
            </h3>
            <p className="text-sm text-foreground leading-relaxed">
              The <GlossaryTerm term="hawl" /> is the Islamic lunar year period (354 days)
              during which your wealth must remain above the{' '}
              <GlossaryTerm term="nisab" /> threshold for <GlossaryTerm term="zakat" /> to be
              due. ZakApp's Nisab Year Record feature helps you track this period
              automatically and alerts you when <GlossaryTerm term="zakat" /> payment is due.
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="font-semibold text-secondary mb-3">{t('education.learnMore')}</h3>
            <div className="space-y-2">
              <Link
                to="/learn"
                className="flex items-center text-sm text-secondary hover:text-secondary/80 hover:underline"
              >
                <svg className="w-4 h-4 me-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                Visit Learning Center
              </Link>
              <a
                href="https://youtube.com/playlist?list=PLXguldgkbZPffh6p4efOetXkTeJATAbcS&si=CoJ4JB5dLrJDgNS7"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-secondary hover:text-secondary/80 hover:underline"
              >
                <svg className="w-4 h-4 me-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Watch: Simple Zakat Guide (Video Series)
              </a>
            </div>
          </div>
        </div>
      )}

      {!isExpanded && (
        <span className="text-sm text-foreground/80 block">
          Learn about <GlossaryTerm term="zakat" /> obligations, <GlossaryTerm term="nisab" /> threshold, and the <GlossaryTerm term="hawl" /> period. Click to expand.
        </span>
      )}
    </div>
  );
};

/**
 * Dashboard Component - Refactored as Central Hub
 * 
 * Features:
 * - Smart Journey Card (OnboardingGuide + NextBestAction)
 * - Wealth Summary
 * - Active Record Widget
 * - Educational Module
 */
export const Dashboard: React.FC = () => {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Migration wizard state
  const { needsMigration } = useMigration();
  const [showMigration, setShowMigration] = useState(false);

  // Local Data Repositories (RxDB) - moved before useEffect
  const { assets, isLoading: assetsLoading, error: assetsError } = useAssetRepository();
  const { activeRecord, isLoading: recordsLoading, error: recordsError } = useNisabRecordRepository();
  const { payments, isLoading: paymentsLoading } = usePaymentRepository();
  const { liabilities, isLoading: liabilitiesLoading } = useLiabilityRepository();
  const { settings } = useUserSettingsRepository();

  const hasAssets = assets.length > 0;
  const hasActiveRecord = activeRecord !== null;
  const hasPayments = payments.length > 0;

  // Redirect to onboarding if setup is incomplete
  // Redirect to onboarding if setup is incomplete
  useEffect(() => {
    // Check if user explicitly skipped via local prefs (fallback for robust UX)
    const localPrefs = user?.id ? localStorage.getItem(`zakapp_local_prefs_${user.id}`) : null;
    let hasSkipped = false;
    if (localPrefs) {
      try {
        const prefs = JSON.parse(localPrefs);
        if (prefs.skipped) hasSkipped = true;
      } catch (e) {
        console.warn('Dashboard: Failed to parse local prefs', e);
      }
    }

    // Only redirect if NOT complete AND NOT skipped AND NO ASSETS/RECORDS
    // (Legacy users or partially synced users might have assets but isSetupCompleted=false)
    if (user && user.isSetupCompleted === false && !hasSkipped && !hasAssets && !hasActiveRecord) {
      navigate('/onboarding');
    }
  }, [user, navigate, hasAssets, hasActiveRecord]);

  // Calculate total wealth
  const totalWealth = assets.reduce((sum: number, asset: Asset) => {
    return sum + (asset.value || 0);
  }, 0);

  // Determine completed steps based on state
  const completedSteps = useMemo(() => {
    const steps: number[] = [];
    if (hasAssets) steps.push(1);
    // Logic: If user has significant assets, they should have a record.
    if (hasActiveRecord) steps.push(2);
    // Step 3 (Payments) is completed if a payment is recorded
    if (hasPayments) steps.push(3);
    return steps;
  }, [hasAssets, hasActiveRecord, hasPayments]);

  const isOnboardingComplete = completedSteps.includes(3);

  // Use the new Smart Action hook
  // Pass isOnboardingComplete to prevent premature "Maintenance" suggestions
  const bestAction = useBestAction(
    user,
    assets,
    activeRecord,
    hasAssets,
    hasActiveRecord,
    totalWealth,
    isOnboardingComplete
  );

  // Determine current onboarding step based on state
  const currentStep = useMemo(() => {
    if (!hasAssets) return 1;
    if (!hasActiveRecord && totalWealth > 0) return 2;
    // If Onboarding is "Complete", we default to 3 (Tracking Payments) 
    // OR return to 1 if we want the "Keep Up Good Work" cycle. 
    // Since OnboardingGuide handles `bestAction` overrides, setting 3 here is safe default.
    return 3;
  }, [hasAssets, hasActiveRecord, totalWealth]);

  // Get Nisab threshold (use live value for consistency with other pages)
  const nisabBasis = (activeRecord?.nisabBasis || 'GOLD') as 'GOLD' | 'SILVER';
  // Issue #310 (v0.15.2 regression): resolve currency from the local RxDB
  // settings store FIRST (baseCurrency) — the auth-context blob may lag or
  // still say USD for users who set their currency locally.
  const display = useDisplayCurrency();
  const userCurrency = display.currency;
  const {
    nisabAmount,
    goldPrice,
    silverPrice,
    isLoading: nisabLoading,
    error: nisabError,
  } = useNisabThreshold(userCurrency, nisabBasis);

  /* ── Hero figures: canonical calculation, never a guess ───────────────────
   *
   * The nisab threshold and the zakat figure are the two numbers on this page a
   * user may act on financially, so both come from the canonical engine or from
   * an explicit unknown state. Nothing here fabricates a plausible number.
   *
   * Previously this page did two things that produced confident untruths:
   *   nisabThreshold = nisabAmount || 5000   -> an arbitrary USD threshold used
   *       to print "Above nisab" while loading, on error, and for users whose
   *       real nisab is nothing like 5,000 (e.g. an IDR account).
   *   zakatDue = totalWealth * 0.025         -> 2.5% of EVERY asset, including
   *       exempt ones, ignoring liabilities and the user's madhab, and replacing
   *       a legitimate zero with an invented positive.
   *
   * `calculateZakat` is the canonical engine (client/src/core/calculations/
   * zakat.ts). The record's own zakatAmount is used only when the record can be
   * trusted to be that same calculation: it carries a nisabBasis and a positive
   * figure. A zero is a real result, not an absence, so it is never replaced.
   */

  // The canonical basis: methodology decides nisab source, jewelry exemption and
  // which liabilities are deductible. Read from the same store the rest of the
  // app uses, defaulting to STANDARD only when the user has never chosen.
  const methodology = ((settings?.preferredMethodology || 'STANDARD').toUpperCase()) as
    | 'STANDARD'
    | 'HANAFI'
    | 'SHAFII'
    | 'MALIKI'
    | 'HANBALI';

  const toNum = (v: unknown): number => {
    const n = typeof v === 'string' ? parseFloat(v) : (v as number);
    return Number.isFinite(n) ? (n as number) : 0;
  };

  // Real metal prices -> the nisab pair the engine expects. Undefined prices must
  // NOT become zero: a zero nisab would mark every user as "Above nisab".
  const nisabPrices = useMemo(
    () =>
      goldPrice !== undefined && silverPrice !== undefined
        ? { gold: goldPrice * 87.48, silver: silverPrice * 612.36 }
        : null,
    [goldPrice, silverPrice]
  );

  const calculation = useMemo(() => {
    if (!nisabPrices) return null;
    return calculateZakat(assets, liabilities, nisabPrices, methodology);
  }, [assets, liabilities, nisabPrices, methodology]);

  /**
   * Unknown / not-yet-calculated state. Distinguishes "still loading" from
   * "cannot be determined", because the UI must say different things.
   */
  const heroState: 'loading' | 'ready' | 'unavailable' =
    assetsLoading || recordsLoading || liabilitiesLoading || nisabLoading
      ? 'loading'
      : !nisabPrices || nisabError || !calculation
        ? 'unavailable'
        : 'ready';

  // A record's own figure is authoritative for the running hawl, but only once we
  // have a real basis. Zero is honoured; the record must also carry a nisabBasis
  // so we can tell which threshold produced it.
  const recordedZakat = useMemo(() => {
    if (!activeRecord?.nisabBasis) return null;
    const raw = activeRecord.zakatAmount;
    if (raw === null || raw === undefined || raw === '') return null;
    const n = toNum(raw);
    return Number.isFinite(n) ? n : null;
  }, [activeRecord]);

  const zakatDue: number | null =
    heroState !== 'ready'
      ? null
      : recordedZakat !== null
        ? recordedZakat
        : (calculation?.zakatDue ?? null);

  // Total paid against the current obligation. Extracted from an inline
  // `payments.reduce(...)` that each render re-computed.
  const paymentsTotal = useMemo(
    () => payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    [payments]
  );

  // Hijri year for the hero note, when the record carries one.
  const hijriYear = useMemo(() => {
    const raw = (activeRecord as { hijriYear?: string | number } | null)?.hijriYear;
    return raw ? String(raw) : undefined;
  }, [activeRecord]);

  /* ── Hawl progress ─────────────────────────────────────────────────────── */

  const TOTAL_HAWL_DAYS = 354; // lunar year

  const hawl = useMemo(() => {
    const startStr = activeRecord?.hawlStartDate || activeRecord?.startDate;
    let elapsed = toNum(activeRecord?.daysElapsed);
    let remaining = toNum(activeRecord?.daysRemaining);

    if (startStr) {
      const start = new Date(startStr);
      if (!Number.isNaN(start.getTime())) {
        const diffDays = Math.floor((Date.now() - start.getTime()) / 86_400_000);
        elapsed = Math.max(0, diffDays);
        remaining = Math.max(0, TOTAL_HAWL_DAYS - elapsed);
      }
    }

    const progress = Math.min(Math.max(elapsed / TOTAL_HAWL_DAYS, 0), 1);
    const due = activeRecord?.hawlCompletionDate;
    const dueDate = due
      ? new Date(due).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : undefined;

    return { elapsed, remaining, progress, dueDate };
  }, [activeRecord]);

  // Undefined until the threshold is known — the UI renders "nisab unknown"
  // rather than guessing a comparison against a fabricated 5,000.
  const nisabThreshold: number | null = nisabAmount ?? null;
  const aboveNisab: boolean | null =
    nisabThreshold === null || heroState !== 'ready' ? null : totalWealth >= nisabThreshold;

  // Loading state
  if (assetsLoading || recordsLoading || paymentsLoading) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <div className="h-8 bg-muted rounded animate-pulse w-1/3 mb-2" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // Error state
  if (assetsError || recordsError) {
    return (
      <div>
        <ErrorMessage
          error={assetsError || recordsError}
          title="Failed to load dashboard"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero: greeting + estimated zakat due (the page's focal figure) */}
      <DashboardHero
        userName={user?.firstName || user?.username}
        zakatDue={zakatDue}
        currency={userCurrency}
        hijriYear={hijriYear}
      />

      {/* Migration Banner */}
      {needsMigration && !showMigration && (
        <div className="bg-accent p-4 rounded-lg border border-border flex items-center justify-between gap-4 shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-card rounded-lg flex-shrink-0">
              <svg className="w-6 h-6 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-secondary">{t('privacy.upgradeAvailable')}</p>
              <p className="text-sm text-foreground">{t('privacy.upgradeHint')}</p>
            </div>
          </div>
          <Button onClick={() => setShowMigration(true)} size="sm" className="flex-shrink-0">
            Learn More
          </Button>
        </div>
      )}
      
      {/* Migration Wizard Modal */}
      <MigrationWizard 
        open={showMigration} 
        onClose={() => setShowMigration(false)} 
      />

      {/* Dashboard Action Cards - Show when dashboard is empty or needs action */}
      {/* Replaces OnboardingGuide for simple "Next Best Action" prompts */}
      {/* Was `assets.reduce(...) * 0.025` — the same 2.5%-of-every-asset
          fabrication the hero used, inlined into a render condition. It decided
          whether to nudge the user to pay using an invented obligation, and
          summed assets twice (line 486 and again at line 411). Now the nudge is
          driven by the canonical figure; when it is unknown, we show the action
          cards, because prompting the user to check is the safe direction. */}
      {(!hasAssets ||
        !hasActiveRecord ||
        (activeRecord && paymentsTotal < (zakatDue ?? Number.POSITIVE_INFINITY))) ? (
        <DashboardActionCards
          assets={assets}
          activeNisabRecord={activeRecord}
          payments={payments}
        />
      ) : (
        <OnboardingGuide
          currentStep={currentStep as 1 | 2 | 3}
          completedSteps={completedSteps}
          bestAction={bestAction || undefined}
          isOnboardingComplete={isOnboardingComplete}
        />
      )}

      {/* Hawl card - the moon arc is the signature component */}
      {hasActiveRecord && activeRecord && (
        <HawlCard
          progress={hawl.progress}
          daysElapsed={hawl.elapsed}
          totalDays={354}
          daysRemaining={hawl.remaining}
          dueDate={hawl.dueDate}
          aboveNisab={aboveNisab}
        />
      )}

      {/* Quick actions */}
      <QuickActions />

      {/* Main Content Area */}
      {hasAssets && (
        <div className="space-y-6">

          {/* Wealth and Breakdown Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <WealthSummaryCard
              totalWealth={totalWealth}
              nisabThreshold={nisabThreshold}
              currency={userCurrency}
            />

            <div className="bg-card rounded-lg shadow-card p-6 border border-border">
              <AssetsBreakdownChart
                assets={assets}
                currency={userCurrency}
              />
            </div>
          </div>

          {/* Recent Assets Summary */}
          <div className="bg-card rounded-lg shadow-card p-6 border border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-secondary">{t('assets.yourAssets')}</h2>
              <Link
                to="/assets"
                className="text-sm font-medium text-success hover:underline"
              >
                View All →
              </Link>
            </div>

            <div>
              {assets.slice(0, 5).map((asset: Asset) => (
                <AssetRow
                  key={asset.id}
                  name={asset.name}
                  type={asset.type || 'other'}
                  value={asset.value || 0}
                  currency={asset.currency}
                  detail={asset.type ? asset.type.replace(/_/g, ' ') : undefined}
                  zakatable={asset.zakatEligible !== false}
                />
              ))}

              {assets.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No assets added yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Educational Module (Always visible at bottom) */}
      <EducationalModule />
    </div>
  );
};