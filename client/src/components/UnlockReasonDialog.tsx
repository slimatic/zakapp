/**
 * UnlockReasonDialog Component (T063)
 * 
 * Dialog for entering unlock reason when unlocking a finalized record
 * Features:
 * - Text area with validation (min 10 chars)
 * - Character counter
 * - Validation error display
 * - Accessible (WCAG 2.1 AA)
 */

import React, { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { NisabYearRecordResponse } from '@zakapp/shared';

export interface UnlockReasonDialogProps {
  /**
   * The record to unlock
   */
  record: NisabYearRecordResponse;

  /**
   * Whether dialog is open
   */
  isOpen: boolean;

  /**
   * Callback when dialog closes
   */
  onClose: () => void;

  /**
   * Callback after successful unlock
   */
  onUnlocked?: (unlockedRecord: NisabYearRecordResponse) => void;

  /**
   * Optional custom className
   */
  className?: string;
}

/**
 * Dialog to enter reason for unlocking a finalized record
 * 
 * Validates:
 * - Reason is between 10 and 500 characters
 * - Displays validation errors
 * - Shows character counter
 * - Loading state during submission
 * 
 * @example
 * const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false);
 * 
 * return (
 *   <>
 *     <button onClick={() => setIsUnlockDialogOpen(true)}>
 *       Unlock Record
 *     </button>
 *     <UnlockReasonDialog
 *       record={nisabYearRecord}
 *       isOpen={isUnlockDialogOpen}
 *       onClose={() => setIsUnlockDialogOpen(false)}
 *       onUnlocked={(record) => {
 *         alert('Record unlocked for editing');
 *       }}
 *     />
 *   </>
 * );
 */
export const UnlockReasonDialog: React.FC<UnlockReasonDialogProps> = ({
  record,
  isOpen,
  onClose,
  onUnlocked,
  className = '',
}) => {
  const [reason, setReason] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Mutation for unlock
  const { mutate: unlock, isLoading: isSubmitting, error } = useMutation({
    mutationFn: async () => {
      // Client-side validation
      const errors: string[] = [];

      if (!reason.trim()) {
        errors.push('Unlock reason is required');
      }

      if (reason.length < 10) {
        errors.push('Reason must be at least 10 characters');
      }

      if (reason.length > 500) {
        errors.push('Reason must not exceed 500 characters');
      }

      if (errors.length > 0) {
        setValidationErrors(errors);
        throw new Error('Validation failed');
      }

      const response = await apiService.unlockNisabYearRecord(record.id, {
        reason: reason.trim(),
      });

      if (!response.success) {
        throw new Error(response.message || 'Unlock failed');
      }

      return response.data as NisabYearRecordResponse;
    },
    onSuccess: (unlockedRecord) => {
      onUnlocked?.(unlockedRecord);
      setReason('');
      setValidationErrors([]);
      onClose();
    },
    onError: () => {
      // Errors are already set, just don't close
    },
  });

  const handleSubmit = useCallback(() => {
    unlock();
  }, [unlock]);

  const handleReasonChange = useCallback((value: string) => {
    setReason(value);
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  }, [validationErrors]);

  // Validation state
  const isValid = reason.length >= 10 && reason.length <= 500;
  const charCount = reason.length;
  const remainingChars = 500 - charCount;
  const charsWarning = remainingChars < 50;

  if (!isOpen) return null;

  return (
    <div className={`unlock-reason-dialog ${className}`}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Unlock Record for Editing
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Provide a reason for unlocking this finalized record
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {/* Error display */}
            {(error || validationErrors.length > 0) && (
              <div
                className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4"
                role="alert"
                aria-live="polite"
              >
                <p className="text-sm font-medium text-red-700">Validation Errors:</p>
                <ul className="mt-2 space-y-1">
                  {validationErrors.map((err, idx) => (
                    <li key={idx} className="text-sm text-red-600">
                      • {err}
                    </li>
                  ))}
                </ul>
                {error && !validationErrors.includes(error.message) && (
                  <li className="mt-1 text-sm text-red-600">
                    • {error.message}
                  </li>
                )}
              </div>
            )}

            {/* Record info */}
            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Record:</span>
                <span className="font-medium text-gray-900">
                  {record.hijriYear}
                </span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-700">Status:</span>
                <span className="font-medium text-gray-900">
                  {record.status}
                </span>
              </div>
            </div>

            {/* Reason input */}
            <div>
              <label
                htmlFor="unlock-reason"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Reason for Unlocking
                <span className="ml-1 text-red-600" aria-label="required">
                  *
                </span>
              </label>
              <textarea
                id="unlock-reason"
                value={reason}
                onChange={(e) => handleReasonChange(e.target.value)}
                placeholder="Explain why you need to unlock this finalized record..."
                className={`w-full rounded-lg border px-4 py-3 text-sm focus:outline-none transition-colors ${
                  validationErrors.length > 0
                    ? 'border-red-300 bg-red-50 focus:border-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
                rows={4}
                disabled={isSubmitting}
                aria-invalid={validationErrors.length > 0}
                aria-describedby={validationErrors.length > 0 ? 'error-message' : 'char-count'}
                maxLength={500}
              />

              {/* Character counter */}
              <div
                id="char-count"
                className={`mt-2 text-right text-xs transition-colors ${
                  charsWarning
                    ? 'text-amber-600'
                    : charCount === 0
                    ? 'text-gray-500'
                    : 'text-green-600'
                }`}
              >
                {charCount}/500 characters
                {charCount < 10 && (
                  <span className="ml-2 text-red-600">
                    ({10 - charCount} more required)
                  </span>
                )}
              </div>
            </div>

            {/* Info box */}
            <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm text-gray-700">
              <p className="font-medium">What happens when you unlock:</p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>✓ Record transitions to UNLOCKED status</li>
                <li>✓ You can edit specific fields</li>
                <li>✓ Your reason is encrypted and stored in audit trail</li>
                <li>✓ After edits, you'll re-finalize the record</li>
                <li>✓ All changes are tracked for compliance</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isValid}
              className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              aria-label={isValid ? 'Unlock record' : 'Reason must be between 10 and 500 characters'}
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Unlocking...
                </>
              ) : (
                <>
                  🔓 Unlock for Editing
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlockReasonDialog;
