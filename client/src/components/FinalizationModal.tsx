/**
 * FinalizationModal Component (T062)
 * 
 * Review screen for finalizing Nisab Year Records
 * Features:
 * - Wealth summary
 * - Zakat calculation breakdown
 * - Premature finalization warning
 * - Confirm/cancel buttons
 * - Loading state
 */

import React, { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { NisabYearRecordResponse } from '@zakapp/shared';

export interface FinalizationModalProps {
  /**
   * The record to finalize
   */
  record: NisabYearRecordResponse;

  /**
   * Whether modal is open
   */
  isOpen: boolean;

  /**
   * Callback when modal closes (regardless of action)
   */
  onClose: () => void;

  /**
   * Callback after successful finalization
   */
  onFinalized?: (finalRecord: NisabYearRecordResponse) => void;

  /**
   * Optional: disable finalization (e.g., if Hawl not complete)
   */
  disabled?: boolean;

  /**
   * Optional custom className
   */
  className?: string;
}

/**
 * Modal to review and finalize a Nisab Year Record
 * 
 * Shows:
 * - Wealth summary (zakatble amount)
 * - Zakat calculation (2.5%)
 * - Nisab basis (gold/silver)
 * - Warning if Hawl not complete
 * - Confirm/cancel buttons
 * 
 * @example
 * const [isFinalizationModalOpen, setIsFinalizationModalOpen] = useState(false);
 * 
 * return (
 *   <>
 *     <button onClick={() => setIsFinalizationModalOpen(true)}>
 *       Finalize Record
 *     </button>
 *     <FinalizationModal
 *       record={nisabYearRecord}
 *       isOpen={isFinalizationModalOpen}
 *       onClose={() => setIsFinalizationModalOpen(false)}
 *       onFinalized={(finalRecord) => {
 *         alert(`Zakat: ${finalRecord.finalZakatAmount}`);
 *       }}
 *     />
 *   </>
 * );
 */
export const FinalizationModal: React.FC<FinalizationModalProps> = ({
  record,
  isOpen,
  onClose,
  onFinalized,
  disabled = false,
  className = '',
}) => {
  const [finalizationNotes, setFinalizationNotes] = useState('');

  // Mutation for finalization
  const { mutate: finalize, isLoading: isSubmitting, error } = useMutation({
    mutationFn: async () => {
      const response = await apiService.finalizeNisabYearRecord(record.id, {
        finalizationNotes,
      });

      if (!response.success) {
        throw new Error(response.message || 'Finalization failed');
      }

      return response.data as NisabYearRecordResponse;
    },
    onSuccess: (finalRecord) => {
      onFinalized?.(finalRecord);
      onClose();
    },
  });

  const handleConfirm = useCallback(() => {
    finalize();
  }, [finalize]);

  if (!isOpen) return null;

  const zakatAmount = record.finalZakatAmount || (record.nisabThresholdAtStart || 0) * 0.025;
  const hawlComplete = record.liveHawlData?.canFinalize ?? false;

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: record.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className={`finalization-modal ${className}`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Review & Finalize Record
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Confirm the details before finalizing this Nisab Year Record
            </p>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
            {/* Warnings */}
            {!hawlComplete && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-700">
                  ⚠️ Warning: Hawl period may not be complete
                </p>
                <p className="mt-1 text-xs text-amber-600">
                  You are finalizing before the 354-day Hawl period completes. This means Zakat may be calculated on an incomplete cycle.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-700">Error</p>
                <p className="mt-1 text-xs text-red-600">{error.message}</p>
              </div>
            )}

            {/* Summary section */}
            <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Nisab Basis:</span>
                <span className="font-medium text-gray-900">
                  {record.nisabBasis === 'GOLD' ? 'Gold' : 'Silver'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Nisab Threshold:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(record.nisabThresholdAtStart || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-700">Currency:</span>
                <span className="font-medium text-gray-900">{record.currency}</span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-3">
                <span className="text-sm text-gray-700">Zakatble Wealth:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(record.zakatableWealthAtEnd || record.nisabThresholdAtStart || 0)}
                </span>
              </div>
            </div>

            {/* Zakat calculation */}
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="mb-2 text-sm font-medium text-gray-900">Zakat Calculation</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Zakatble Amount:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(record.zakatableWealthAtEnd || record.nisabThresholdAtStart || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Zakat Rate:</span>
                  <span className="font-medium text-gray-900">2.5%</span>
                </div>
                <div className="border-t border-green-200 pt-2">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold text-gray-900">Total Zakat Due:</span>
                    <span className="font-bold text-green-600">{formatCurrency(zakatAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes section */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Finalization Notes (Optional)
              </label>
              <textarea
                value={finalizationNotes}
                onChange={(e) => setFinalizationNotes(e.target.value)}
                placeholder="Add any notes about this finalization..."
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
                rows={3}
                disabled={isSubmitting}
              />
              <p className="mt-1 text-xs text-gray-500">
                {finalizationNotes.length}/500 characters
              </p>
            </div>

            {/* Confirmation text */}
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-xs text-gray-700">
                By finalizing, you confirm that:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                <li>✓ The zakatble wealth amount is accurate</li>
                <li>✓ The Hawl period has been tracked (354 days preferred)</li>
                <li>✓ You will track payments of Zakat</li>
                <li>✓ This record will be locked from further edits</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || disabled}
              className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Finalizing...
                </>
              ) : (
                <>
                  ✓ Finalize & Lock
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalizationModal;
