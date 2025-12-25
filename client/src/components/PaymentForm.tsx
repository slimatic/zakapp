import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPaymentSchema, CreatePaymentInput } from '@zakapp/shared'; // Importing from root of shared as per index.ts
import { z } from 'zod';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { TextArea } from './ui/TextArea';
import { LoadingSpinner } from './ui/LoadingSpinner';

// Extend the shared schema to handle the form-specific date format (YYYY-MM-DD)
// The shared schema expects an ISO datetime string.
const paymentFormSchema = createPaymentSchema.extend({
  paymentDate: z.string().min(1, 'Payment date is required'),
  amount: z.string()
    .min(1, 'Amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid decimal number'),
  recipientName: z.string().min(1, 'Recipient name is required'),
  recipientType: z.enum(['individual', 'organization', 'charity', 'mosque', 'family', 'other'], {
    errorMap: () => ({ message: 'Recipient type is required' })
  }),
  recipientCategory: z.enum(['poor', 'orphans', 'widows', 'education', 'healthcare', 'infrastructure', 'general'], {
    errorMap: () => ({ message: 'Recipient category is required' })
  }),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'check', 'crypto', 'other'], {
    errorMap: () => ({ message: 'Payment method is required' })
  }),
  currency: z.string().default('USD'),
  exchangeRate: z.number().default(1.0),
});

type PaymentFormSchemaType = z.infer<typeof paymentFormSchema>;

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
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormSchemaType>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      recipientName: '',
      recipientType: undefined, // Let user select
      recipientCategory: undefined, // Let user select
      paymentMethod: undefined, // Let user select
      notes: '',
      receiptReference: '',
      currency: 'USD',
      exchangeRate: 1.0,
      snapshotId: 'temp-snapshot-id', // Required by schema but likely hidden/managed elsewhere. Placeholder for now.
    },
  });

  const onSubmitForm = (data: PaymentFormSchemaType) => {
    // Transform the date from YYYY-MM-DD to ISO string for the shared schema/backend
    const isoDate = new Date(data.paymentDate).toISOString();

    const submitData: PaymentFormData = {
      amount: data.amount,
      paymentDate: isoDate,
      recipientName: data.recipientName,
      recipientType: data.recipientType,
      recipientCategory: data.recipientCategory,
      paymentMethod: data.paymentMethod,
      notes: data.notes || '',
      currency: data.currency,
      exchangeRate: data.exchangeRate,
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount')}
          // Override onChange to handle potential numeric cleanup if needed, but RHF handles strings fine
          />
        </div>

        <div>
          <Input
            label="Payment Date"
            type="date"
            error={errors.paymentDate?.message}
            {...register('paymentDate')}
          />
        </div>
      </div>

      <div>
        <Input
          label="Recipient Name"
          placeholder="Enter recipient name or organization"
          error={errors.recipientName?.message}
          {...register('recipientName')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select
            label="Recipient Type"
            error={errors.recipientType?.message}
            {...register('recipientType')}
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
            error={errors.recipientCategory?.message}
            {...register('recipientCategory')}
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
          error={errors.paymentMethod?.message}
          {...register('paymentMethod')}
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
          placeholder="Optional notes about this payment"
          rows={3}
          error={errors.notes?.message}
          {...register('notes')}
        />
      </div>

      {/* Hidden fields for data consistency */}
      <input type="hidden" {...register('snapshotId')} />

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