/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * RecordDetailPanel — the selected-record sidebar extracted from
 * NisabYearRecordsPage (#341 slice 2). Pure presentation: every action is
 * a prop callback, mirroring the AssetForm/AuthContext extraction pattern.
 */

import React from 'react';
import { RecordRulingsPanel, PaymentHistoryCard } from './index';
import { HawlProgressIndicator } from '../HawlProgressIndicator';
import { NisabComparisonWidget } from '../NisabComparisonWidget';
import { ZakatDisplayCard } from '../tracking/ZakatDisplayCard';

/** Minimal shape of a Nisab year record as consumed by the detail panel. */
export interface NisabRecordLike {
  id: string;
  status?: string;
  [key: string]: unknown;
}

/** Minimal asset shape (live or normalized) for rulings + display. */
export interface DetailAssetLike {
  id: string;
  name?: string;
  category?: string;
  type?: string;
  zakatEligible?: boolean | null;
  isActive?: boolean;
  [key: string]: unknown;
}

export interface RecordDetailPanelProps {
  record: NisabRecordLike;
  /** Assets already filtered to active, in display currency. */
  assets: DetailAssetLike[];
  methodologyName: string;
  totalObligation: number;
  totalPaid: number;
  remainingBalance: number;
  isFullyPaid: boolean;
  payments: unknown[];
  canRecordPayment: boolean;
  onRecordPayment: () => void;
  onRefreshCalculations: () => void;
  formatCurrency: (amount: number, currency?: string) => string;
}

export const RecordDetailPanel: React.FC<RecordDetailPanelProps> = ({
  record,
  assets,
  methodologyName,
  totalObligation,
  totalPaid,
  remainingBalance,
  isFullyPaid,
  payments,
  canRecordPayment,
  onRecordPayment,
  onRefreshCalculations,
  formatCurrency,
}) => {
  return (
    <div className="space-y-4">
      <ZakatDisplayCard record={record as never} />
      <RecordRulingsPanel
        assets={assets.map(a => ({
          id: a.id,
          name: a.name || 'Unnamed asset',
          category: a.category,
          type: a.type,
          zakatEligible: a.zakatEligible,
        }))}
        methodologyName={methodologyName}
      />
      <HawlProgressIndicator record={record as never} />
      <NisabComparisonWidget record={record as never} showDetails={true} />

      {/* Payment summary */}
      <PaymentHistoryCard
        totalObligation={totalObligation}
        totalPaid={totalPaid}
        remainingBalance={remainingBalance}
        isFullyPaid={isFullyPaid}
        recordStatus={record.status || 'DRAFT'}
        payments={payments}
        canRecordPayment={canRecordPayment}
        onRecordPayment={onRecordPayment}
        formatCurrency={formatCurrency}
      />

      <button
        onClick={onRefreshCalculations}
        className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
      >
        🔄 Refresh Calculations
      </button>
    </div>
  );
};