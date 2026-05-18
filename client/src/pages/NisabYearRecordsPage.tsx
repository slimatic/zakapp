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
import toast from 'react-hot-toast';
import { calculateWealth } from '../core/calculations/wealthCalculator';
import { gregorianToHijri } from '../utils/calendarConverter';
import HawlProgressIndicator from '../components/HawlProgressIndicator';
import NisabComparisonWidget from '../components/NisabComparisonWidget';
import ZakatDisplayCard from '../components/tracking/ZakatDisplayCard';
import { PaymentCard } from '../components/tracking/PaymentCard';
import { useNisabRecordRepository } from '../hooks/useNisabRecordRepository';
import { usePaymentRepository } from '../hooks/usePaymentRepository';
import { useAssetRepository } from '../hooks/useAssetRepository';
import { useLiabilityRepository } from '../hooks/useLiabilityRepository';
import { useAuth } from '../contexts/AuthContext';
import { useMaskedCurrency } from '../contexts/PrivacyContext';
import { CreateRecordModal, RecordPaymentModal, NisabRecordCard } from '../components/nisab';

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
  const userCurrency = (user as any)?.settings?.currency || (user as any)?.preferences?.currency || 'USD';
  const defaultNisabBasis = (user?.settings?.preferredNisabStandard as 'GOLD' | 'SILVER') || 'GOLD';

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

  // Format currency
  const maskedCurrency = useMaskedCurrency();
  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
    return maskedCurrency(formatted);
  };

  // Create Record — now driven by modal
  const handleCreateSubmit = async (payload: {
    assetIds: string[];
    liabilityIds: string[];
    basis: 'GOLD' | 'SILVER';
    date: Date;
    nisabAmount: number;
  }) => {
    const { assetIds, liabilityIds, basis, date, nisabAmount: threshold } = payload;

    try {
      const selectedAssets = allAssets.filter(a => assetIds.includes(a.id));
      const selectedLiabilities = allLiabilities.filter(l => liabilityIds.includes(l.id));

      const { totalWealth, netZakatableWealth } = calculateWealth(selectedAssets, selectedLiabilities);
      const zakatAmount = netZakatableWealth >= threshold ? netZakatableWealth * 0.025 : 0;

      const startDate = date;
      const completionDate = new Date(startDate.getTime() + 354 * 24 * 60 * 60 * 1000);
      const startHijri = gregorianToHijri(startDate);

      await addRecord({
        hawlStartDate: startDate.toISOString(),
        hawlCompletionDate: completionDate.toISOString(),
        hijriYear: startHijri.hy,
        nisabBasis: basis,
        totalWealth,
        zakatableWealth: netZakatableWealth,
        zakatAmount,
        nisabThresholdAtStart: threshold.toString(),
        currency: userCurrency,
        status: 'DRAFT'
      });

      toast.success('Nisab Year Record created');
      setShowCreateModal(false);

      if (allRecords.length === 0) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Failed to create record';
      toast.error(msg);
    }
  };

  // Actions
  const handleRefreshAssets = async (recordId: string) => {
    try {
      const { totalWealth, netZakatableWealth } = calculateWealth(allAssets, allLiabilities);
      const zakatAmount = netZakatableWealth * 0.025;

      await updateRecord(recordId, {
        totalWealth,
        zakatableWealth: netZakatableWealth,
        zakatAmount,
      });

      toast.success('Assets refreshed and calculations updated');
    } catch (error) {
      console.error('Failed to refresh assets:', error);
      toast.error('Failed to update calculations');
    }
  };

  const handleFinalize = async (record: any) => {
    if (window.confirm('Are you sure you want to finalize this record? This will lock it from edits.')) {
      await updateRecord(record.id, { status: 'FINALIZED' });
      toast.success('Record finalized');
    }
  };

  const handleUnlock = async (record: any) => {
    await updateRecord(record.id, { status: 'UNLOCKED' });
    toast.success('Record unlocked');
  };

  const handleDelete = async (record: any) => {
    if (window.confirm('Delete this record? This cannot be undone.')) {
      await removeRecord(record.id);
      if (selectedRecordId === record.id) setSelectedRecordId(null);
      toast.success('Record deleted');
    }
  };

  const handleEditDate = async (recordId: string) => {
    if (!newStartDate) return;
    const start = new Date(newStartDate);
    const completion = new Date(start.getTime() + 354 * 24 * 60 * 60 * 1000);
    const startHijri = gregorianToHijri(start);

    await updateRecord(recordId, {
      hawlStartDate: start.toISOString(),
      hawlCompletionDate: completion.toISOString(),
      hijriYear: startHijri.hy
    });
    setEditingStartDateRecordId(null);
    toast.success('Date updated');
  };

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
            {/* Back button for mobile when record is selected */}
            {selectedRecordId && (
              <button
                onClick={() => setSelectedRecordId(null)}
                className="lg:hidden flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to list
              </button>
            )}

            {/* Status tabs */}
            <div className={`flex gap-2 border-b border-gray-200 overflow-x-auto pb-px ${selectedRecordId ? 'hidden lg:flex' : ''}`}>
              {(['all', 'DRAFT', 'FINALIZED', 'UNLOCKED'] as const).map((status) => {
                const tabLabels: Record<string, string> = { all: 'All', DRAFT: 'Active', FINALIZED: 'Finalized', UNLOCKED: 'Unlocked for Editing' };
                return (
                  <button
                    key={status}
                    onClick={() => {
                      setActiveStatusFilter(status);
                      setSelectedRecordId(null);
                    }}
                    className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${activeStatusFilter === status
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    {tabLabels[status] || status}
                  </button>
                );
              })}
            </div>

            {/* Records list */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
              </div>
            ) : records.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
                <p className="text-gray-600">No {activeStatusFilter === 'all' ? '' : activeStatusFilter} records yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first record →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <NisabRecordCard
                    key={record.id}
                    record={record}
                    isSelected={selectedRecordId === record.id}
                    selectedRecordId={selectedRecordId}
                    showEditPopover={editingStartDateRecordId === record.id}
                    newStartDate={newStartDate}
                    onSelect={() => setSelectedRecordId(record.id)}
                    onFinalize={(e) => { e.stopPropagation(); handleFinalize(record); }}
                    onUnlock={(e) => { e.stopPropagation(); handleUnlock(record); }}
                    onDelete={(e) => { e.stopPropagation(); handleDelete(record); }}
                    onEditDate={(e) => { e.stopPropagation(); setEditingStartDateRecordId(record.id); }}
                    onSaveDate={() => handleEditDate(record.id)}
                    onCancelDate={() => setEditingStartDateRecordId(null)}
                    onDateChange={setNewStartDate}
                    onGeneratePdf={(e) => {
                      e.stopPropagation();
                      const totalLiabilities = allLiabilities.reduce((sum, l) => sum + Number(l.amount || 0), 0);
                      import('../utils/ReportGenerator').then(({ ReportGenerator }) => {
                        const generator = new ReportGenerator();
                        generator.generateHawlStatement(record as any, allAssets, 'User', totalLiabilities);
                      });
                    }}
                    formatCurrency={formatCurrency}
                    currency={userCurrency}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Selected Record Details */}
          <div className="lg:col-span-1">
            {activeRecord ? (
              <div className={`${!selectedRecordId ? 'hidden lg:block' : ''} space-y-4`}>
                <ZakatDisplayCard record={activeRecord} />
                <HawlProgressIndicator record={activeRecord as any} />
                <NisabComparisonWidget record={activeRecord} showDetails={true} />

                {/* Payment summary */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-gray-900">Payment History</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isFullyPaid ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {isFullyPaid ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Obligation:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(totalObligation)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Paid:</span>
                      <span className="font-medium text-green-600">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
                      <span className="text-gray-900 font-medium">Remaining:</span>
                      <span className={`font-bold ${remainingBalance === 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(remainingBalance)}
                      </span>
                    </div>
                  </div>

                  {!isFullyPaid && activeRecord.status === 'DRAFT' && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      + Record Payment
                    </button>
                  )}
                  <div className="mt-4 space-y-2">
                    {recordPayments.map((payment) => (
                      <PaymentCard key={payment.id} payment={payment} />
                    ))}
                    {recordPayments.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">No payments recorded yet.</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleRefreshAssets(activeRecord.id)}
                  className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  🔄 Refresh Calculations
                </button>
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
