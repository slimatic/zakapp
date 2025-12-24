/**
 * PaymentRecordForm Component - T061
 * Form for creating/editing Zakat payment records with Islamic recipient categories
 */

import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPaymentSchema } from '@zakapp/shared';
import { z } from 'zod';
import { useCreatePayment, useUpdatePayment } from '../../hooks/usePayments';
import { useDeletePayment, useDeleteSnapshotPayment } from '../../hooks/usePaymentRecords';
import { useNisabYearRecords } from '../../hooks/useNisabYearRecords';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';
import type { NisabYearRecord } from '../../types/nisabYearRecord';
import { looksEncrypted } from '../../utils/encryption';

// Redefine schema locally to prevent Zod version mismatch issues between client and shared
const paymentRecordFormSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal number'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  recipientName: z.string().min(1, 'Recipient name is required').max(200),
  snapshotId: z.string().min(1, 'Please select a Nisab Year Record'),
  recipientCategory: z.enum(['poor', 'orphans', 'widows', 'education', 'healthcare', 'infrastructure', 'general'], {
    errorMap: () => ({ message: 'Please select a valid recipient category' })
  }),
  recipientType: z.enum(['individual', 'organization', 'charity', 'mosque', 'family', 'other']).default('individual'),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'check', 'crypto', 'other']).default('cash'),
  notes: z.string().max(1000).optional(),
  receiptReference: z.string().max(200).optional(),
  currency: z.string().length(3).default('USD'),
  exchangeRate: z.number().min(0).default(1.0),
});

type PaymentRecordFormSchemaType = z.infer<typeof paymentRecordFormSchema>;

interface PaymentRecordFormProps {
  /**
   * Preferred prop for linking a payment to a Nisab Year Record.
   * `snapshotId` is temporarily kept for backwards compatibility and will be removed.
   */
  nisabRecordId?: string;
  snapshotId?: string;
  payment?: PaymentRecord; // For editing existing payments
  onSuccess?: (payment: PaymentRecord) => void;
  onCancel?: () => void;
}

// Islamic recipient categories (8 categories of Zakat recipients)
// Note: These values must map to the schema enum values
const ZAKAT_RECIPIENTS = [
  { value: 'poor', label: 'Poor & Needy (Fuqara & Masakin)', description: 'Those in need (owning less than Nisab)' },
  { value: 'orphans', label: 'Orphans', description: 'Children without support' },
  { value: 'widows', label: 'Widows', description: 'Women who have lost their husbands' },
  { value: 'education', label: 'Education (Fi Sabilillah)', description: 'Students of knowledge' },
  { value: 'healthcare', label: 'Healthcare', description: 'Medical assistance for the needy' },
  { value: 'infrastructure', label: 'Infrastructure', description: 'Mosques, schools, public benefit' },
  { value: 'general', label: 'General / Other', description: 'General welfare' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'online', label: 'Online Payment' },
  { value: 'other', label: 'Other' },
  { value: 'crypto', label: 'Crypto' } // Added as per schema
];

export const PaymentRecordForm: React.FC<PaymentRecordFormProps> = ({
  nisabRecordId,
  snapshotId: deprecatedSnapshotId,
  payment,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!payment;
  const paymentSnapshotId = payment?.snapshotId ?? '';
  const resolvedPropRecordId = nisabRecordId ?? deprecatedSnapshotId ?? paymentSnapshotId;
  const lockedRecordIdFromProps = nisabRecordId ?? deprecatedSnapshotId ?? null;
  const shouldLockRecordSelection = Boolean(lockedRecordIdFromProps);

  const [recipientDecryptionWarning, setRecipientDecryptionWarning] = useState<string | null>(null);

  // Helper to map legacy/backend values to schema
  const getInitialCategory = (val?: string) => {
    if (!val) return 'poor';
    if (val === 'fakir' || val === 'miskin') return 'poor';
    if (['poor', 'orphans', 'widows', 'education', 'healthcare', 'infrastructure', 'general'].includes(val)) {
      return val;
    }
    return 'poor'; // default fallback
  };

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<PaymentRecordFormSchemaType>({
    resolver: zodResolver(paymentRecordFormSchema) as any,
    defaultValues: {
      amount: payment?.amount?.toString() || '',
      paymentDate: payment?.paymentDate ?
        (typeof payment.paymentDate === 'string' ? payment.paymentDate.slice(0, 10) : payment.paymentDate.toISOString().slice(0, 10)) :
        new Date().toISOString().slice(0, 10),
      recipientName: looksEncrypted(payment?.recipientName) ? '' : payment?.recipientName || '',
      recipientCategory: getInitialCategory(payment?.recipientCategory) as any,
      snapshotId: resolvedPropRecordId || '',
      paymentMethod: (payment?.paymentMethod as any) || 'cash',
      currency: payment?.currency || 'USD',
      notes: payment?.notes || '',
      receiptReference: payment?.receiptReference || '',
      recipientType: (payment?.recipientType as any) || 'individual', // Added default
    },
  });

  // Watch snapshotId to sync local state logic if needed (e.g. knowing which year is selected)
  const selectedSnapshotId = watch('snapshotId');

  // Fetch Nisab Year Records
  const {
    data: nisabRecordsData,
    isLoading: isLoadingNisabRecords,
    error: nisabRecordsError
  } = useNisabYearRecords({
    status: ['DRAFT', 'FINALIZED', 'UNLOCKED'],
    limit: 100,
  });
  const nisabRecords = nisabRecordsData?.records ?? [];

  const lockedNisabRecord = useMemo(() => (
    lockedRecordIdFromProps
      ? nisabRecords.find((record: NisabYearRecord) => record.id === lockedRecordIdFromProps)
      : undefined
  ), [lockedRecordIdFromProps, nisabRecords]);

  // Mutations
  const createPaymentMutation = useCreatePayment();
  const updatePaymentMutation = useUpdatePayment();
  const deletePaymentMutation = useDeletePayment();
  const deleteSnapshotMutation = useDeleteSnapshotPayment();

  const isLoading = createPaymentMutation.isPending || updatePaymentMutation.isPending;
  const submitError = createPaymentMutation.error || updatePaymentMutation.error;

  // Effects
  useEffect(() => {
    // If props dictate a record ID, enforce it
    if (resolvedPropRecordId) {
      setValue('snapshotId', resolvedPropRecordId);
    }

    // Warn about encryption logic
    if (payment && looksEncrypted(payment.recipientName)) {
      setRecipientDecryptionWarning('Recipient name could not be decrypted. Please re-enter the recipient name before saving.');
    } else {
      setRecipientDecryptionWarning(null);
    }
  }, [resolvedPropRecordId, payment, setValue]);

  // Auto-select latest Nisab record if none selected
  useEffect(() => {
    if (!lockedRecordIdFromProps && !selectedSnapshotId && nisabRecords.length > 0) {
      const sortedRecords = [...nisabRecords].sort((a, b) => {
        const fallbackA = a.hawlCompletionDate || a.hawlStartDate || a.updatedAt || a.createdAt;
        const fallbackB = b.hawlCompletionDate || b.hawlStartDate || b.updatedAt || b.createdAt;
        const dateA = new Date(a.calculationDate || fallbackA || 0).getTime();
        const dateB = new Date(b.calculationDate || fallbackB || 0).getTime();
        return dateB - dateA;
      });

      if (sortedRecords.length > 0) {
        setValue('snapshotId', sortedRecords[0].id);
      }
    }
  }, [lockedRecordIdFromProps, selectedSnapshotId, nisabRecords, setValue]);


  const onSubmitForm = async (data: PaymentRecordFormSchemaType) => {
    // Transform date to ISO
    const isoDate = new Date(data.paymentDate).toISOString();

    const paymentData = {
      ...data,
      amount: parseFloat(data.amount), // Parse string amount to number
      paymentDate: isoDate,
      // Ensure specific types
      recipientType: 'individual' as const,
      status: 'recorded' as const,
    };

    try {
      let result: PaymentRecord;

      if (isEditing && payment) {
        result = await updatePaymentMutation.mutateAsync({
          id: payment.id,
          // snapshotId is properly typed in the schema but explicit casting might be needed if updatePaymentMutation expects stricter types
          // The shared updatePaymentSchema expects partials, but my form provides full data.
          snapshotId: data.snapshotId,
          // We need to cast paymentData because UpdatePaymentInput expects numbers for amount, etc.
          data: paymentData as any // Casting to satisfy the partial update requirement vs full object
        });
      } else {
        // Create expects specific structure.
        result = await createPaymentMutation.mutateAsync(paymentData as any);
      }
      toast.success(isEditing ? 'Payment updated' : 'Payment recorded');
      onSuccess?.(result);
    } catch (error) {
      toast.error('Error saving payment record');
    }
  };

  const handleDelete = async () => {
    if (!payment) return;
    if (!window.confirm('Delete this payment? This action cannot be undone.')) return;

    try {
      if (nisabRecordId || payment.snapshotId) {
        await deleteSnapshotMutation.mutateAsync(payment.id);
      } else {
        const paymentId = (payment as any).paymentId || payment.id;
        await deletePaymentMutation.mutateAsync(paymentId);
      }
      toast.success('Payment deleted');
      onCancel?.();
    } catch (e) {
      toast.error('Failed to delete payment');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm as any)} className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Payment Record' : 'Add Payment Record'}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Record your Zakat payment according to Islamic guidelines
        </p>
      </div>

      {/* Nisab Year Record selection */}
      {!shouldLockRecordSelection ? (
        <div>
          <label htmlFor="snapshotId" className="block text-sm font-medium text-gray-700 mb-2">
            Nisab Year Record *
          </label>
          {isLoadingNisabRecords ? (
            <div className="flex items-center text-sm text-gray-500">
              <LoadingSpinner size="sm" className="mr-2" />
              Loading Nisab Year Records...
            </div>
          ) : (
            <>
              <select
                id="snapshotId"
                {...register('snapshotId')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.snapshotId ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                disabled={isLoadingNisabRecords}
              >
                <option value="">Select a Nisab Year Record</option>
                {nisabRecords.map((record: NisabYearRecord) => (
                  <option key={record.id} value={record.id}>
                    {record.gregorianYear || record.calculationYear || 'N/A'} ({record.hijriYear ?? 'Hijri N/A'} AH) - {record.status}
                  </option>
                ))}
              </select>
              {errors.snapshotId?.message && (
                <p className="mt-1 text-sm text-red-600">{errors.snapshotId.message}</p>
              )}
            </>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nisab Year Record
          </label>
          {/* Hidden input to ensure value is registered */}
          <input type="hidden" {...register('snapshotId')} />
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>
                {lockedNisabRecord?.gregorianYear
                  ? `${lockedNisabRecord.gregorianYear} Nisab Year`
                  : lockedNisabRecord?.name || 'Selected Nisab Year Record'}
              </span>
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Amount and Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <Input
            label="Amount Paid *"
            type="text"
            placeholder="0.00"
            className="text-right"
            autoSelectOnFocus={true}
            error={errors.amount?.message}
            {...register('amount')}
          // On blur formatting could be added here if desired, but schema handles validation
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the amount in your local currency
          </p>
        </div>

        <div>
          <Input
            label="Payment Date *"
            type="date"
            error={errors.paymentDate?.message}
            {...register('paymentDate')}
          />
        </div>
      </div>

      {/* Recipient Category */}
      <div>
        <label htmlFor="recipientCategory" className="block text-sm font-medium text-gray-700 mb-2">
          Zakat Recipient Category *
        </label>
        <select
          id="recipientCategory"
          {...register('recipientCategory')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {ZAKAT_RECIPIENTS.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {ZAKAT_RECIPIENTS.find(c => c.value === watch('recipientCategory'))?.description}
        </p>
        {errors.recipientCategory?.message && (
          <p className="mt-1 text-sm text-red-600">{errors.recipientCategory.message}</p>
        )}
      </div>

      {/* Recipient Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <Input
            label="Recipient Name/Organization *"
            placeholder="Enter recipient name or organization"
            error={errors.recipientName?.message}
            {...register('recipientName')}
          />
          {recipientDecryptionWarning && (
            <p className="mt-1 text-xs text-yellow-700">{recipientDecryptionWarning}</p>
          )}
        </div>

        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <select
            id="paymentMethod"
            {...register('paymentMethod')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {PAYMENT_METHODS.map(method => (
              <option key={method.value} value={method.value}>{method.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Optional Fields */}
      <div className="space-y-4">
        <div>
          <Input
            label="Reference/Transaction ID"
            placeholder="Transaction reference or receipt number"
            error={errors.receiptReference?.message}
            {...register('receiptReference')}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          placeholder="Any additional notes or context about this payment"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {errors.notes?.message && (
          <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
        )}
      </div>

      {/* Error Display */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Failed to save payment</p>
              <p className="text-sm text-red-600 mt-1">
                {submitError instanceof Error ? submitError.message : String(submitError)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto sm:min-w-[120px]"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {isEditing ? 'Updating...' : 'Saving...'}
            </>
          ) : (
            isEditing ? 'Update Payment' : 'Save Payment'
          )}
        </Button>
        {isEditing && payment && (
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={isLoading || deletePaymentMutation.isPending || deleteSnapshotMutation.isPending}
            className="w-full sm:w-auto sm:min-w-[120px]"
          >
            {deletePaymentMutation.isPending || deleteSnapshotMutation.isPending ? 'Deleting...' : 'Delete Payment'}
          </Button>
        )}

        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto sm:min-w-[120px]"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Islamic Information */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <svg className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="flex-1">
            <h4 className="text-xs sm:text-sm font-medium text-green-800">
              Islamic Guidelines
            </h4>
            <p className="text-xs text-green-700 mt-0.5">
              The Quran specifies eight categories of people eligible to receive Zakat (Quran 9:60).
            </p>
          </div>
        </div>
      </div>
    </form>
  );
};