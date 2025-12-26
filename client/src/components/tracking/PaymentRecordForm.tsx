/**
 * PaymentRecordForm Component (Local-First Refactor)
 * Form for creating/editing Zakat payment records with Islamic recipient categories using RxDB
 */

import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePaymentRepository } from '../../hooks/usePaymentRepository';
import { useNisabRecordRepository } from '../../hooks/useNisabRecordRepository';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';
import { looksEncrypted } from '../../utils/encryption';

// Redefine schema locally
const paymentRecordFormSchema = z.object({
  amount: z.string()
    .min(1, 'Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal number'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  recipientName: z.string().min(1, 'Recipient name is required').max(200),
  snapshotId: z.string().min(1, 'Please select a Nisab Year Record'),
  recipientCategory: z.enum(['poor', 'orphans', 'widows', 'education', 'healthcare', 'infrastructure', 'general', 'fakir', 'miskin', 'amil', 'muallaf', 'riqab', 'gharimin', 'fisabilillah', 'ibnus_sabil', 'other'], {
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
  nisabRecordId?: string;
  snapshotId?: string;
  payment?: PaymentRecord; // For editing existing payments
  onSuccess?: (payment: PaymentRecord) => void;
  onCancel?: () => void;
}

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
  { value: 'crypto', label: 'Crypto' }
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to map legacy/backend values to schema
  const getInitialCategory = (val?: string) => {
    if (!val) return 'poor';
    return val;
  };

  // React Hook Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PaymentRecordFormSchemaType>({
    resolver: zodResolver(paymentRecordFormSchema) as any,
    defaultValues: {
      amount: payment?.amount?.toString() || '',
      currency: 'USD',
      paymentDate: payment?.paymentDate ?
        (typeof payment.paymentDate === 'string' ? payment.paymentDate.slice(0, 10) : new Date(payment.paymentDate).toISOString().slice(0, 10)) :
        new Date().toISOString().slice(0, 10),
      recipientName: looksEncrypted(payment?.recipientName) ? '' : payment?.recipientName || '',
      recipientCategory: getInitialCategory(payment?.recipientCategory) as any,
      snapshotId: resolvedPropRecordId || '',
      paymentMethod: (payment?.paymentMethod as any) || 'cash',
      notes: payment?.notes || '',
      receiptReference: payment?.receiptReference || '',
      recipientType: (payment?.recipientType as any) || 'individual',
    },
  });

  // Watch snapshotId
  const selectedSnapshotId = watch('snapshotId');

  // Repositories
  const { records: nisabRecords, isLoading: isLoadingNisabRecords } = useNisabRecordRepository();
  const { addPayment, updatePayment, removePayment } = usePaymentRepository();

  const lockedNisabRecord = useMemo(() => (
    lockedRecordIdFromProps
      ? nisabRecords.find(record => record.id === lockedRecordIdFromProps)
      : undefined
  ), [lockedRecordIdFromProps, nisabRecords]);

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
    setIsSubmitting(true);
    // Transform date to ISO
    const isoDate = new Date(data.paymentDate).toISOString();

    const paymentData = {
      ...data,
      amount: parseFloat(data.amount),
      paymentDate: isoDate,
      recipientType: 'individual' as const,
      status: 'recorded' as const,
    };

    try {
      if (isEditing && payment) {
        await updatePayment(payment.id, paymentData as any);
        toast.success('Payment updated');
        onSuccess?.({ ...payment, ...paymentData, amount: paymentData.amount }); // Optimistic result pass-back
      } else {
        await addPayment(paymentData as any);
        toast.success('Payment recorded');
        onSuccess?.({
          ...paymentData,
          userId: 'local-user',
          id: 'temp-id',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any);
      }
    } catch (error) {
      console.error(error);
      toast.error('Error saving payment record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!payment) return;
    if (!window.confirm('Delete this payment? This action cannot be undone.')) return;

    setIsSubmitting(true);
    try {
      await removePayment(payment.id);
      toast.success('Payment deleted');
      onCancel?.();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete payment');
    } finally {
      setIsSubmitting(false);
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
          ) : nisabRecords.length === 0 ? (
            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
              <p className="text-sm text-yellow-800 mb-2">No active Nisab Year Records found.</p>
              <p className="text-xs text-yellow-700 mb-3">You must create a Nisab Year Record to link this payment to.</p>
              <Button type="button" variant="outline" size="sm" onClick={() => window.open('/nisab-records', '_blank')}>
                Create Nisab Record (Opens in new tab)
              </Button>
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
                {nisabRecords.map((record) => (
                  <option key={record.id} value={record.id}>
                    {record.gregorianYear || new Date(record.createdAt || new Date().toISOString()).getFullYear() || 'N/A'} ({record.hijriYear ?? 'Hijri N/A'} AH) - {record.status}
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
            error={errors.amount?.message}
            {...register('amount')}
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
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.recipientCategory ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
        >
          {ZAKAT_RECIPIENTS.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
        <p id="recipientCategory-desc" className="mt-1 text-xs text-gray-500">
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

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto sm:min-w-[120px]"
        >
          {isSubmitting ? (
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
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="w-full sm:w-auto sm:min-w-[120px]"
          >
            {isSubmitting ? 'Deleting...' : 'Delete Payment'}
          </Button>
        )}

        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto sm:min-w-[120px]"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};