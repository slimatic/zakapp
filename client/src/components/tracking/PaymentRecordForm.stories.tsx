import type { Meta, StoryObj } from '@storybook/react';
import { PaymentRecordForm } from './PaymentRecordForm';

/**
 * PaymentRecordForm Component Stories
 * 
 * The PaymentRecordForm component allows users to record Zakat payments
 * to the 8 Islamic recipient categories with dual calendar support.
 */
const meta = {
  title: 'Tracking/PaymentRecordForm',
  component: PaymentRecordForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Form for recording Zakat payments with Islamic category selection and dual calendar dates.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    snapshotId: {
      control: 'text',
      description: 'ID of the snapshot to record payment for',
    },
    zakatDue: {
      control: 'number',
      description: 'Total Zakat due for validation',
    },
    totalPayments: {
      control: 'number',
      description: 'Total payments already made',
    },
    onSubmit: {
      action: 'submitted',
      description: 'Callback when payment is recorded',
    },
    onCancel: {
      action: 'cancelled',
      description: 'Callback when form is cancelled',
    },
  },
} satisfies Meta<typeof PaymentRecordForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default Payment Form
 * Empty form for recording a new payment
 */
export const Default: Story = {
  args: {
    snapshotId: 'snap_1234567890abcdef',
    zakatDue: 3250,
    totalPayments: 0,
    onSubmit: (data) => console.log('Payment recorded:', data),
    onCancel: () => console.log('Cancelled'),
  },
};

/**
 * Partial Payment Remaining
 * Form when some Zakat has already been paid
 */
export const PartialPayment: Story = {
  args: {
    snapshotId: 'snap_1234567890abcdef',
    zakatDue: 3250,
    totalPayments: 2000,
    onSubmit: (data) => console.log('Payment recorded:', data),
  },
};

/**
 * Edit Existing Payment
 * Editing a previously recorded payment
 */
export const EditPayment: Story = {
  args: {
    mode: 'edit',
    snapshotId: 'snap_1234567890abcdef',
    zakatDue: 3250,
    totalPayments: 2000,
    initialData: {
      id: 'pay_abcdef1234567890',
      amount: 1000,
      paymentDate: '2024-02-01T00:00:00Z',
      paymentDateHijri: '1446-07-21',
      category: 'fakir',
      recipientType: 'individual',
      recipientName: 'Abdullah ibn Umar',
      receiptReference: 'RCP-2024-001',
      notes: 'Monthly Zakat distribution',
    },
    onSubmit: (data) => console.log('Payment updated:', data),
  },
};

/**
 * Payment to Organization
 * Recording payment to an Islamic organization
 */
export const OrganizationPayment: Story = {
  args: {
    snapshotId: 'snap_1234567890abcdef',
    zakatDue: 3250,
    totalPayments: 1000,
    initialData: {
      category: 'fisabilillah',
      recipientType: 'organization',
      recipientName: 'Local Islamic Center',
      receiptReference: 'ORG-2024-042',
    },
    onSubmit: (data) => console.log('Payment recorded:', data),
  },
};

/**
 * With Validation Errors
 * Form with validation errors displayed
 */
export const WithErrors: Story = {
  args: {
    snapshotId: 'snap_1234567890abcdef',
    zakatDue: 3250,
    totalPayments: 3000,
    onSubmit: (data) => console.log('Payment recorded:', data),
    errors: {
      amount: 'Payment amount exceeds remaining Zakat due ($250)',
      paymentDate: 'Payment date is required',
      category: 'Recipient category is required',
    },
  },
};

/**
 * All Categories Example
 * Showcasing all 8 Zakat recipient categories
 */
export const AllCategories: Story = {
  args: {
    snapshotId: 'snap_1234567890abcdef',
    zakatDue: 3250,
    totalPayments: 0,
    onSubmit: (data) => console.log('Payment recorded:', data),
  },
  parameters: {
    docs: {
      description: {
        story: 'The form supports all 8 Quranic Zakat recipient categories: Al-Fuqara (fakir), Al-Masakin (miskin), Al-Amilin (amil), Al-Muallafah Qulubuhum (muallaf), Ar-Riqab (riqab), Al-Gharimin (gharim), Fi Sabilillah (fisabilillah), and Ibn as-Sabil (ibnsabil).',
      },
    },
  },
};

/**
 * Loading State
 * Form in loading state during submission
 */
export const Loading: Story = {
  args: {
    snapshotId: 'snap_1234567890abcdef',
    zakatDue: 3250,
    totalPayments: 1000,
    isLoading: true,
    onSubmit: (data) => console.log('Payment recorded:', data),
  },
};

/**
 * Nearly Complete
 * Form when almost all Zakat has been paid
 */
export const NearlyComplete: Story = {
  args: {
    snapshotId: 'snap_1234567890abcdef',
    zakatDue: 3250,
    totalPayments: 3200,
    onSubmit: (data) => console.log('Payment recorded:', data),
  },
  parameters: {
    docs: {
      description: {
        story: 'Form state when only a small amount of Zakat remains to be paid. Shows remaining amount clearly.',
      },
    },
  },
};
