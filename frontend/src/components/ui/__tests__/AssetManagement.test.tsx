import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { AssetManagement } from '../AssetManagement';
import { Asset, AssetFormData } from '@zakapp/shared';

// Mock the hooks module to avoid actual API calls
jest.mock('../../../hooks', () => ({
  useUserAssets: () => ({ data: null }),
}));

const mockAsset: Asset = {
  assetId: '1',
  name: 'Test Asset',
  category: 'cash',
  subCategory: 'Checking Account',
  value: 1000,
  currency: 'USD',
  description: 'Test description',
  zakatEligible: true,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

describe('AssetManagement', () => {
  it('should update local state when props assets change', async () => {
    const mockOnCreateAsset = jest.fn();
    const mockOnUpdateAsset = jest.fn();
    const mockOnDeleteAsset = jest.fn();

    // Initial render with empty assets
    const { rerender, getByText } = render(
      <AssetManagement
        assets={[]}
        onCreateAsset={mockOnCreateAsset}
        onUpdateAsset={mockOnUpdateAsset}
        onDeleteAsset={mockOnDeleteAsset}
      />
    );

    // Should show "No assets found" initially
    expect(getByText('No assets found')).toBeInTheDocument();

    // Re-render with an asset (simulating CRUD operation result)
    rerender(
      <AssetManagement
        assets={[mockAsset]}
        onCreateAsset={mockOnCreateAsset}
        onUpdateAsset={mockOnUpdateAsset}
        onDeleteAsset={mockOnDeleteAsset}
      />
    );

    // Should now show the asset name
    await waitFor(() => {
      expect(getByText('Test Asset')).toBeInTheDocument();
    });
  });

  it('should update local state when asset is updated via props', async () => {
    const mockOnCreateAsset = jest.fn();
    const mockOnUpdateAsset = jest.fn();
    const mockOnDeleteAsset = jest.fn();

    const updatedAsset: Asset = {
      ...mockAsset,
      name: 'Updated Test Asset',
      value: 2000,
    };

    // Initial render with original asset
    const { rerender, getByText } = render(
      <AssetManagement
        assets={[mockAsset]}
        onCreateAsset={mockOnCreateAsset}
        onUpdateAsset={mockOnUpdateAsset}
        onDeleteAsset={mockOnDeleteAsset}
      />
    );

    expect(getByText('Test Asset')).toBeInTheDocument();

    // Re-render with updated asset (simulating update operation result)
    rerender(
      <AssetManagement
        assets={[updatedAsset]}
        onCreateAsset={mockOnCreateAsset}
        onUpdateAsset={mockOnUpdateAsset}
        onDeleteAsset={mockOnDeleteAsset}
      />
    );

    // Should now show the updated asset name
    await waitFor(() => {
      expect(getByText('Updated Test Asset')).toBeInTheDocument();
    });
  });

  it('should update local state when asset is deleted via props', async () => {
    const mockOnCreateAsset = jest.fn();
    const mockOnUpdateAsset = jest.fn();
    const mockOnDeleteAsset = jest.fn();

    // Initial render with asset
    const { rerender, getByText, queryByText } = render(
      <AssetManagement
        assets={[mockAsset]}
        onCreateAsset={mockOnCreateAsset}
        onUpdateAsset={mockOnUpdateAsset}
        onDeleteAsset={mockOnDeleteAsset}
      />
    );

    expect(getByText('Test Asset')).toBeInTheDocument();

    // Re-render with empty assets (simulating delete operation result)
    rerender(
      <AssetManagement
        assets={[]}
        onCreateAsset={mockOnCreateAsset}
        onUpdateAsset={mockOnUpdateAsset}
        onDeleteAsset={mockOnDeleteAsset}
      />
    );

    // Should no longer show the asset
    await waitFor(() => {
      expect(queryByText('Test Asset')).not.toBeInTheDocument();
      expect(getByText('No assets found')).toBeInTheDocument();
    });
  });
});