/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { SnapshotForm } from './SnapshotForm';

/**
 * SnapshotForm Component Stories
 * 
 * The SnapshotForm component allows users to create and edit yearly Zakat snapshots
 * with full asset breakdown and dual calendar support (Gregorian + Hijri).
 */
const meta = {
  title: 'Tracking/SnapshotForm',
  component: SnapshotForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Form for creating and editing Zakat snapshots with dual calendar support and automatic calculations.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['create', 'edit'],
      description: 'Form mode - create new or edit existing snapshot',
    },
    initialData: {
      control: 'object',
      description: 'Initial snapshot data for edit mode',
    },
    onSubmit: {
      action: 'submitted',
      description: 'Callback when form is submitted',
    },
    onCancel: {
      action: 'cancelled',
      description: 'Callback when form is cancelled',
    },
  },
} satisfies Meta<typeof SnapshotForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default Create Mode
 * Empty form for creating a new snapshot
 */
export const CreateMode: Story = {
  args: {
    mode: 'create',
    onSubmit: (data) => console.log('Submitted:', data),
    onCancel: () => console.log('Cancelled'),
  },
};

/**
 * Edit Mode with Draft Snapshot
 * Editing an existing draft snapshot
 */
export const EditDraft: Story = {
  args: {
    mode: 'edit',
    initialData: {
      id: 'snap_1234567890abcdef',
      snapshotDate: '2024-01-01T00:00:00Z',
      snapshotDateHijri: '1446-06-19',
      totalWealth: 150000,
      totalLiabilities: 20000,
      zakatableWealth: 130000,
      zakatDue: 3250,
      methodology: 'standard',
      nisabThreshold: 85000,
      nisabType: 'gold',
      status: 'draft',
      notes: 'Annual Zakat calculation for 2024',
      assets: {
        cash: 50000,
        bankAccounts: 40000,
        investments: 30000,
        gold: 20000,
        realEstate: 10000,
      },
    },
    onSubmit: (data) => console.log('Updated:', data),
    onCancel: () => console.log('Cancelled'),
  },
};

/**
 * View Finalized Snapshot
 * Viewing a finalized snapshot (read-only)
 */
export const ViewFinalized: Story = {
  args: {
    mode: 'view',
    initialData: {
      id: 'snap_abcdef1234567890',
      snapshotDate: '2024-01-01T00:00:00Z',
      snapshotDateHijri: '1446-06-19',
      totalWealth: 150000,
      totalLiabilities: 20000,
      zakatableWealth: 130000,
      zakatDue: 3250,
      methodology: 'standard',
      nisabThreshold: 85000,
      nisabType: 'gold',
      status: 'finalized',
      finalizedAt: '2024-01-15T10:30:00Z',
      notes: 'Finalized snapshot for 2024',
      assets: {
        cash: 50000,
        bankAccounts: 40000,
        investments: 30000,
        gold: 20000,
        realEstate: 10000,
      },
    },
  },
};

/**
 * With Validation Errors
 * Form with validation errors displayed
 */
export const WithErrors: Story = {
  args: {
    mode: 'create',
    onSubmit: (data) => console.log('Submitted:', data),
    errors: {
      totalWealth: 'Total wealth must be greater than 0',
      snapshotDate: 'Snapshot date is required',
    },
  },
};

/**
 * Loading State
 * Form in loading state during submission
 */
export const Loading: Story = {
  args: {
    mode: 'create',
    isLoading: true,
    onSubmit: (data) => console.log('Submitted:', data),
  },
};

/**
 * With All Asset Categories
 * Form with all asset categories populated
 */
export const CompleteAssets: Story = {
  args: {
    mode: 'edit',
    initialData: {
      snapshotDate: '2024-01-01T00:00:00Z',
      snapshotDateHijri: '1446-06-19',
      totalWealth: 250000,
      totalLiabilities: 30000,
      zakatableWealth: 220000,
      zakatDue: 5500,
      methodology: 'hanafi',
      nisabThreshold: 5000,
      nisabType: 'silver',
      status: 'draft',
      assets: {
        cash: 30000,
        bankAccounts: 60000,
        investments: 80000,
        gold: 25000,
        silver: 10000,
        realEstate: 40000,
        businessAssets: 5000,
        crypto: 15000,
      },
    },
  },
};
