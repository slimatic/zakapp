import { render, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { AssetManagement } from '../AssetManagement';
import { Asset } from '@zakapp/shared';

// Mock the hooks module to avoid actual API calls
vi.mock('../../../hooks', () => ({
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
  it('should render without crashing', () => {
    const mockOnCreateAsset = vi.fn();
    const mockOnUpdateAsset = vi.fn();
    const mockOnDeleteAsset = vi.fn();

    const { container } = render(
      <AssetManagement
        assets={[]}
        onCreateAsset={mockOnCreateAsset}
        onUpdateAsset={mockOnUpdateAsset}
        onDeleteAsset={mockOnDeleteAsset}
      />
    );

    expect(container).toBeTruthy();
  });

  it('should render assets when provided via props', () => {
    const mockOnCreateAsset = vi.fn();
    const mockOnUpdateAsset = vi.fn();
    const mockOnDeleteAsset = vi.fn();

    const { getByText } = render(
      <AssetManagement
        assets={[mockAsset]}
        onCreateAsset={mockOnCreateAsset}
        onUpdateAsset={mockOnUpdateAsset}
        onDeleteAsset={mockOnDeleteAsset}
      />
    );

    expect(getByText('Test Asset')).toBeTruthy();
  });

  it('should update when props assets change (fix verification)', async () => {
    const mockOnCreateAsset = vi.fn();
    const mockOnUpdateAsset = vi.fn();
    const mockOnDeleteAsset = vi.fn();

    // Initial render with empty assets
    const { rerender, queryByText } = render(
      <AssetManagement
        assets={[]}
        onCreateAsset={mockOnCreateAsset}
        onUpdateAsset={mockOnUpdateAsset}
        onDeleteAsset={mockOnDeleteAsset}
      />
    );

    // Initially no asset should be visible
    expect(queryByText('Test Asset')).toBeFalsy();

    // Re-render with an asset (simulating CRUD operation result)
    rerender(
      <AssetManagement
        assets={[mockAsset]}
        onCreateAsset={mockOnCreateAsset}
        onUpdateAsset={mockOnUpdateAsset}
        onDeleteAsset={mockOnDeleteAsset}
      />
    );

    // Now the asset should be visible (this tests our fix)
    await waitFor(() => {
      expect(queryByText('Test Asset')).toBeTruthy();
    });

    // Test asset removal
    rerender(
      <AssetManagement
        assets={[]}
        onCreateAsset={mockOnCreateAsset}
        onUpdateAsset={mockOnUpdateAsset}
        onDeleteAsset={mockOnDeleteAsset}
      />
    );

    // Asset should be gone after deletion
    await waitFor(() => {
      expect(queryByText('Test Asset')).toBeFalsy();
    });
  });
});