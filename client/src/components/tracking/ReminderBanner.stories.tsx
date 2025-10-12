import type { Meta, StoryObj } from '@storybook/react';
import { ReminderBanner } from './ReminderBanner';

/**
 * ReminderBanner Component Stories
 * 
 * The ReminderBanner component displays important Zakat-related reminders
 * and notifications with action buttons.
 */
const meta = {
  title: 'Tracking/ReminderBanner',
  component: ReminderBanner,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Banner component for displaying Zakat reminders with priority levels and action buttons.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ReminderBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Anniversary Reminder
 * Zakat anniversary is approaching
 */
export const Anniversary: Story = {
  args: {
    reminder: {
      id: 'rem_1234567890abcdef',
      type: 'zakat_anniversary',
      priority: 'high',
      title: "It's Time to Calculate Your 2025 Zakat!",
      message: 'Your Zakat anniversary is approaching. Create your 2025 snapshot to stay on track.',
      eventDate: '2025-01-15',
      eventDateHijri: '1447-06-19',
      relatedSnapshotId: 'snap_2024_abcdef',
      createdAt: '2025-01-08',
    },
    onAcknowledge: () => console.log('Acknowledged'),
    onDismiss: () => console.log('Dismissed'),
    onAction: () => console.log('Action clicked'),
  },
};

/**
 * Payment Due Reminder
 * Unpaid Zakat remaining
 */
export const PaymentDue: Story = {
  args: {
    reminder: {
      id: 'rem_abcdef1234567890',
      type: 'payment_due',
      priority: 'high',
      title: 'Zakat Payment Remaining',
      message: 'You have $1,250 in unpaid Zakat for 2024. Complete your obligations.',
      eventDate: '2024-12-31',
      relatedSnapshotId: 'snap_2024_abcdef',
      createdAt: '2024-10-01',
    },
    onAcknowledge: () => console.log('Acknowledged'),
    onDismiss: () => console.log('Dismissed'),
    onAction: () => console.log('Record payment clicked'),
  },
};

/**
 * Calculation Reminder
 * Update asset values
 */
export const CalculationReminder: Story = {
  args: {
    reminder: {
      id: 'rem_calculation_001',
      type: 'calculation_reminder',
      priority: 'medium',
      title: 'Update Your Asset Values',
      message: "It's been 6 months since your last calculation. Update your asset values for accuracy.",
      createdAt: '2024-10-01',
    },
    onAcknowledge: () => console.log('Acknowledged'),
    onDismiss: () => console.log('Dismissed'),
    onAction: () => console.log('Update calculator clicked'),
  },
};

/**
 * Info Reminder
 * Educational content
 */
export const InfoReminder: Story = {
  args: {
    reminder: {
      id: 'rem_info_001',
      type: 'info',
      priority: 'low',
      title: 'Learn About Zakat Recipients',
      message: 'Discover the 8 categories of Zakat recipients and how to distribute your Zakat properly.',
      createdAt: '2024-10-01',
    },
    onAcknowledge: () => console.log('Acknowledged'),
    onDismiss: () => console.log('Dismissed'),
    onAction: () => console.log('Learn more clicked'),
  },
};

/**
 * Overdue Reminder
 * Past due reminder
 */
export const Overdue: Story = {
  args: {
    reminder: {
      id: 'rem_overdue_001',
      type: 'payment_due',
      priority: 'high',
      title: 'Overdue: Zakat Payment Required',
      message: 'Your 2023 Zakat is overdue. Please complete your payment as soon as possible.',
      eventDate: '2024-01-15',
      eventDateHijri: '1446-06-19',
      relatedSnapshotId: 'snap_2023_abcdef',
      createdAt: '2024-02-01',
      isOverdue: true,
    },
    onAcknowledge: () => console.log('Acknowledged'),
    onDismiss: () => console.log('Dismissed'),
    onAction: () => console.log('Pay now clicked'),
  },
};

/**
 * With Hijri Date
 * Reminder displaying both calendar systems
 */
export const WithHijriDate: Story = {
  args: {
    reminder: {
      id: 'rem_hijri_001',
      type: 'zakat_anniversary',
      priority: 'high',
      title: 'Ramadan 15, 1447 - Zakat Anniversary',
      message: 'Your Zakat anniversary falls on Ramadan 15, 1447 (March 3, 2025).',
      eventDate: '2025-03-03',
      eventDateHijri: '1447-09-15',
      relatedSnapshotId: 'snap_2024_abcdef',
      createdAt: '2025-02-24',
    },
    showHijriDate: true,
    onAcknowledge: () => console.log('Acknowledged'),
    onDismiss: () => console.log('Dismissed'),
    onAction: () => console.log('View snapshot clicked'),
  },
};

/**
 * Acknowledged State
 * Reminder that has been acknowledged
 */
export const Acknowledged: Story = {
  args: {
    reminder: {
      id: 'rem_ack_001',
      type: 'calculation_reminder',
      priority: 'medium',
      title: 'Asset Value Update Reminder',
      message: 'Time to update your asset values for accurate Zakat calculation.',
      createdAt: '2024-09-15',
      acknowledgedAt: '2024-10-01',
      status: 'acknowledged',
    },
    onDismiss: () => console.log('Dismissed'),
  },
};

/**
 * Snoozed Reminder
 * Reminder that has been snoozed
 */
export const Snoozed: Story = {
  args: {
    reminder: {
      id: 'rem_snooze_001',
      type: 'payment_due',
      priority: 'medium',
      title: 'Payment Reminder',
      message: 'You have $500 remaining in Zakat payments.',
      createdAt: '2024-09-20',
      snoozedUntil: '2024-10-15',
      status: 'snoozed',
    },
    onAcknowledge: () => console.log('Acknowledged'),
    onDismiss: () => console.log('Dismissed'),
    onAction: () => console.log('Record payment'),
  },
};

/**
 * Multiple Actions
 * Reminder with multiple action buttons
 */
export const MultipleActions: Story = {
  args: {
    reminder: {
      id: 'rem_multi_001',
      type: 'zakat_anniversary',
      priority: 'high',
      title: 'Create Your 2025 Snapshot',
      message: 'Your Zakat anniversary is here. Create your snapshot or view last year\'s data.',
      eventDate: '2025-01-15',
      relatedSnapshotId: 'snap_2024_abcdef',
      createdAt: '2025-01-15',
    },
    actions: [
      { label: 'Create Snapshot', onClick: () => console.log('Create'), variant: 'primary' },
      { label: 'View 2024', onClick: () => console.log('View'), variant: 'secondary' },
    ],
    onAcknowledge: () => console.log('Acknowledged'),
    onDismiss: () => console.log('Dismissed'),
  },
};

/**
 * Compact Banner
 * Minimal banner layout
 */
export const Compact: Story = {
  args: {
    reminder: {
      id: 'rem_compact_001',
      type: 'info',
      priority: 'low',
      title: 'New Feature Available',
      message: 'Try our new multi-year comparison tool!',
      createdAt: '2024-10-01',
    },
    variant: 'compact',
    onDismiss: () => console.log('Dismissed'),
  },
};
