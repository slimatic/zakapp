import React, { useState } from 'react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { TextArea } from '@components/ui/TextArea';
import { LoadingSpinner } from '@components/ui/LoadingSpinner';

export interface PaymentFormData {
  amount: string;
  paymentDate: string;
  recipientName: string;
  recipientType: string;
  recipientCategory: string;
  paymentMethod: string;
  notes: string;
  currency: string;
  exchangeRate: number;
}

interface PaymentFormProps {
  onSubmit: (data: PaymentFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const RECIPIENT_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'mosque', label: 'Mosque' },
  { value: 'charity', label: 'Charity Organization' },
  { value: 'orphanage', label: 'Orphanage' },
  { value: 'school', label: 'Islamic School' },
  { value: 'other', label: 'Other' }
];

const RECIPIENT_CATEGORIES = [
  { value: 'poor', label: 'Poor (Fuqara)' },
  { value: 'needy', label: 'Needy (Masakin)' },
  { value: 'orphans', label: 'Orphans' },
  { value: 'widows', label: 'Widows' },
  { value: 'education', label: 'Education' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'general', label: 'General Welfare' },
  { value: 'other', label: 'Other' }
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'online', label: 'Online Payment' },
  { value: 'other', label: 'Other' }
];

export const PaymentForm: React.FC<PaymentFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    recipientName: '',
    recipientType: '',
    recipientCategory: '',
    paymentMethod: '',
    notes: '',
    currency: 'USD',
    exchangeRate: 1.0
  });

  const [errors, setErrors] = useState<Partial<PaymentFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentFormData> = {};

    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(formData.amount)) || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a valid positive number';
    }

    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'Recipient name is required';
    }

    if (!formData.recipientType) {
      newErrors.recipientType = 'Recipient type is required';
    }

    if (!formData.recipientCategory) {
      newErrors.recipientCategory = 'Recipient category is required';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      ...formData,
      amount: formData.amount,
      exchangeRate: parseFloat(formData.exchangeRate.toString()) || 1.0
    });
  };

  const handleInputChange = (field: keyof PaymentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            error={errors.amount}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <Input
            label="Payment Date"
            type="date"
            value={formData.paymentDate}
            onChange={(e) => handleInputChange('paymentDate', e.target.value)}
            error={errors.paymentDate}
            required
          />
        </div>
      </div>

      <div>
        <Input
          label="Recipient Name"
          value={formData.recipientName}
          onChange={(e) => handleInputChange('recipientName', e.target.value)}
          error={errors.recipientName}
          placeholder="Enter recipient name or organization"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select
            label="Recipient Type"
            value={formData.recipientType}
            onValueChange={(value) => handleInputChange('recipientType', value)}
            error={errors.recipientType}
            required
          >
            <option value="">Select recipient type</option>
            {RECIPIENT_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Select
            label="Recipient Category"
            value={formData.recipientCategory}
            onValueChange={(value) => handleInputChange('recipientCategory', value)}
            error={errors.recipientCategory}
            required
          >
            <option value="">Select category</option>
            {RECIPIENT_CATEGORIES.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Select
          label="Payment Method"
          value={formData.paymentMethod}
          onValueChange={(value) => handleInputChange('paymentMethod', value)}
          error={errors.paymentMethod}
          required
        >
          <option value="">Select payment method</option>
          {PAYMENT_METHODS.map(method => (
            <option key={method.value} value={method.value}>
              {method.label}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <TextArea
          label="Notes"
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Optional notes about this payment"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            'Submit'
          )}
        </Button>
      </div>
    </form>
  );
};