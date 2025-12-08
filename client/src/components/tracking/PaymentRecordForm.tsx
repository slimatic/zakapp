/**
 * PaymentRecordForm Component - T061
 * Form for creating/editing Zakat payment records with Islamic recipient categories
 */

import React, { useState, useEffect } from 'react';
import { useCreatePayment, useUpdatePayment } from '../../hooks/usePayments';
import { useSnapshots } from '../../hooks/useSnapshots';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';

// Helper function to parse currency input
const parseCurrency = (value: string): number => {
  const numericValue = value.replace(/[^0-9.-]/g, '');
  return parseFloat(numericValue) || 0;
};

interface PaymentRecordFormProps {
  snapshotId?: string;
  payment?: PaymentRecord; // For editing existing payments
  onSuccess?: (payment: PaymentRecord) => void;
  onCancel?: () => void;
}

// Islamic recipient categories (8 categories of Zakat recipients)
const ZAKAT_RECIPIENTS = [
  { value: 'fakir', label: 'Al-Fuqara (The Poor)', description: 'Those who own less than the nisab threshold' },
  { value: 'miskin', label: 'Al-Masakin (The Needy)', description: 'Those in desperate circumstances' },
  { value: 'amil', label: 'Al-Amilin (Zakat Administrators)', description: 'Those who collect and distribute Zakat' },
  { value: 'muallaf', label: 'Al-Muallafah (New Muslims)', description: 'Those whose hearts are to be reconciled' },
  { value: 'riqab', label: 'Ar-Riqab (Freeing Slaves)', description: 'To free those in bondage' },
  { value: 'gharimin', label: 'Al-Gharimin (Debt-ridden)', description: 'Those overwhelmed by debt' },
  { value: 'fisabilillah', label: 'Fi Sabilillah (In the way of Allah)', description: 'For the cause of Allah' },
  { value: 'ibnus_sabil', label: 'Ibn as-Sabil (Traveler)', description: 'Stranded travelers in need' }
] as const;

type ZakatRecipientCategory = typeof ZAKAT_RECIPIENTS[number]['value'];

export const PaymentRecordForm: React.FC<PaymentRecordFormProps> = ({
  snapshotId: propSnapshotId,
  payment,
  onSuccess,
  onCancel
}) => {
  const isEditing = !!payment;
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(propSnapshotId || payment?.snapshotId || '');
  
  // Fetch snapshots if not provided via props
  const { data: snapshotsData, isLoading: isLoadingSnapshots } = useSnapshots({
    status: 'all', // Fetch all to allow selection, though typically we want active ones
    enabled: !propSnapshotId
  });

  // Update selected snapshot if prop changes
  useEffect(() => {
    if (propSnapshotId) {
      setSelectedSnapshotId(propSnapshotId);
    }
  }, [propSnapshotId]);

  // Form state
  const [formData, setFormData] = useState({
    amount: payment?.amount?.toString() || '',
    category: payment?.recipientCategory || ('fakir' as ZakatRecipientCategory),
    recipient: payment?.recipientName || '',
    description: '', // Not stored in PaymentRecord, use notes instead
    paymentDate: payment?.paymentDate ? 
      (typeof payment.paymentDate === 'string' ? payment.paymentDate.slice(0, 10) : payment.paymentDate.toISOString().slice(0, 10)) :
      new Date().toISOString().slice(0, 10), // YYYY-MM-DD format
    paymentMethod: payment?.paymentMethod || 'cash',
    reference: payment?.receiptReference || '',
    notes: payment?.notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mutations
  const createPaymentMutation = useCreatePayment();
  const updatePaymentMutation = useUpdatePayment();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Snapshot validation
    if (!selectedSnapshotId) {
      newErrors.snapshotId = 'Please select a Nisab Year Record';
    }

    // Amount validation
    const amount = parseCurrency(formData.amount);
    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }

    // Recipient validation
    if (!formData.recipient.trim()) {
      newErrors.recipient = 'Recipient is required';
    } else if (formData.recipient.length < 2) {
      newErrors.recipient = 'Recipient must be at least 2 characters';
    }

    // Payment date validation
    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    } else {
      const paymentDate = new Date(formData.paymentDate);
      const now = new Date();
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      
      if (paymentDate < oneYearAgo) {
        newErrors.paymentDate = 'Payment date cannot be more than 1 year ago';
      } else if (paymentDate > oneYearFromNow) {
        newErrors.paymentDate = 'Payment date cannot be more than 1 year in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const paymentData = {
        snapshotId: selectedSnapshotId,
        amount: parseCurrency(formData.amount),
        recipientName: formData.recipient.trim(),
        recipientType: 'individual' as const, // Default type
        recipientCategory: formData.category,
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
        receiptReference: formData.reference.trim() || undefined,
        notes: formData.notes.trim() || undefined
      };

      let result: PaymentRecord;
      
      if (isEditing && payment) {
        result = await updatePaymentMutation.mutateAsync({
          id: payment.id,
          snapshotId: selectedSnapshotId,
          data: paymentData
        });
      } else {
        result = await createPaymentMutation.mutateAsync(paymentData);
      }

      onSuccess?.(result);
    } catch (error) {
      console.error('Error saving payment record:', error);
    }
  };

  const isLoading = createPaymentMutation.isPending || updatePaymentMutation.isPending;
  const submitError = createPaymentMutation.error || updatePaymentMutation.error;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {isEditing ? 'Edit Payment Record' : 'Add Payment Record'}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Record your Zakat payment according to Islamic guidelines
        </p>
      </div>

      {/* Snapshot Selection (if not provided via props) */}
      {!propSnapshotId ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nisab Year Record *
            <span className="ml-2 text-xs font-normal text-gray-500">
              (Select the Hawl period for this payment)
            </span>
          </label>
          {isLoadingSnapshots ? (
            <div className="flex items-center text-sm text-gray-500">
              <LoadingSpinner size="sm" className="mr-2" />
              Loading records...
            </div>
          ) : (
            <>
              <select
                value={selectedSnapshotId}
                onChange={(e) => setSelectedSnapshotId(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.snapshotId ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a Nisab Year Record</option>
                {snapshotsData?.snapshots.map((snapshot) => (
                  <option key={snapshot.id} value={snapshot.id}>
                    {new Date(snapshot.createdAt).getFullYear()} - {snapshot.status} 
                    {snapshot.hawlStartDate ? ` (Started: ${new Date(snapshot.hawlStartDate).toLocaleDateString()})` : ''}
                  </option>
                ))}
              </select>
              {!errors.snapshotId && (
                <p className="mt-1 text-xs text-gray-500">
                  Link this payment to a specific Nisab Year (Hawl period) for accurate tracking
                </p>
              )}
            </>
          )}
          {errors.snapshotId && (
            <p className="mt-1 text-sm text-red-600">{errors.snapshotId}</p>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nisab Year Record
          </label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
            <div className="flex items-center justify-between">
              <span>
                {snapshotsData?.snapshots.find(s => s.id === propSnapshotId)?.hawlStartDate 
                  ? `${new Date(snapshotsData.snapshots.find(s => s.id === propSnapshotId)!.hawlStartDate!).getFullYear()} Nisab Year`
                  : 'Selected Nisab Year Record'}
              </span>
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This payment will be linked to the selected Nisab Year Record
            </p>
          </div>
        </div>
      )}

      {/* Amount */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount Paid *
          </label>
          <Input
            type="text"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            error={errors.amount}
            className="text-right"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the amount in your local currency
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Date *
          </label>
          <Input
            type="date"
            value={formData.paymentDate}
            onChange={(e) => handleInputChange('paymentDate', e.target.value)}
            error={errors.paymentDate}
          />
        </div>
      </div>

      {/* Recipient Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zakat Recipient Category *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ZAKAT_RECIPIENTS.map((category) => (
            <div key={category.value} className="relative">
              <label className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="category"
                  value={category.value}
                  checked={formData.category === category.value}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {category.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {category.description}
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Recipient Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Recipient Name/Organization *
          </label>
          <Input
            type="text"
            placeholder="Enter recipient name or organization"
            value={formData.recipient}
            onChange={(e) => handleInputChange('recipient', e.target.value)}
            error={errors.recipient}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <select
            value={formData.paymentMethod}
            onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="check">Check</option>
            <option value="online">Online Payment</option>
            <option value="cryptocurrency">Cryptocurrency</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Optional Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <Input
            type="text"
            placeholder="Brief description of the payment"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reference/Transaction ID
          </label>
          <Input
            type="text"
            placeholder="Transaction reference or receipt number"
            value={formData.reference}
            onChange={(e) => handleInputChange('reference', e.target.value)}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          rows={3}
          placeholder="Any additional notes or context about this payment"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Error Display */}
      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">
            {typeof submitError === 'string' ? submitError : 'Failed to save payment record. Please try again.'}
          </p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isLoading}
          className="flex-1 sm:flex-none"
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
        
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Islamic Information */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-green-800">
              Islamic Guidelines for Zakat Distribution
            </h4>
            <p className="text-sm text-green-700 mt-1">
              The Quran specifies eight categories of people eligible to receive Zakat (Quran 9:60). 
              Choose the appropriate category that best describes your recipient to ensure Islamic compliance.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
};