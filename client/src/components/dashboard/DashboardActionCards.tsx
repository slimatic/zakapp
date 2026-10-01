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

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Asset, ZakatPayment } from '../../types';
import type { NisabYearRecord } from '../../types/nisabYearRecord';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';

export interface DashboardActionCardsProps {
  assets: Asset[];
  activeNisabRecord: NisabYearRecord | null;
  payments: (ZakatPayment | { amount?: number })[];
}

/**
 * DashboardActionCards Component - "Next Best Action" cards
 * 
 * Displays contextual action cards based on user's current state:
 * - No assets → Show "Add Assets" card
 * - No active nisab year → Show "Start Nisab Year" card  
 * - Owed zakat > paid → Show "Make Payment" card
 * - Otherwise → Show summary/analytics cards
 * 
 * @param assets - User's assets
 * @param activeNisabRecord - Current active nisab year record
 * @param payments - Payment history
 */
export const DashboardActionCards: React.FC<DashboardActionCardsProps> = ({
  assets,
  activeNisabRecord,
  payments,
}) => {
  const { t } = useTranslation('dashboard');
  const { formatCurrency } = useDisplayCurrency();
  const hasAssets = assets.length > 0;
  const hasActiveRecord = activeNisabRecord !== null;
  
  // Calculate if zakat is owed but not fully paid
  const calculateZakatStatus = () => {
    if (!activeNisabRecord) return { owed: 0, paid: 0, needsPayment: false };
    
    const totalAssets = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
    const nisabRate = 0.025; // 2.5%
    const owed = activeNisabRecord && typeof activeNisabRecord.zakatAmount === 'number'
      ? activeNisabRecord.zakatAmount
      : totalAssets * nisabRate;
    const paid = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    return {
      owed,
      paid,
      needsPayment: owed > paid,
    };
  };
  
  const { owed: zakatOwed, paid: zakatPaid, needsPayment } = calculateZakatStatus();
  
  // Determine which card to show based on state
  const renderPrimaryCard = () => {
    // Priority 1: No assets
    if (!hasAssets) {
      return (
        <ActionCard
          variant="primary"
          title={t('actions.addFirstAssetTitle')}
          description={t('actions.addFirstAssetBody')}
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
          href="/assets/new"
          label={t('actions.addAssetLabel')}
        />
      );
    }
    
    // Priority 2: No active nisab year record
    if (!hasActiveRecord) {
      return (
        <ActionCard
          variant="warning"
          title={t('actions.startTrackingTitle')}
          description={t('actions.startTrackingBody')}
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          href="/nisab-records"
          label={t('actions.createRecordLabel')}
        />
      );
    }
    
    // Priority 3: Zakat payment due
    if (needsPayment && zakatOwed > zakatPaid) {
      const remaining = zakatOwed - zakatPaid;
      const remainingText = formatCurrency(remaining);
      return (
        <ActionCard
          variant="urgent"
          title={t('actions.paymentDueTitle')}
          description={t('actions.paymentDueBody', { amount: remainingText })}
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2.5S10.343 13 12 13s3 .895 3 2.5S13.657 18 12 18s-3-.895-3-2.5S10.343 13 12 13zm0-6a1 1 0 110 2 1 1 0 010-2z" />
            </svg>
          }
          href="/payments"
          label={t('actions.makePaymentLabel')}
        />
      );
    }
    
    // Default: Show summary/analytics card
    return (
      <div className="bg-success-soft rounded-lg border border-success/30 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-success-soft rounded-lg text-success">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground mb-2">
              {t('actions.wealthAtGlance')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <StatItem
                label={t('actions.statTotalAssets')}
                value={assets.length.toString()}
              />
              <StatItem
                label={t('actions.statActiveRecord')}
                value={activeNisabRecord?.year || 'N/A'}
              />
              <StatItem
                label={t('actions.statPaymentsMade')}
                value={payments.length.toString()}
              />
              <StatItem
                label={t('actions.statTrackingStatus')}
                value={t('actions.statusActive')}
                className="text-success font-semibold"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/assets"
                className="inline-flex items-center text-sm font-medium text-success hover:text-success/80 hover:underline"
              >
                {t('viewAllAssets')}
                <svg className="w-4 h-4 ms-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                to="/payments"
                className="inline-flex items-center text-sm font-medium text-success hover:text-success/80 hover:underline"
              >
                {t('actions.paymentHistory')}
                <svg className="w-4 h-4 ms-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4" data-testid="dashboard-action-cards">
      {renderPrimaryCard()}
    </div>
  );
};

/**
 * Individual Action Card Component
 * 
 * Reusable card UI for action prompts with different variants
 */
interface ActionCardProps {
  variant: 'primary' | 'warning' | 'urgent' | 'success';
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  label: string;
}

const ActionCard: React.FC<ActionCardProps> = ({
  variant,
  title,
  description,
  icon,
  href,
  label,
}) => {
  const variantStyles = {
    primary: {
      bg: 'bg-accent',
      border: 'border-border',
      iconBg: 'bg-accent',
      iconColor: 'text-secondary',
      titleColor: 'text-secondary',
      descColor: 'text-secondary',
      buttonBg: 'bg-secondary hover:bg-secondary/90 focus:ring-ring', buttonFg: 'text-secondary-foreground',
    },
    warning: {
      bg: 'bg-warn-soft',
      border: 'border-warn/30',
      iconBg: 'bg-warn-soft',
      iconColor: 'text-warn-strong',
      titleColor: 'text-warn-strong',
      descColor: 'text-warn-strong',
      buttonBg: 'bg-warn hover:bg-warn-strong focus:ring-warn', buttonFg: 'text-primary-foreground',
    },
    urgent: {
      bg: 'bg-danger-soft',
      border: 'border-danger/30',
      iconBg: 'bg-danger-soft',
      iconColor: 'text-danger',
      titleColor: 'text-danger',
      descColor: 'text-danger',
      buttonBg: 'bg-danger hover:bg-danger/90 focus:ring-danger', buttonFg: 'text-danger-foreground',
    },
    success: {
      bg: 'bg-success-soft',
      border: 'border-success/30',
      iconBg: 'bg-success-soft',
      iconColor: 'text-success',
      titleColor: 'text-success',
      descColor: 'text-success',
      buttonBg: 'bg-success hover:bg-success/90 focus:ring-success', buttonFg: 'text-success-foreground',
    },
  };
  
  const styles = variantStyles[variant];
  
  return (
    <div className={`${styles.bg} rounded-lg border-2 ${styles.border} p-4 sm:p-6 shadow-sm transition-shadow hover:shadow-md`}>
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {/* Icon */}
        <div className={`${styles.iconBg} rounded-lg p-3 ${styles.iconColor} flex-shrink-0`}>
          {icon}
        </div>
        
        {/* Content */}
        <div className="flex-1">
          <h3 className={`${styles.titleColor} text-lg font-bold mb-1`}>
            {title}
          </h3>
          <p className={`${styles.descColor} text-sm mb-3`}>
            {description}
          </p>
          
          {/* Action Button */}
          <Link
            to={href}
            className={`${styles.buttonBg} inline-flex items-center justify-center px-4 py-2 text-sm font-medium ${styles.buttonFg} rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px]`}
            data-testid={`action-card-${variant}`}
          >
            {label}
            <svg className="ms-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

/**
 * Summary Stat Item Component
 */
const StatItem: React.FC<{
  label: string;
  value: string;
  className?: string;
}> = ({ label, value, className }) => (
  <div className="text-center sm:text-start">
    <dt className="text-xs text-muted-foreground uppercase tracking-wide">{label}</dt>
    <dd className={`mt-1 text-lg font-semibold text-foreground ${className || ''}`}>
      {value}
    </dd>
  </div>
);