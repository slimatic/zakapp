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
 * PaymentsPage (Local-First Refactor)
 * Payment recording and management interface using RxDB
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PaymentList } from '../components/tracking/PaymentList';
import { PaymentRecordForm } from '../components/tracking/PaymentRecordForm';
import { usePaymentRepository } from '../hooks/usePaymentRepository';
import { useNisabRecordRepository } from '../hooks/useNisabRecordRepository';
import { Button } from '../components/ui/Button';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';
import { parseDecimalNumber } from '../utils/parseDecimal';
import { useDisplayCurrency } from '../hooks/useDisplayCurrency';

export const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  // Reuse the canonical resolver (includes local RxDB settings, which the
  // hand-rolled chain here omitted) so exports match the rest of the UI (#310).
  const { currency: userCurrency, formatCurrency } = useDisplayCurrency();
  const [searchParams, setSearchParams] = useSearchParams();
  const nisabRecordIdParam = searchParams.get('snapshot');

  // Repositories
  const { records: nisabRecords, isLoading: nisabRecordsLoading } = useNisabRecordRepository();
  const { payments: allPayments } = usePaymentRepository();

  const [nisabRecordId, setNisabRecordId] = useState<string | undefined>(nisabRecordIdParam || undefined);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);

  // Derive filtered payments locally if needed (though PaymentList might handle it)
  // But PaymentList component likely needs to be checked if it uses API hooks too.
  // For now, let's assume PaymentList needs props or refactoring.
  // Checking imports: PaymentList is imported. I should check PaymentList next.

  const handleCreatePayment = () => {
    setEditingPayment(null);
    setShowCreateForm(true);
  };

  const handleEditPayment = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setShowCreateForm(true);
  };

  const handleFormClose = () => {
    setShowCreateForm(false);
    setEditingPayment(null);
  };

  return (
    <div className="space-y-5">
      {/* Page head */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Payments
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Zakat you have distributed, and to which recipients.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              import('../utils/ReportGenerator').then(({ ReportGenerator }) => {
                const generator = new ReportGenerator(userCurrency);
                generator.generatePaymentSummary(allPayments);
              });
            }}
          >
            Export PDF
          </Button>
        </div>
      </div>

      {/* Nisab year filter */}
      {(nisabRecords.length > 0 || allPayments.length > 0) && (
        <div>
          <label htmlFor="nisab-record-select" className="sr-only">
            Filter by Nisab year record
          </label>
          <select
            id="nisab-record-select"
            value={nisabRecordId || 'all'}
            onChange={(e) => {
              const value = e.target.value;
              setNisabRecordId(value === 'all' ? undefined : value);
              setSearchParams(value === 'all' ? {} : { snapshot: value });
            }}
            className="w-full rounded-lg border border-border-strong bg-card px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-ring"
          >
            <option value="all">All payments ({allPayments.length})</option>
            {nisabRecords.map((record) => {
              const zakatAmount = parseDecimalNumber(String(record.zakatAmount || 0));
              const displayAmount = zakatAmount > 0 ? ` (zakat: ${formatCurrency(zakatAmount)})` : '';
              const recordPayments = allPayments.filter((p) => p.snapshotId === record.id).length;
              return (
                <option key={record.id} value={record.id}>
                  {record.hawlStartDate
                    ? new Date(record.hawlStartDate).getFullYear()
                    : (record.gregorianYear || new Date(record.createdAt || new Date().toISOString()).getFullYear())}{' '}
                  - {record.status} {displayAmount} ({recordPayments} payments)
                </option>
              );
            })}
            {allPayments.some((p) => !nisabRecords.find((r) => r.id === p.snapshotId)) && (
              <option value="legacy-import" disabled>
                -- Unassigned / imported ({allPayments.filter((p) => !nisabRecords.find((r) => r.id === p.snapshotId)).length}) --
              </option>
            )}
          </select>
        </div>
      )}

      {/* Warnings - only when there is something genuinely wrong */}
      {!nisabRecordsLoading && allPayments.length > 0 && nisabRecords.length === 0 && (
        <div className="rounded-lg border border-warn/30 bg-warn-soft p-4">
          <h2 className="text-sm font-medium text-warn-strong">
            These payments aren't linked to a hawl year
          </h2>
          <p className="mt-1 text-sm text-warn-strong">
            You have {allPayments.length} payments but no Nisab year records.
            Zakat is calculated per completed lunar year, so payments need a hawl
            to belong to.
          </p>
          <Button onClick={() => navigate('/nisab-records')} size="sm" className="mt-3">
            Create a hawl record
          </Button>
        </div>
      )}

      {/* Create / edit modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6">
          <div className="max-h-[85vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-card shadow-xl sm:max-h-[90vh]">
            <div className="p-4 sm:p-6">
              <div className="mb-4 flex items-center justify-between sm:mb-6">
                <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                  {editingPayment ? 'Edit payment' : 'Record a payment'}
                </h2>
                <button
                  onClick={handleFormClose}
                  className="p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <PaymentRecordForm
                payment={editingPayment || undefined}
                nisabRecordId={nisabRecordId}
                onSuccess={() => {
                  handleFormClose();
                  if (allPayments.length === 0) navigate('/dashboard');
                }}
                onCancel={handleFormClose}
              />
            </div>
          </div>
        </div>
      )}

      {/* Payment list */}
      <PaymentList
        nisabRecordId={nisabRecordId}
        onCreateNew={handleCreatePayment}
        onEditPayment={handleEditPayment}
      />

      {/* Reference - collapsed by default. It was a full always-open panel with
          the eight recipient categories and the wording of Quran 9:60 sitting
          under every payment list. */}
      <details className="rounded-lg border border-border bg-card px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium text-foreground">
          Who can receive zakat?
        </summary>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p>
            Islamic law specifies <strong>eight categories</strong> of eligible
            recipients (Quran 9:60):
          </p>
          <ol className="ms-5 list-decimal space-y-1">
            <li><strong>Al-Fuqara</strong> - the poor</li>
            <li><strong>Al-Masakin</strong> - the needy</li>
            <li><strong>Al-Amilin</strong> - those who collect and distribute zakat</li>
            <li><strong>Al-Muallafah</strong> - new Muslims needing support</li>
            <li><strong>Ar-Riqab</strong> - freeing those in bondage</li>
            <li><strong>Al-Gharimin</strong> - those unable to pay their debts</li>
            <li><strong>Fi Sabilillah</strong> - in the path of Allah</li>
            <li><strong>Ibn as-Sabil</strong> - the stranded traveller</li>
          </ol>
          <p className="pt-1">
            Zakat cannot be given to your parents, grandparents, children,
            grandchildren, or spouse. Give locally where you can, and verify the
            legitimacy of recipients or organisations.
          </p>
        </div>
      </details>
    </div>
  );
};