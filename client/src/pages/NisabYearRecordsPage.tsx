/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * NisabYearRecordsPage (Local-First Refactor)
 *
 * List view with create, finalize, unlock, and audit trail functionality
 * for Nisab Year Records using local RxDB repository.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNisabRecordRepository } from '../hooks/useNisabRecordRepository';
import { usePaymentRepository } from '../hooks/usePaymentRepository';
import { useAssetRepository } from '../hooks/useAssetRepository';
import { useLiabilityRepository } from '../hooks/useLiabilityRepository';
import { useNisabRecordActions } from '../hooks/useNisabRecordActions';
import { useAuth } from '../contexts/AuthContext';
import { useMaskedCurrency } from '../contexts/PrivacyContext';
import { useFxRates } from '../services/apiHooks';
import { useDisplayCurrency } from '../hooks/useDisplayCurrency';
import { normalizeAssetsToCurrency, normalizeLiabilitiesToCurrency, FxRates } from '../utils/currencyNormalization';
import { CreateRecordModal, RecordPaymentModal, RecordListPanel, RecordDetailPanel } from '../components/nisab';

export const NisabYearRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const hasProcessedCreateParam = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Repositories
  const { records: allRecords, isLoading, addRecord, removeRecord, updateRecord } = useNisabRecordRepository();
  const { payments: allPayments } = usePaymentRepository();
  const { assets: allAssets } = useAssetRepository();
  const { liabilities: allLiabilities } = useLiabilityRepository();

  // State
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'DRAFT' | 'FINALIZED' | 'UNLOCKED'>('all');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingStartDateRecordId, setEditingStartDateRecordId] = useState<string | null>(null);
  const [newStartDate, setNewStartDate] = useState<string>('');

  const { user } = useAuth();
  const { currency: userCurrency, formatCurrency } = useDisplayCurrency();
  const defaultNisabBasis = (user?.settings?.preferredNisabStandard as 'GOLD' | 'SILVER') || 'GOLD';

  // Issue #310 (round 4): assets may be stored in mixed currencies (e.g. USD
  // seed data + an IDR car). Normalize everything into the user's display
  // currency BEFORE calculateWealth sums them, so totals are homogeneous.
  const fxRatesQuery = useFxRates();
  const fxRates = fxRatesQuery?.data?.data?.rates as FxRates | undefined;
  const normalizedAssets = React.useMemo(
    () => normalizeAssetsToCurrency(allAssets, userCurrency, fxRates),
    [allAssets, userCurrency, fxRates]
  );
  const normalizedLiabilities = React.useMemo(
    () => normalizeLiabilitiesToCurrency(allLiabilities, userCurrency, fxRates),
    [allLiabilities, userCurrency, fxRates]
  );

  // Filter records locally
  const records = React.useMemo(() => {
    if (activeStatusFilter === 'all') return allRecords;
    return allRecords.filter(r => r.status === activeStatusFilter);
  }, [allRecords, activeStatusFilter]);

  const activeRecord = selectedRecordId ? allRecords.find(r => r.id === selectedRecordId) : null;

  // Filter payments for selected record
  const recordPayments = React.useMemo(() => {
    if (!selectedRecordId) return [];
    return allPayments
      .filter(p => p.snapshotId === selectedRecordId)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [allPayments, selectedRecordId]);

  // Open create modal when ?create=true is present in the URL
  useEffect(() => {
    const shouldCreate = searchParams.get('create');
    if (shouldCreate === 'true' && !hasProcessedCreateParam.current) {
      hasProcessedCreateParam.current = true;
      setShowCreateModal(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('create');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Auto-select first record on Desktop initial load
  useEffect(() => {
    if (!selectedRecordId && records.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSelectedRecordId(records[0].id);
    }
  }, [records, selectedRecordId]);

  // Format currency — consolidated into useDisplayCurrency (#341)
  const maskedCurrency = useMaskedCurrency();

  // Record mutations — extracted into useNisabRecordActions (#341 slice 4)
  const userMethodology = ((user as any)?.settings?.preferredMethodology || 'STANDARD').toUpperCase();
  const {
    createRecord,
    refreshCalculations,
    finalizeRecord,
    unlockRecord,
    deleteRecord,
    saveStartDate,
  } = useNisabRecordActions({
    addRecord,
    updateRecord,
    removeRecord,
    normalizedAssets: normalizedAssets as never,
    normalizedLiabilities: normalizedLiabilities as never,
    userCurrency,
    userMethodology,
    onCreated: () => {
      setShowCreateModal(false);
      if (allRecords.length === 0) {
        navigate('/dashboard');
      }
    },
    onDeleted: (recordId) => {
      if (selectedRecordId === recordId) setSelectedRecordId(null);
    },
    onDateSaved: () => setEditingStartDateRecordId(null),
  });

  const handleCreateSubmit = async (payload: Parameters<typeof createRecord>[0]): Promise<void> => {
    await createRecord(payload);
  };
  const handleRefreshAssets = (recordId: string) => refreshCalculations(recordId);
  const handleFinalize = (record: { id: string }) => finalizeRecord(record);
  const handleUnlock = (record: { id: string }) => unlockRecord(record);
  const handleDelete = (record: { id: string }) => deleteRecord(record);
  const handleEditDate = (recordId: string) => saveStartDate(recordId, newStartDate);


  // Calculate totals for active record
  const totalPaid = recordPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalObligation = Number(activeRecord?.zakatAmount || 0);
  const remainingBalance = Math.max(0, totalObligation - totalPaid);
  const isFullyPaid = totalObligation > 0 && remainingBalance === 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8" id="main-content">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Nisab Year Records</h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">
                Track Hawl periods, Nisab thresholds, and Zakat calculations
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + New Record
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <RecordListPanel
              records={records as never}
              isLoading={isLoading}
              activeStatusFilter={activeStatusFilter}
              onStatusFilterChange={(status) => {
                setActiveStatusFilter(status);
                setSelectedRecordId(null);
              }}
              selectedRecordId={selectedRecordId}
              onSelectRecord={setSelectedRecordId}
              onClearSelection={() => setSelectedRecordId(null)}
              editingStartDateRecordId={editingStartDateRecordId}
              newStartDate={newStartDate}
              onFinalize={handleFinalize}
              onUnlock={handleUnlock}
              onDelete={handleDelete}
              onEditDate={(record) => setEditingStartDateRecordId(record.id)}
              onSaveDate={handleEditDate}
              onCancelDate={() => setEditingStartDateRecordId(null)}
              onDateChange={setNewStartDate}
              onGeneratePdf={(record) => {
                const totalLiabilities = allLiabilities.reduce((sum, l) => sum + Number(l.amount || 0), 0);
                import('../utils/ReportGenerator').then(({ ReportGenerator }) => {
                  const generator = new ReportGenerator(userCurrency);
                  generator.generateHawlStatement(record as any, allAssets, 'User', totalLiabilities);
                });
              }}
              onCreateRecord={() => setShowCreateModal(true)}
              formatCurrency={formatCurrency}
              currency={userCurrency}
            />
          </div>

          {/* Selected Record Details */}
          <div className="lg:col-span-1">
            {activeRecord ? (
              <div className={`${!selectedRecordId ? 'hidden lg:block' : ''}`}>
                <RecordDetailPanel
                  record={activeRecord as never}
                  assets={allAssets.filter(a => a.isActive) as never}
                  methodologyName={((user as any)?.settings?.preferredMethodology || 'STANDARD').toUpperCase()}
                  totalObligation={totalObligation}
                  totalPaid={totalPaid}
                  remainingBalance={remainingBalance}
                  isFullyPaid={isFullyPaid}
                  payments={recordPayments as unknown[]}
                  canRecordPayment={!isFullyPaid && activeRecord.status === 'DRAFT'}
                  onRecordPayment={() => setShowPaymentModal(true)}
                  onRefreshCalculations={() => handleRefreshAssets(activeRecord.id)}
                  formatCurrency={formatCurrency}
                />
              </div>
            ) : (
              <div className="hidden lg:flex flex-col items-center justify-center h-full text-center text-gray-400">
                <p className="max-w-xs mx-auto">
                  Click on any Nisab Year card from the list on the left to view its full wealth breakdown and Zakat obligations.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateRecordModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateSubmit}
        allAssets={allAssets}
        allLiabilities={allLiabilities}
        defaultNisabBasis={defaultNisabBasis}
        userCurrency={userCurrency}
      />

      <RecordPaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        snapshotId={activeRecord?.id || ''}
        onSuccess={() => {
          setShowPaymentModal(false);
          if (allPayments.length === 0) {
            navigate('/dashboard');
          }
        }}
      />
    </div>
  );
};
