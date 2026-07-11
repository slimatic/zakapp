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
import { Link } from 'react-router-dom';
import type { Asset, ZakatPayment } from '../../types';
import type { NisabYearRecord } from '../../types/nisabYearRecord';

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
          title="Add Your First Asset"
          description="Begin your Zakat journey by adding cash, gold, investments, or other assets to track your wealth."
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
          href="/assets/new"
          label="Add Asset"
        />
      );
    }
    
    // Priority 2: No active nisab year record
    if (!hasActiveRecord) {
      return (
        <ActionCard
          variant="warning"
          title="Start Nisab Year Tracking"
          description="Create a Nisab Year Record to begin tracking your Hawl period (354 days) for Zakat calculations."
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          href="/nisab-records"
          label="Create Nisab Record"
        />
      );
    }
    
    // Priority 3: Zakat payment due
    if (needsPayment && zakatOwed > zakatPaid) {
      const remaining = zakatOwed - zakatPaid;
      return (
        <ActionCard
          variant="urgent"
          title="Zakat Payment Due"
          description={`You have Zakat owed: $${remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining to complete your obligation.`}
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2.5S10.343 13 12 13s3 .895 3 2.5S13.657 18 12 18s-3-.895-3-2.5S10.343 13 12 13zm0-6a1 1 0 110 2 1 1 0 010-2z" />
            </svg>
          }
          href="/payments"
          label="Make Payment"
        />
      );
    }
    
    // Default: Show summary/analytics card
    return (
      <div className="bg-gradient-to-r from-green-50 to-cyan-50 rounded-lg border-2 border-green-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-100 rounded-lg text-green-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Your Wealth at a Glance
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <StatItem
                label="Total Assets"
                value={assets.length.toString()}
              />
              <StatItem
                label="Active Record"
                value={activeNisabRecord?.year || 'N/A'}
              />
              <StatItem
                label="Payments Made"
                value={payments.length.toString()}
              />
              <StatItem
                label="Tracking Status"
                value="Active"
                className="text-green-600 font-semibold"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/assets"
                className="inline-flex items-center text-sm font-medium text-green-700 hover:text-green-800 hover:underline"
              >
                View All Assets
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                to="/payments"
                className="inline-flex items-center text-sm font-medium text-green-700 hover:text-green-800 hover:underline"
              >
                Payment History
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      descColor: 'text-blue-800',
      buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-900',
      descColor: 'text-amber-800',
      buttonBg: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    },
    urgent: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      descColor: 'text-red-800',
      buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      titleColor: 'text-green-900',
      descColor: 'text-green-800',
      buttonBg: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
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
            className={`${styles.buttonBg} inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 min-h-[44px]`}
            data-testid={`action-card-${variant}`}
          >
            {label}
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  <div className="text-center sm:text-left">
    <dt className="text-xs text-gray-600 uppercase tracking-wide">{label}</dt>
    <dd className={`mt-1 text-lg font-semibold text-gray-900 ${className || ''}`}>
      {value}
    </dd>
  </div>
);