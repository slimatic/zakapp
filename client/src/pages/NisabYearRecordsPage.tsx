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
import { PaymentRecordForm } from '../components/tracking/PaymentRecordForm';
import { useNisabRecordRepository } from '../hooks/useNisabRecordRepository';
import { usePaymentRepository } from '../hooks/usePaymentRepository';
import { useAssetRepository } from '../hooks/useAssetRepository';
import { useLiabilityRepository } from '../hooks/useLiabilityRepository';
import { useMaskedCurrency } from '../contexts/PrivacyContext';
import { Button } from '../components/ui/Button';
import { AssetSelectionTable } from '../components/tracking/AssetSelectionTable';
import { LiabilitySelectionTable } from '../components/tracking/LiabilitySelectionTable';
import { Modal } from '../components/ui/Modal';

// AssetSelectionList replaced by imported AssetSelectionTable

export const NisabYearRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const hasProcessedCreateParam = useRef(false);

  // Repositories
  const { records: allRecords, isLoading, addRecord, removeRecord, updateRecord } = useNisabRecordRepository();
  const { payments: allPayments } = usePaymentRepository();
  const { assets: allAssets } = useAssetRepository();
  const { liabilities: allLiabilities } = useLiabilityRepository();

  // State
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'DRAFT' | 'FINALIZED' | 'UNLOCKED'>('all');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Modals & UI State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1); // 1: Assets, 2: Liabilities, 3: Confirm

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [selectedLiabilityIds, setSelectedLiabilityIds] = useState<string[]>([]);

  const [nisabBasis, setNisabBasis] = useState<'GOLD' | 'SILVER'>('GOLD');
  const [editingStartDateRecordId, setEditingStartDateRecordId] = useState<string | null>(null);
  const [newStartDate, setNewStartDate] = useState<string>('');

  // Filter records locally
  const records = React.useMemo(() => {
    if (activeStatusFilter === 'all') return allRecords;
    return allRecords.filter(r => r.status === activeStatusFilter);
  }, [allRecords, activeStatusFilter]);

  const activeRecord = selectedRecordId ? allRecords.find(r => r.id === selectedRecordId) : null;

  // Filter payments for selected record
  const recordPayments = React.useMemo(() => {
    if (!selectedRecordId) return [];
    // Sort payments by date descending
    return allPayments
      .filter(p => p.snapshotId === selectedRecordId)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }, [allPayments, selectedRecordId]);

  // Open create modal when ?create=true is present in the URL
  const [searchParams, setSearchParams] = useSearchParams();

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

  // Default asset selection logic (select all zakatable)
  useEffect(() => {
    if (showCreateModal && selectedAssetIds.length === 0 && allAssets.length > 0) {
      // Filter for assets that are generally considered zakatable
      const potentialZakatableTypes = ['CASH', 'GOLD', 'SILVER', 'CRYPTOCURRENCY', 'BUSINESS_ASSETS', 'INVESTMENT_ACCOUNT', 'STOCKS'];
      const defaultSelected = allAssets
        .filter(a => potentialZakatableTypes.includes(a.type) || a.zakatEligible)
        .map(a => a.id);
      setSelectedAssetIds(defaultSelected);
    }
    // Default liability selection: Select all deductible liabilities
    if (showCreateModal && selectedLiabilityIds.length === 0 && allLiabilities.length > 0) {
      // Simple default: Select none, let user opt-in (safer?) OOR select 'Deductible' ones?
      // Let's implement smart default: Select ones due within 354 days
      const hawlDurationMs = 355 * 24 * 60 * 60 * 1000;
      const cutoffDate = new Date(Date.now() + hawlDurationMs);
      const defaultLiabs = allLiabilities.filter(l => {
        const d = new Date(l.dueDate);
        return !isNaN(d.getTime()) && d <= cutoffDate && l.isActive;
      }).map(l => l.id);
      setSelectedLiabilityIds(defaultLiabs);
    }
  }, [showCreateModal, allAssets.length, allLiabilities.length]); // Intentionally not dependent on IDs to avoid loop

  // Reset wizard on close
  useEffect(() => {
    if (!showCreateModal) {
      setCreateStep(1);
      setNisabBasis('GOLD');
    }
  }, [showCreateModal]);

  // Status badges
  const statusBadges: Record<string, { color: string; label: string }> = {
    'DRAFT': { color: 'blue', label: 'Draft' },
    'FINALIZED': { color: 'green', label: 'Finalized' },
    'UNLOCKED': { color: 'amber', label: 'Unlocked for Editing' },
  };

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

  // Create Record
  const handleCreateSubmit = async () => {
    if (selectedAssetIds.length === 0) {
      toast.error('Please select at least one asset');
      return;
    }

    try {
      // Calculate totals
      const selectedAssets = allAssets.filter(a => selectedAssetIds.includes(a.id));
      const selectedLiabilities = allLiabilities.filter(l => selectedLiabilityIds.includes(l.id));

      // Use the updated calculateWealth function
      const { totalWealth, zakatableWealth, netZakatableWealth } = calculateWealth(selectedAssets, selectedLiabilities);
      const zakatAmount = netZakatableWealth * 0.025;

      // Dates
      const startDate = new Date();
      const completionDate = new Date(Date.now() + 354 * 24 * 60 * 60 * 1000); // +1 Lunar Year approx
      const startHijri = gregorianToHijri(startDate);

      await addRecord({
        hawlStartDate: startDate.toISOString(),
        hawlCompletionDate: completionDate.toISOString(),
        hijriYear: startHijri.hy,
        nisabBasis: nisabBasis,
        totalWealth: totalWealth,
        zakatableWealth: netZakatableWealth, // Use NET wealth after liabilities
        zakatAmount: zakatAmount,
        currency: 'USD',
        status: 'DRAFT'
      });

      toast.success('Nisab Year Record created');
      setShowCreateModal(false);
      setSelectedAssetIds([]);
      setSelectedLiabilityIds([]);
      setNisabBasis('GOLD');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to create record');
    }
  };

  // Actions
  const handleRefreshAssets = async (recordId: string) => {
    try {
      // 1. Calculate Totals using shared logic (including all assets for Total, eligible for Zakatable)
      // Note: This needs to respect the record's asset/liability selection snapshots in a real app
      // For now, we recalculate against CURRENT active assets/liabilities as a "Sync"
      const { totalWealth, netZakatableWealth } = calculateWealth(allAssets, allLiabilities);

      const zakatAmount = netZakatableWealth * 0.025;

      // 3. Update Record
      await updateRecord(recordId, {
        totalWealth,
        zakatableWealth: netZakatableWealth,
        zakatAmount,
        // Optional: Update lastUpdated timestamp if schema supported it
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

  // Calculated Preview for Create Modal
  const previewCalculation = React.useMemo(() => {
    const assets = allAssets.filter(a => selectedAssetIds.includes(a.id));
    const liabilities = allLiabilities.filter(l => selectedLiabilityIds.includes(l.id));
    return calculateWealth(assets, liabilities);
  }, [selectedAssetIds, selectedLiabilityIds, allAssets, allLiabilities]);

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
              <button
                onClick={() => {
                  import('../utils/ReportGenerator').then(({ ReportGenerator }) => {
                    new ReportGenerator().generateMethodologyReport();
                  });
                }}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                title="Download Zakat Calculation Methodology"
              >
                <span>📜</span>
                <span className="hidden sm:inline">Methodology</span>
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
              {(['all', 'DRAFT', 'FINALIZED', 'UNLOCKED'] as const).map((status) => (
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
                  {status === 'all' ? 'All' : statusBadges[status]?.label || status}
                </button>
              ))}
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
                {records.map((record) => {
                  const badge = statusBadges[record.status || 'DRAFT'] || { color: 'gray', label: record.status || 'Unknown' };
                  const isSelected = selectedRecordId === record.id;
                  const startDate = new Date(record.hawlStartDate || new Date());
                  const startDateFormatted = startDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  const zakatAmount = parseFloat(String(record.zakatAmount || record.finalZakatAmount || '0'));
                  const totalWealth = parseFloat(String(record.totalWealth || '0'));
                  const zakatableWealth = parseFloat(String(record.zakatableWealth || '0'));

                  // Mobile hide logic
                  const shouldHideOnMobile = selectedRecordId && !isSelected;

                  return (
                    <div
                      key={record.id}
                      onClick={() => setSelectedRecordId(record.id)}
                      className={`border rounded-lg p-4 sm:p-5 cursor-pointer transition-all ${shouldHideOnMobile ? 'hidden lg:block' : ''
                        } ${isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md'
                        }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                              {Number(record.hijriYear || 0) > 0 ? `${record.hijriYear} H` : startDateFormatted}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${badge.color === 'green' ? 'bg-green-100 text-green-800' :
                              badge.color === 'blue' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                              {badge.label}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Nisab Basis</div>
                            <div className="text-sm font-medium text-gray-900">
                              {record.nisabBasis === 'GOLD' ? '🟡 Gold' : '⚪ Silver'}
                            </div>
                          </div>
                          {totalWealth > 0 && (
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Total Wealth</div>
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(totalWealth)}</div>
                            </div>
                          )}
                          {zakatableWealth > 0 && (
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Zakatable</div>
                              <div className="text-sm font-medium text-green-700">{formatCurrency(zakatableWealth)}</div>
                            </div>
                          )}
                          {zakatAmount > 0 && (
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Zakat Obligation</div>
                              <div className="text-sm font-bold text-blue-700">{formatCurrency(zakatAmount)}</div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3 sm:gap-4 text-xs text-gray-600 flex-wrap">
                          <div>Started: <span className="text-gray-900 font-medium">{startDateFormatted}</span></div>
                          {record.hawlCompletionDate && (
                            <div>Ends: <span className="text-gray-900 font-medium">{new Date(record.hawlCompletionDate).toLocaleDateString()}</span></div>
                          )}
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {isSelected && record.status === 'DRAFT' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingStartDateRecordId(record.id); setNewStartDate((record.hawlStartDate || new Date().toISOString()).split('T')[0]); }}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs border border-gray-300 hover:bg-gray-200"
                            >
                              Change Date
                            </button>
                          )}

                          {editingStartDateRecordId === record.id && (
                            <div className="absolute bg-white border p-2 shadow-lg z-10" onClick={e => e.stopPropagation()}>
                              <input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} className="border p-1" />
                              <button onClick={() => handleEditDate(record.id)} className="bg-green-600 text-white px-2 py-1 ml-2">Save</button>
                              <button onClick={() => setEditingStartDateRecordId(null)} className="text-red-600 px-2 py-1 ml-1">Cancel</button>
                            </div>
                          )}

                          {record.status === 'DRAFT' && (
                            <button onClick={(e) => { e.stopPropagation(); handleFinalize(record); }} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Finalize</button>
                          )}
                          {record.status === 'FINALIZED' && (
                            <button onClick={(e) => { e.stopPropagation(); handleUnlock(record); }} className="px-2 py-1 bg-amber-600 text-white rounded text-xs">Unlock</button>
                          )}
                          {record.status === 'FINALIZED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                import('../utils/ReportGenerator').then(({ ReportGenerator }) => {
                                  const generator = new ReportGenerator();
                                  generator.generateHawlStatement(record as any, allAssets, 'User'); // TODO: Pass real user name
                                });
                              }}
                              className="px-2 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs hover:bg-gray-200 flex items-center gap-1"
                            >
                              📄 PDF
                            </button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(record); }} className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs">Delete</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar - stacks below main content on mobile */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {activeRecord ? (
              <>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2 px-1">
                  <span>Record ID</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(activeRecord.id);
                      toast.success('Record ID copied to clipboard');
                    }}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    title="Copy Record ID for imports"
                  >
                    <span className="font-mono">{activeRecord.id.slice(0, 8)}...</span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <HawlProgressIndicator record={activeRecord as any} />
                <NisabComparisonWidget record={activeRecord} showDetails={true} />
                <ZakatDisplayCard
                  record={activeRecord as any}
                  onFinalize={() => handleFinalize(activeRecord)}
                  onRefreshAssets={() => handleRefreshAssets(activeRecord.id)}
                  isLoadingAssets={false}
                />

                {/* Payments for this record */}
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Zakat Payments</h3>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Payment
                    </button>
                  </div>

                  <div className="space-y-3">
                    {recordPayments.length > 0 ? recordPayments.map(p => (
                      <PaymentCard
                        key={p.id}
                        payment={p}
                        nisabYear={activeRecord as any}
                        compact={true}
                      />
                    )) : (
                      <p className="text-sm text-gray-500 italic text-center py-4">No payments recorded for this period.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="hidden lg:block rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
                Select a record to view details
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={`Create Nisab Record - Step ${createStep} of 3`} size="lg">
        {/* Step Indicator */}
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2">
            {createStep === 1 && "Confirm the assets to include in this Zakat year calculation."}
            {createStep === 2 && "Deduct valid liabilities to determine your net Zakatable wealth."}
            {createStep === 3 && "Review your configuration and set the Nisab Standard."}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(createStep / 3) * 100}%` }}></div>
          </div>
        </div>

        <div className="space-y-6 pt-2 h-[60vh] overflow-y-auto">
          {createStep === 1 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900">Inclusive Assets</h3>
                <span className="text-xs text-gray-500">{selectedAssetIds.length} selected</span>
              </div>
              {/* Using Imported AssetSelectionTable */}
              <AssetSelectionTable
                assets={allAssets}
                initialSelection={selectedAssetIds}
                onSelectionChange={setSelectedAssetIds}
              />
              <div className="bg-blue-50 p-3 rounded text-xs text-blue-700">
                💰 Estimated Wealth: {formatCurrency(allAssets.filter(a => selectedAssetIds.includes(a.id)).reduce((sum, a) => sum + (Number(a.value) || 0), 0))}
              </div>
            </div>
          )}

          {createStep === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900">Deductible Liabilities</h3>
                <span className="text-xs text-gray-500">{selectedLiabilityIds.length} selected</span>
              </div>
              <LiabilitySelectionTable
                liabilities={allLiabilities}
                selectedLiabilityIds={selectedLiabilityIds}
                onSelectionChange={setSelectedLiabilityIds}
              />
              <div className="bg-amber-50 p-3 rounded text-xs text-amber-800 flex items-center gap-2">
                <span className="text-xl">📉</span>
                <div>
                  <strong>Deductible Liabilities:</strong> {formatCurrency(allLiabilities.filter(l => selectedLiabilityIds.includes(l.id)).reduce((sum, l) => sum + (Number(l.amount) || 0), 0))}
                  <br />
                  <span className="opacity-75">Only debts due within the coming lunar year are deducted.</span>
                </div>
              </div>
            </div>
          )}

          {createStep === 3 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded text-center">
                  <span className="block text-xs text-gray-500 uppercase">Total Assets</span>
                  <span className="block text-xl font-bold text-gray-900">{formatCurrency(previewCalculation.totalWealth)}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded text-center border border-green-100 bg-green-50">
                  <span className="block text-xs text-green-700 uppercase font-medium">Net Zakatable</span>
                  <span className="block text-xl font-bold text-green-700">{formatCurrency(previewCalculation.netZakatableWealth)}</span>
                </div>
              </div>

              {/* Nisab Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Select Nisab Standard</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={`flex items-center justify-between p-4 rounded border cursor-pointer hover:bg-gray-50 transition-colors ${nisabBasis === 'GOLD' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200'}`}>
                    <div className="flex items-center">
                      <input type="radio" name="nisab" checked={nisabBasis === 'GOLD'} onChange={() => setNisabBasis('GOLD')} className="mr-3 h-4 w-4 text-blue-600" />
                      <div>
                        <span className="block font-medium text-gray-900">Gold Standard</span>
                        <span className="text-xs text-gray-500">For Wealthy/Safer</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono bg-yellow-100 text-yellow-800 px-2 py-1 rounded">87.48g</span>
                  </label>
                  <label className={`flex items-center justify-between p-4 rounded border cursor-pointer hover:bg-gray-50 transition-colors ${nisabBasis === 'SILVER' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200'}`}>
                    <div className="flex items-center">
                      <input type="radio" name="nisab" checked={nisabBasis === 'SILVER'} onChange={() => setNisabBasis('SILVER')} className="mr-3 h-4 w-4 text-blue-600" />
                      <div>
                        <span className="block font-medium text-gray-900">Silver Standard</span>
                        <span className="text-xs text-gray-500">For Low Income</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded">612.36g</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between w-full pt-4 border-t border-gray-100">
          {createStep > 1 ? (
            <Button variant="outline" onClick={() => setCreateStep(s => (s - 1) as 1 | 2 | 3)}>
              ← Back
            </Button>
          ) : (<div />)}

          {createStep < 3 ? (
            <Button onClick={() => setCreateStep(s => (s + 1) as 1 | 2 | 3)}>
              Next Step →
            </Button>
          ) : (
            <Button onClick={handleCreateSubmit} className="bg-green-600 hover:bg-green-700 text-white">
              Start Hawl Tracking
            </Button>
          )}
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} title="Record Zakat Payment" size="md">
        {activeRecord && (
          <PaymentRecordForm
            nisabRecordId={activeRecord.id}
            onSuccess={() => setShowPaymentModal(false)}
            onCancel={() => setShowPaymentModal(false)}
          />
        )}
      </Modal>

    </div>
  );
};
