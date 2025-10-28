/**
 * NisabYearRecordsPage (T065)
 * 
 * List view with create, finalize, unlock, and audit trail functionality
 * for Nisab Year Records
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import HawlProgressIndicator from '../components/HawlProgressIndicator';
import NisabComparisonWidget from '../components/NisabComparisonWidget';
import FinalizationModal from '../components/FinalizationModal';
import UnlockReasonDialog from '../components/UnlockReasonDialog';
import AuditTrailView from '../components/AuditTrailView';

export const NisabYearRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'DRAFT' | 'FINALIZED' | 'UNLOCKED'>('all');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [finalizingRecordId, setFinalizingRecordId] = useState<string | null>(null);
  const [unlockingRecordId, setUnlockingRecordId] = useState<string | null>(null);
  const [showAuditTrail, setShowAuditTrail] = useState<string | null>(null);

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

  const records = recordsData?.records || [];
  const activeRecord = selectedRecordId ? records.find((r: any) => r.id === selectedRecordId) : null;

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

  // Handle creation
  const handleCreate = () => {
    navigate('/nisab-year-records/new');
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
    queryClient.invalidateQueries({ queryKey: ['nisab-year-records'] });
    setFinalizingRecordId(null);
  };

  // Handle unlock complete
  const handleUnlockComplete = (unlockedRecord: any) => {
    // Refetch records
    queryClient.invalidateQueries({ queryKey: ['nisab-year-records'] });
    setUnlockingRecordId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nisab Year Records</h1>
              <p className="mt-2 text-gray-600">
                Track Hawl periods, Nisab thresholds, and Zakat calculations
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + New Record
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main content */}
          <div className="col-span-2 space-y-6">
            {/* Status tabs */}
            <div className="flex gap-2 border-b border-gray-200">
              {(['all', 'DRAFT', 'FINALIZED', 'UNLOCKED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setActiveStatusFilter(status);
                    setSelectedRecordId(null);
                  }}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
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
                  const badge = statusBadges[record.status];
                  const isSelected = selectedRecordId === record.id;

                  return (
                    <div
                      key={record.id}
                      onClick={() => setSelectedRecordId(record.id)}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {record.hijriYear}
                            </h3>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                          <div className="mt-2 flex gap-6 text-sm text-gray-600">
                            <div>
                              <span className="text-gray-900 font-medium">
                                {record.nisabBasis === 'GOLD' ? 'Gold' : 'Silver'}
                              </span>
                              {' '}basis
                            </div>
                            {record.finalZakatAmount && (
                              <div>
                                Zakat: <span className="text-gray-900 font-medium">
                                  {formatCurrency(record.finalZakatAmount, record.currency)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2">
                          {record.status === 'DRAFT' && record.liveHawlData?.canFinalize && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFinalize(record);
                              }}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
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
                              className="px-3 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition-colors"
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
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                            >
                              Re-Finalize
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowAuditTrail(record.id);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
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

          {/* Sidebar */}
          <div className="col-span-1 space-y-6">
            {activeRecord ? (
              <>
                {/* Hawl progress */}
                {activeRecord.status === 'DRAFT' && (
                  <HawlProgressIndicator record={activeRecord} />
                )}

                {/* Nisab comparison */}
                <NisabComparisonWidget record={activeRecord} showDetails={true} />

                {/* Record details */}
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
                  <div className="space-y-2 text-sm">
                    {activeRecord.startDate && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Started:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(activeRecord.startDate).toLocaleDateString()}
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
                    {activeRecord.finalZakatAmount && (
                      <div className="flex justify-between border-t border-gray-200 pt-2">
                        <span className="text-gray-600">Total Zakat:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(activeRecord.finalZakatAmount, activeRecord.currency)}
                        </span>
                      </div>
                    )}
                  </div>
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
    </div>
  );
};

export default NisabYearRecordsPage;
