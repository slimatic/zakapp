/**
 * NisabYearRecordsPage (T065)
 * 
 * List view with create, finalize, unlock, and audit trail functionality
 * for Nisab Year Records
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { gregorianToHijri } from '../utils/calendarConverter';
import HawlProgressIndicator from '../components/HawlProgressIndicator';
import NisabComparisonWidget from '../components/NisabComparisonWidget';
import FinalizationModal from '../components/FinalizationModal';
import UnlockReasonDialog from '../components/UnlockReasonDialog';
import AuditTrailView from '../components/AuditTrailView';
import AssetSelectionTable from '../components/tracking/AssetSelectionTable';
import ZakatDisplayCard from '../components/tracking/ZakatDisplayCard';
import type { Asset } from '../components/tracking/AssetSelectionTable';

export const NisabYearRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const hasProcessedCreateParam = useRef(false);

  // State
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'DRAFT' | 'FINALIZED' | 'UNLOCKED'>('all');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [finalizingRecordId, setFinalizingRecordId] = useState<string | null>(null);
  const [unlockingRecordId, setUnlockingRecordId] = useState<string | null>(null);
  const [showAuditTrail, setShowAuditTrail] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [nisabBasis, setNisabBasis] = useState<'GOLD' | 'SILVER'>('GOLD');
  const [refreshingRecordId, setRefreshingRecordId] = useState<string | null>(null);
  const [editingStartDateRecordId, setEditingStartDateRecordId] = useState<string | null>(null);
  const [newStartDate, setNewStartDate] = useState<string>('');
  const [showPaymentsRecordId, setShowPaymentsRecordId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentRecipientName, setPaymentRecipientName] = useState<string>('');
  const [paymentRecipientType, setPaymentRecipientType] = useState<string>('charity');
  const [paymentRecipientCategory, setPaymentRecipientCategory] = useState<string>('general');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [paymentReceiptReference, setPaymentReceiptReference] = useState<string>('');
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);

  // Fetch records
  const { data: recordsData, isLoading, error } = useQuery({
    queryKey: ['nisab-year-records', activeStatusFilter],
    queryFn: async () => {
      const response = await apiService.getNisabYearRecords({
        status: activeStatusFilter === 'all' ? undefined : [activeStatusFilter],
        limit: 100,
      });

      if (!response.success) {
        throw new Error('Failed to fetch records');
      }

      return response.data;
    },
  });

  // Handle double-wrapped API response structure
  const records = Array.isArray(recordsData) 
    ? recordsData 
    : (recordsData?.records || []);
  const activeRecord = selectedRecordId ? records.find((r: any) => r.id === selectedRecordId) : null;

  // Fetch payments for the selected record
  const { data: paymentsData } = useQuery({
    queryKey: ['payments', selectedRecordId],
    queryFn: async () => {
      if (!selectedRecordId) return [];
      const response = await apiService.getPayments({ snapshotId: selectedRecordId });
      if (!response.success) {
        throw new Error('Failed to fetch payments');
      }
      return response.data?.payments || [];
    },
    enabled: !!selectedRecordId,
  });

  const payments = paymentsData || [];

  // Fetch assets for create modal
  const { data: assetsData, isLoading: isLoadingAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const response = await apiService.getAssets();
      if (!response.success) {
        throw new Error('Failed to fetch assets');
      }
      // Map backend asset format to component format
      const assets = response.data.assets.map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        category: asset.category,
        value: asset.value,
        // Determine if zakatable based on category
        // Cash, gold, silver, crypto, business, investments are zakatable
        isZakatable: ['cash', 'gold', 'silver', 'crypto', 'business', 'investments', 'stocks'].includes(asset.category.toLowerCase()),
        // Use createdAt as addedAt
        addedAt: asset.createdAt || asset.acquisitionDate,
      }));
      return assets as Asset[];
    },
    enabled: showCreateModal, // Only fetch when modal is open
  });

  // Open create modal when ?create=true is present in the URL
  const [searchParams, setSearchParams] = useSearchParams();
  
  useEffect(() => {
    const shouldCreate = searchParams.get('create');
    if (shouldCreate === 'true' && !hasProcessedCreateParam.current) {
      hasProcessedCreateParam.current = true;
      setShowCreateModal(true);
      // Remove the query param so it doesn't re-open on refresh
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('create');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch assets for refresh modal
  const { data: refreshAssetsData, isLoading: isRefreshingAssets } = useQuery({
    queryKey: ['refresh-assets', refreshingRecordId],
    queryFn: async () => {
      if (!refreshingRecordId) return null;
      const response = await apiService.refreshNisabYearRecordAssets(refreshingRecordId);
      if (!response.success) {
        throw new Error('Failed to refresh assets');
      }
      // Map backend asset format to component format
      const assets = response.data.assets.map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        category: asset.category,
        value: asset.value,
        isZakatable: asset.isZakatable, // Backend already determines this
        addedAt: asset.addedAt, // Backend returns addedAt as ISO string
      }));
      return { ...response.data, assets };
    },
    enabled: !!refreshingRecordId,
  });

  // Status badges
  const statusBadges: Record<string, { color: string; label: string }> = {
    'DRAFT': { color: 'blue', label: 'Draft' },
    'FINALIZED': { color: 'green', label: 'Finalized' },
    'UNLOCKED': { color: 'amber', label: 'Unlocked for Editing' },
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Create record mutation
  const createRecordMutation = useMutation({
    mutationFn: async (data: { selectedAssetIds: string[] }) => {
      // Calculate totals from selected assets
      const selectedAssets = (assetsData || []).filter((a) => data.selectedAssetIds.includes(a.id));
      const totalWealth = selectedAssets.reduce((sum, a) => sum + a.value, 0);
      const zakatableWealth = selectedAssets.filter((a) => a.isZakatable).reduce((sum, a) => sum + a.value, 0);
      const zakatAmount = zakatableWealth * 0.025;

      // Calculate Hijri dates
      const startDate = new Date();
      const completionDate = new Date(Date.now() + 354 * 24 * 60 * 60 * 1000);
      const startHijri = gregorianToHijri(startDate);
      const completionHijri = gregorianToHijri(completionDate);
      
      // Format Hijri dates as YYYY-MM-DDH
      const formatHijri = (h: { hy: number; hm: number; hd: number }) => 
        `${h.hy}-${String(h.hm).padStart(2, '0')}-${String(h.hd).padStart(2, '0')}H`;

      // Create record with asset selection
      const response = await apiService.createNisabYearRecord({
        hawlStartDate: startDate.toISOString(),
        hawlStartDateHijri: formatHijri(startHijri),
        hawlCompletionDate: completionDate.toISOString(),
        hawlCompletionDateHijri: formatHijri(completionHijri),
        nisabBasis: nisabBasis, // Use selected nisab basis
        totalWealth,
        zakatableWealth,
        zakatAmount,
        selectedAssetIds: data.selectedAssetIds,
      });

      if (!response.success) {
        throw new Error('Failed to create record');
      }

      return response.data;
    },
    onSuccess: (data) => {
      console.log('Record created successfully:', data);
      // Invalidate all variations of the query key (all status filters)
      queryClient.invalidateQueries({ queryKey: ['nisab-year-records'], exact: false });
      setShowCreateModal(false);
      setSelectedAssetIds([]);
      setNisabBasis('GOLD'); // Reset to default
    },
    onError: (error: any) => {
      console.error('Error creating record:', error);
      alert(`Failed to create record: ${error.message || 'Unknown error'}`);
    },
  });

  // Delete record mutation
  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const response = await apiService.deleteNisabYearRecord(recordId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete record');
      }
      return response;
    },
    onSuccess: () => {
      // Invalidate all variations of the query key (all status filters)
      queryClient.invalidateQueries({ queryKey: ['nisab-year-records'], exact: false });
      setDeletingRecordId(null);
      // Clear selection if deleted record was selected
      if (selectedRecordId === deletingRecordId) {
        setSelectedRecordId(null);
      }
    },
    onError: (error: any) => {
      console.error('Error deleting record:', error);
      alert(`Failed to delete record: ${error.message || 'Unknown error'}`);
      setDeletingRecordId(null);
    },
  });

  // Handle creation
  const handleCreate = () => {
    setShowCreateModal(true);
  };

  // Handle create submit
  const handleCreateSubmit = () => {
    if (selectedAssetIds.length === 0) {
      alert('Please select at least one asset');
      return;
    }
    console.log('Creating record with assets:', selectedAssetIds);
    createRecordMutation.mutate({ selectedAssetIds });
  };

  // Handle refresh assets
  const handleRefreshAssets = (recordId: string) => {
    setRefreshingRecordId(recordId);
  };

  // Handle finalization
  const handleFinalize = (record: any) => {
    setFinalizingRecordId(record.id);
  };

  // Handle unlock
  const handleUnlock = (record: any) => {
    setUnlockingRecordId(record.id);
  };

  // Handle finalization complete
  const handleFinalizationComplete = (finalRecord: any) => {
    // Refetch records
    queryClient.invalidateQueries({ queryKey: ['nisab-year-records'], exact: false });
    setFinalizingRecordId(null);
  };

  // Handle unlock complete
  const handleUnlockComplete = (unlockedRecord: any) => {
    // Refetch records
    queryClient.invalidateQueries({ queryKey: ['nisab-year-records'], exact: false });
    setUnlockingRecordId(null);
  };

  // Handle delete
  const handleDelete = (record: any) => {
    setDeletingRecordId(record.id);
  };

  // Handle delete confirm
  const handleDeleteConfirm = () => {
    if (deletingRecordId) {
      deleteRecordMutation.mutate(deletingRecordId);
    }
  };

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
                onClick={() => navigate('/dashboard')}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleCreate}
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
            {/* Status tabs */}
            <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-px">
              {(['all', 'DRAFT', 'FINALIZED', 'UNLOCKED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setActiveStatusFilter(status);
                    setSelectedRecordId(null);
                  }}
                  className={`px-3 sm:px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap text-sm sm:text-base ${
                    activeStatusFilter === status
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
            ) : error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                Error loading records: {error.message}
              </div>
            ) : records.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
                <p className="text-gray-600">No {activeStatusFilter === 'all' ? '' : activeStatusFilter} records yet</p>
                <button
                  onClick={handleCreate}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first record →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((record: any) => {
                  console.log('Record:', record); // Debug: log record data
                  const badge = statusBadges[record.status] || { color: 'gray', label: record.status || 'Unknown' };
                  const isSelected = selectedRecordId === record.id;
                  const startDate = new Date(record.hawlStartDate);
                  const startDateFormatted = startDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  });
                  const zakatAmount = parseFloat(record.zakatAmount || record.finalZakatAmount || '0');
                  const totalWealth = parseFloat(record.totalWealth || '0');
                  const zakatableWealth = parseFloat(record.zakatableWealth || '0');

                  return (
                    <div
                      key={record.id}
                      onClick={() => setSelectedRecordId(record.id)}
                      className={`border rounded-lg p-4 sm:p-5 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header with title and status */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                              {record.hijriYear}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                badge.color === 'green'
                                  ? 'bg-green-100 text-green-800'
                                  : badge.color === 'blue'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {badge.label}
                            </span>
                          </div>
                        </div>
                          
                        {/* Primary information grid */}
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
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {formatCurrency(totalWealth, record.currency || 'USD')}
                              </div>
                            </div>
                          )}
                          {zakatableWealth > 0 && (
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Zakatable</div>
                              <div className="text-sm font-medium text-green-700 truncate">
                                {formatCurrency(zakatableWealth, record.currency || 'USD')}
                              </div>
                            </div>
                          )}
                          {zakatAmount > 0 && (
                            <div>
                              <div className="text-xs text-gray-600 mb-1">Zakat Obligation</div>
                              <div className="text-sm font-bold text-blue-700 truncate">
                                {formatCurrency(zakatAmount, record.currency || 'USD')}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Secondary information row */}
                        <div className="flex gap-3 sm:gap-4 text-xs text-gray-600 flex-wrap">
                          <div>
                            Started: <span className="text-gray-900 font-medium">{startDateFormatted}</span>
                          </div>
                          {record.hawlCompletionDate && (
                            <div>
                              Completes: <span className="text-gray-900 font-medium">
                                {new Date(record.hawlCompletionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons - optimized for mobile */}
                        <div className="flex gap-2 flex-wrap">
                          {record.status === 'DRAFT' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRefreshAssets(record.id);
                              }}
                              className="px-2 sm:px-3 py-1.5 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                            >
                              Refresh
                            </button>
                          )}
                          {(record.status === 'DRAFT' || record.status === 'UNLOCKED') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingStartDateRecordId(record.id);
                                setNewStartDate(new Date(record.hawlStartDate).toISOString().split('T')[0]);
                              }}
                              className="px-2 sm:px-3 py-1.5 bg-purple-600 text-white text-xs sm:text-sm rounded hover:bg-purple-700 transition-colors whitespace-nowrap"
                            >
                              Edit Date
                            </button>
                          )}
                          {record.status === 'DRAFT' && record.liveHawlData?.canFinalize && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFinalize(record);
                              }}
                              className="px-2 sm:px-3 py-1.5 bg-green-600 text-white text-xs sm:text-sm rounded hover:bg-green-700 transition-colors whitespace-nowrap"
                            >
                              Finalize
                            </button>
                          )}
                          {record.status === 'FINALIZED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnlock(record);
                              }}
                              className="px-2 sm:px-3 py-1.5 bg-amber-600 text-white text-xs sm:text-sm rounded hover:bg-amber-700 transition-colors whitespace-nowrap"
                            >
                              Unlock
                            </button>
                          )}
                          {record.status === 'UNLOCKED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFinalize(record);
                              }}
                              className="px-2 sm:px-3 py-1.5 bg-green-600 text-white text-xs sm:text-sm rounded hover:bg-green-700 transition-colors whitespace-nowrap"
                            >
                              Re-Finalize
                            </button>
                          )}
                          {(record.status === 'DRAFT' || record.status === 'UNLOCKED') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(record);
                              }}
                              className="px-2 sm:px-3 py-1.5 bg-red-600 text-white text-xs sm:text-sm rounded hover:bg-red-700 transition-colors whitespace-nowrap"
                            >
                              Delete
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAuditTrail(record.id);
                            }}
                            className="px-2 sm:px-3 py-1.5 bg-gray-600 text-white text-xs sm:text-sm rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
                          >
                            Audit
                          </button>
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
                {/* Hawl progress */}
                {activeRecord.status === 'DRAFT' && (
                  <HawlProgressIndicator record={activeRecord} />
                )}

                {/* Nisab comparison */}
                <NisabComparisonWidget record={activeRecord} showDetails={true} />

                {/* Zakat display card */}
                <ZakatDisplayCard 
                  record={activeRecord}
                  onFinalize={() => handleFinalize(activeRecord)}
                  onRefreshAssets={() => setRefreshingRecordId(activeRecord.id)}
                  isLoadingAssets={isRefreshingAssets}
                />

                {/* Record details */}
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
                  <div className="space-y-2 text-sm">
                    {activeRecord.hawlStartDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Started:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(activeRecord.hawlStartDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {activeRecord.hawlCompletionDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(activeRecord.hawlCompletionDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {activeRecord.totalWealth && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Wealth:</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(parseFloat(activeRecord.totalWealth), 'USD')}
                        </span>
                      </div>
                    )}
                    {activeRecord.zakatableWealth && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Zakatable Wealth:</span>
                        <span className="font-medium text-gray-900">
                          {formatCurrency(parseFloat(activeRecord.zakatableWealth), 'USD')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payments section */}
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Zakat Payments</h3>
                    {(activeRecord.status === 'DRAFT' || activeRecord.status === 'FINALIZED' || activeRecord.status === 'UNLOCKED') ? (
                      <button
                        onClick={() => setShowPaymentsRecordId(activeRecord.id)}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        + Payment
                      </button>
                    ) : null}
                  </div>
                  
                  {activeRecord.zakatAmount ? (
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <div className="text-gray-600">Total Zakat Due</div>
                        <div className="text-lg font-bold text-blue-700">
                          {formatCurrency(parseFloat(activeRecord.zakatAmount), 'USD')}
                        </div>
                      </div>
                      
                      {payments.length > 0 && (
                        <div className="p-3 bg-green-50 rounded border border-green-200">
                          <div className="text-gray-600 text-xs mb-2">Payments Recorded</div>
                          <div className="space-y-2">
                            {payments.map((payment: any) => (
                              <div key={payment.id} className="flex justify-between items-start text-xs border-t border-green-200 pt-2 first:border-t-0 first:pt-0">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{payment.decryptedRecipientName}</div>
                                  <div className="text-gray-600 text-xs mt-0.5">
                                    {payment.recipientType} • {payment.recipientCategory}
                                  </div>
                                  <div className="text-gray-500 text-xs mt-0.5">
                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="font-semibold text-green-700">
                                  {formatCurrency(parseFloat(payment.decryptedAmount), payment.currency || 'USD')}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t border-green-200 flex justify-between items-center font-semibold">
                            <span className="text-gray-700">Total Paid:</span>
                            <span className="text-green-700">
                              {formatCurrency(
                                payments.reduce((sum: number, p: any) => sum + parseFloat(p.decryptedAmount || '0'), 0),
                                'USD'
                              )}
                            </span>
                          </div>
                          <div className="mt-1 flex justify-between items-center text-xs">
                            <span className="text-gray-600">Remaining:</span>
                            <span className={
                              parseFloat(activeRecord.zakatAmount) - payments.reduce((sum: number, p: any) => sum + parseFloat(p.decryptedAmount || '0'), 0) <= 0
                                ? 'text-green-600 font-medium'
                                : 'text-gray-700 font-medium'
                            }>
                              {formatCurrency(
                                Math.max(0, parseFloat(activeRecord.zakatAmount) - payments.reduce((sum: number, p: any) => sum + parseFloat(p.decryptedAmount || '0'), 0)),
                                'USD'
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="p-3 bg-gray-50 rounded">
                        <div className="text-gray-600 text-xs">Status</div>
                        <div className="text-sm font-medium text-gray-900 mt-1">
                          {activeRecord.status === 'FINALIZED' || activeRecord.status === 'UNLOCKED'
                            ? '✓ Ready to pay'
                            : '⏳ Pending finalization'}
                        </div>
                      </div>
                      
                      {payments.length === 0 && (
                        <p className="text-xs text-gray-600 mt-2">
                          💡 Click "+ Payment" to record your first Zakat payment.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No Zakat calculated yet</p>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600">
                <p>Select a record to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {finalizingRecordId && (
        <FinalizationModal
          record={records.find((r: any) => r.id === finalizingRecordId)!}
          isOpen={true}
          onClose={() => setFinalizingRecordId(null)}
          onFinalized={handleFinalizationComplete}
        />
      )}

      {unlockingRecordId && (
        <UnlockReasonDialog
          record={records.find((r: any) => r.id === unlockingRecordId)!}
          isOpen={true}
          onClose={() => setUnlockingRecordId(null)}
          onUnlocked={handleUnlockComplete}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deletingRecordId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Confirm Deletion</h2>
              <button
                onClick={() => setDeletingRecordId(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete this Nisab Year Record?
              </p>
              <p className="text-sm text-gray-600 mb-6">
                This action cannot be undone. All associated data including audit trail entries will be permanently removed.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeletingRecordId(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={deleteRecordMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={deleteRecordMutation.isPending}
                >
                  {deleteRecordMutation.isPending ? 'Deleting...' : 'Delete Record'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAuditTrail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Audit Trail</h2>
              <button
                onClick={() => setShowAuditTrail(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <AuditTrailView recordId={showAuditTrail} />
            </div>
          </div>
        </div>
      )}

      {/* Create Record Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Create Nisab Year Record</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {isLoadingAssets ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading assets...</p>
                </div>
              ) : assetsData && assetsData.length > 0 ? (
                <>
                  {console.log('Assets data for table:', assetsData)}
                  
                  {/* Nisab Basis Selector */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Nisab Threshold Basis
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setNisabBasis('GOLD')}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          nisabBasis === 'GOLD'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">Gold (87.48g)</span>
                          {nisabBasis === 'GOLD' && (
                            <span className="text-blue-600">✓</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Most commonly used standard
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNisabBasis('SILVER')}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          nisabBasis === 'SILVER'
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900">Silver (612.36g)</span>
                          {nisabBasis === 'SILVER' && (
                            <span className="text-blue-600">✓</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Lower threshold (more people obligated)
                        </div>
                      </button>
                    </div>
                    <p className="mt-3 text-xs text-gray-500">
                      This determines the minimum wealth threshold for Zakat obligation. 
                      Gold standard is higher (~$5,686), Silver standard is lower (~$459).
                    </p>
                  </div>
                  
                  <AssetSelectionTable
                    assets={assetsData}
                    initialSelection={selectedAssetIds}
                    onSelectionChange={(ids) => {
                      console.log('Asset selection changed:', ids);
                      setSelectedAssetIds(ids);
                    }}
                  />
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateSubmit}
                      disabled={createRecordMutation.isPending || selectedAssetIds.length === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {createRecordMutation.isPending ? 'Creating...' : 'Create Record'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  <p>No assets found. Please add assets to your portfolio first.</p>
                  <button
                    onClick={() => navigate('/assets')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Go to Assets
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Refresh Assets Modal */}
      {refreshingRecordId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-semibold text-gray-900">Refresh Assets</h2>
              <button
                onClick={() => setRefreshingRecordId(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {isRefreshingAssets ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading current assets...</p>
                </div>
              ) : refreshAssetsData?.assets ? (
                <>
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">
                      Review and update your asset selection. This will update the record with current asset values.
                    </p>
                  </div>
                  <AssetSelectionTable
                    assets={refreshAssetsData.assets}
                    onSelectionChange={setSelectedAssetIds}
                  />
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setRefreshingRecordId(null)}
                      className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (!refreshingRecordId) return;
                        
                        // Build asset breakdown from selected assets
                        const selectedAssets = refreshAssetsData.assets.filter((a: Asset) =>
                          selectedAssetIds.includes(a.id)
                        );
                        
                        const totalWealth = selectedAssets.reduce((sum: number, a: Asset) => sum + (a.value || 0), 0);
                        const zakatableWealth = selectedAssets
                          .filter((a: Asset) => a.isZakatable)
                          .reduce((sum: number, a: Asset) => sum + (a.value || 0), 0);
                        const zakatAmount = zakatableWealth * 0.025;
                        
                        // Update record with new asset breakdown
                        const updateData = {
                          assetBreakdown: {
                            assets: selectedAssets.map((a: Asset) => ({
                              id: a.id,
                              name: a.name,
                              category: a.category,
                              value: a.value,
                              isZakatable: a.isZakatable,
                              addedAt: a.addedAt,
                            })),
                            capturedAt: new Date().toISOString(),
                            totalWealth,
                            zakatableWealth,
                          },
                          totalWealth: totalWealth.toString(),
                          zakatableWealth: zakatableWealth.toString(),
                          zakatAmount: zakatAmount.toString(),
                        };
                        
                        // Call update endpoint
                        apiService.updateNisabYearRecord(refreshingRecordId, updateData).then(() => {
                          // Refresh records query to show updated values
                          queryClient.invalidateQueries({ queryKey: ['nisab-year-records'], exact: false });
                          setRefreshingRecordId(null);
                          setSelectedAssetIds([]);
                        }).catch((error) => {
                          console.error('Failed to update record:', error);
                          alert('Failed to update record. Please try again.');
                        });
                      }}
                      disabled={selectedAssetIds.length === 0}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Update Record
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-red-600">
                  <p>Failed to load assets. Please try again.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Start Date Modal */}
      {editingStartDateRecordId && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Start Date</h2>
              <button
                onClick={() => {
                  setEditingStartDateRecordId(null);
                  setNewStartDate('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Change the Hawl start date for this record. This will recalculate the completion date.
              </p>
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setEditingStartDateRecordId(null);
                    setNewStartDate('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!editingStartDateRecordId || !newStartDate) return;
                    
                    try {
                      const startDate = new Date(newStartDate);
                      const completionDate = new Date(startDate.getTime() + (354 * 24 * 60 * 60 * 1000)); // 354 lunar days ≈ 354 solar days
                      
                      await apiService.updateNisabYearRecord(editingStartDateRecordId, {
                        hawlStartDate: startDate.toISOString(),
                        hawlCompletionDate: completionDate.toISOString(),
                      });
                      
                      // Refresh records query
                      queryClient.invalidateQueries({ queryKey: ['nisab-year-records'], exact: false });
                      setEditingStartDateRecordId(null);
                      setNewStartDate('');
                    } catch (error) {
                      alert('Failed to update start date. Please try again.');
                    }
                  }}
                  disabled={!newStartDate}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Update Date
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentsRecordId && activeRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Record Zakat Payment</h2>
              <button
                onClick={() => {
                  setShowPaymentsRecordId(null);
                  setPaymentAmount('');
                  setPaymentRecipientName('');
                  setPaymentRecipientType('charity');
                  setPaymentRecipientCategory('general');
                  setPaymentMethod('cash');
                  setPaymentNotes('');
                  setPaymentReceiptReference('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Zakat Due:</strong> {formatCurrency(parseFloat(activeRecord.zakatAmount || '0'), 'USD')}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Payment Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Recipient Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Local Masjid or Individual Name"
                    value={paymentRecipientName}
                    onChange={(e) => setPaymentRecipientName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Recipient Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentRecipientType}
                    onChange={(e) => setPaymentRecipientType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="individual">Individual</option>
                    <option value="organization">Organization</option>
                    <option value="charity">Charity</option>
                    <option value="mosque">Mosque</option>
                    <option value="family">Family</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Recipient Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentRecipientCategory}
                    onChange={(e) => setPaymentRecipientCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="poor">Poor & Needy</option>
                    <option value="orphans">Orphans</option>
                    <option value="widows">Widows</option>
                    <option value="education">Education</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="infrastructure">Infrastructure</option>
                    <option value="general">General / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="crypto">Cryptocurrency</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Receipt Reference (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Receipt #12345"
                    value={paymentReceiptReference}
                    onChange={(e) => setPaymentReceiptReference(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    placeholder="e.g., Paid to local charity for orphan support"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPaymentsRecordId(null);
                    setPaymentAmount('');
                    setPaymentRecipientName('');
                    setPaymentRecipientType('charity');
                    setPaymentRecipientCategory('general');
                    setPaymentMethod('cash');
                    setPaymentNotes('');
                    setPaymentReceiptReference('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!showPaymentsRecordId || !paymentAmount || !paymentRecipientName || !paymentRecipientType || !paymentRecipientCategory || !paymentMethod) return;

                    try {
                      // Call API to record payment with all collected data
                      const resp = await apiService.recordPayment({
                        snapshotId: showPaymentsRecordId,
                        amount: parseFloat(paymentAmount).toFixed(2),
                        paymentDate: new Date(),
                        recipientName: paymentRecipientName,
                        recipientType: paymentRecipientType as any,
                        recipientCategory: paymentRecipientCategory as any,
                        paymentMethod: paymentMethod as any,
                        currency: 'USD',
                        notes: paymentNotes || undefined,
                        receiptReference: paymentReceiptReference || undefined,
                      });

                      if (!resp.success) {
                        throw new Error(resp.message || 'Failed to record payment');
                      }

                      // Invalidate any payments queries and refresh records
                      queryClient.invalidateQueries({ queryKey: ['nisab-year-records'], exact: false });
                      queryClient.invalidateQueries({ queryKey: ['payments'], exact: false });
                      queryClient.invalidateQueries({ queryKey: ['zakat-payments'], exact: false });

                      alert(`Payment of ${formatCurrency(parseFloat(paymentAmount), 'USD')} recorded successfully!`);
                      setShowPaymentsRecordId(null);
                      setPaymentAmount('');
                      setPaymentRecipientName('');
                      setPaymentRecipientType('charity');
                      setPaymentRecipientCategory('general');
                      setPaymentMethod('cash');
                      setPaymentNotes('');
                      setPaymentReceiptReference('');
                    } catch (error: any) {
                      console.error('Failed to record payment:', error);
                      alert(`Failed to record payment: ${error.message || 'Please try again'}`);
                    }
                  }}
                  disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || !paymentRecipientName || !paymentRecipientType || !paymentRecipientCategory || !paymentMethod}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NisabYearRecordsPage;
