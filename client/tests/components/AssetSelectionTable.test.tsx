/**
 * Component Test: AssetSelectionTable
 * Purpose: Test asset selection functionality for Nisab Year Record creation
 * Requirements: FR-038a
 * Expected: FAIL (component doesn't exist yet) - TDD approach
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssetSelectionTable } from '../../src/components/tracking/AssetSelectionTable';

// Mock asset data for testing
const mockAssets = [
  {
    id: 'asset-1',
    name: 'Savings Account',
    category: 'cash',
    value: 5000,
    isZakatable: true,
    addedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'asset-2',
    name: 'Bitcoin',
    category: 'crypto',
    value: 3000,
    isZakatable: true,
    addedAt: '2025-02-01T14:30:00Z',
  },
  {
    id: 'asset-3',
    name: 'Primary Residence',
    category: 'real_estate',
    value: 250000,
    isZakatable: false,
    addedAt: '2024-06-10T09:00:00Z',
  },
  {
    id: 'asset-4',
    name: 'Gold Jewelry',
    category: 'gold',
    value: 2500,
    isZakatable: true,
    addedAt: '2025-03-20T16:45:00Z',
  },
];

describe('AssetSelectionTable', () => {
  describe('Selection/Deselection Functionality', () => {
    it('should render all assets in a table', () => {
      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange} 
        />
      );

      // Verify table renders with all assets
      expect(screen.getByText('Savings Account')).toBeInTheDocument();
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('Primary Residence')).toBeInTheDocument();
      expect(screen.getByText('Gold Jewelry')).toBeInTheDocument();
    });

    it('should pre-select all zakatable assets by default', () => {
      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange} 
        />
      );

      // Find all checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      
      // Zakatable assets should be checked (assets 1, 2, 4)
      expect(checkboxes[0]).toBeChecked(); // Savings Account
      expect(checkboxes[1]).toBeChecked(); // Bitcoin
      expect(checkboxes[2]).not.toBeChecked(); // Primary Residence (not zakatable)
      expect(checkboxes[3]).toBeChecked(); // Gold Jewelry
    });

    it('should allow deselecting a zakatable asset', () => {
      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange} 
        />
      );

      // Find the checkbox for Savings Account
      const savingsCheckbox = screen.getAllByRole('checkbox')[0];
      
      // Deselect it
      fireEvent.click(savingsCheckbox);

      // Verify onSelectionChange was called with updated selection
      expect(onSelectionChange).toHaveBeenCalledWith(['asset-2', 'asset-4']);
    });

    it('should allow selecting a non-zakatable asset', () => {
      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange} 
        />
      );

      // Find the checkbox for Primary Residence
      const residenceCheckbox = screen.getAllByRole('checkbox')[2];
      
      // Select it
      fireEvent.click(residenceCheckbox);

      // Verify onSelectionChange was called with all assets including residence
      expect(onSelectionChange).toHaveBeenCalledWith([
        'asset-1',
        'asset-2',
        'asset-3',
        'asset-4',
      ]);
    });

    it('should respect initialSelection prop', () => {
      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange}
          initialSelection={['asset-2', 'asset-4']} // Only Bitcoin and Gold
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      
      expect(checkboxes[0]).not.toBeChecked(); // Savings Account
      expect(checkboxes[1]).toBeChecked(); // Bitcoin
      expect(checkboxes[2]).not.toBeChecked(); // Primary Residence
      expect(checkboxes[3]).toBeChecked(); // Gold Jewelry
    });
  });

  describe('Total Calculations', () => {
    it('should display correct totals for selected assets', () => {
      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange} 
        />
      );

      // With default selection (asset-1, asset-2, asset-4):
      // Total Wealth = 5000 + 3000 + 2500 = 10,500
      // Zakatable Wealth = 10,500 (all selected are zakatable)
      // Zakat Amount = 10,500 * 0.025 = 262.50

      expect(screen.getByText(/Total Wealth.*10,500/i)).toBeInTheDocument();
      expect(screen.getByText(/Zakatable Wealth.*10,500/i)).toBeInTheDocument();
      expect(screen.getByText(/Zakat Amount.*262\.50/i)).toBeInTheDocument();
    });

    it('should update totals in real-time when selection changes', () => {
      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange} 
        />
      );

      // Deselect Bitcoin (3000)
      const bitcoinCheckbox = screen.getAllByRole('checkbox')[1];
      fireEvent.click(bitcoinCheckbox);

      // New totals: 5000 + 2500 = 7,500
      // Zakat: 7,500 * 0.025 = 187.50
      expect(screen.getByText(/Total Wealth.*7,500/i)).toBeInTheDocument();
      expect(screen.getByText(/Zakatable Wealth.*7,500/i)).toBeInTheDocument();
      expect(screen.getByText(/Zakat Amount.*187\.50/i)).toBeInTheDocument();
    });

    it('should handle mixed zakatable/non-zakatable selection', () => {
      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange} 
        />
      );

      // Select Primary Residence (non-zakatable, 250,000)
      const residenceCheckbox = screen.getAllByRole('checkbox')[2];
      fireEvent.click(residenceCheckbox);

      // Total Wealth = 5000 + 3000 + 250000 + 2500 = 260,500
      // Zakatable Wealth = 5000 + 3000 + 2500 = 10,500 (residence excluded)
      // Zakat = 10,500 * 0.025 = 262.50
      expect(screen.getByText(/Total Wealth.*260,500/i)).toBeInTheDocument();
      expect(screen.getByText(/Zakatable Wealth.*10,500/i)).toBeInTheDocument();
      expect(screen.getByText(/Zakat Amount.*262\.50/i)).toBeInTheDocument();
    });

    it('should account for per-asset calculationModifier when computing zakatable totals', () => {
      const onSelectionChange = jest.fn();
      const assetsWithModifier = [
        ...mockAssets,
        { id: 'asset-5', name: 'Passive Fund', category: 'stocks', value: 6000, isZakatable: true, addedAt: '2025-04-01T00:00:00Z', calculationModifier: 0.3, zakatableValue: 1800 },
      ];

      render(
        <AssetSelectionTable 
          assets={assetsWithModifier as any} 
          onSelectionChange={onSelectionChange} 
        />
      );

      // Default selection includes zakatable assets: asset-1, asset-2, asset-4, asset-5
      // Total Wealth = 5000 + 3000 + 2500 + 6000 = 16500
      // Zakatable Wealth = 5000 + 3000 + 2500 + 1800 = 12300
      // Zakat = 12300 * 0.025 = 307.50
      expect(screen.getByText(/Total Wealth.*16,500/i)).toBeInTheDocument();
      expect(screen.getByText(/Zakatable Wealth.*12,300/i)).toBeInTheDocument();
      expect(screen.getByText(/Zakat Amount.*307\.50/i)).toBeInTheDocument();
    });

    it('should handle zero selection (all deselected)', () => {
      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange}
          initialSelection={[]} // Start with nothing selected
        />
      );

      expect(screen.getByText(/Total Wealth.*0/i)).toBeInTheDocument();
      expect(screen.getByText(/Zakatable Wealth.*0/i)).toBeInTheDocument();
      expect(screen.getByText(/Zakat Amount.*0/i)).toBeInTheDocument();
    });
  });

  describe('Table Columns', () => {
    it('should display all required columns', () => {
      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange} 
        />
      );

      // Verify column headers
      expect(screen.getByText('Select')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
      expect(screen.getByText('Zakatable')).toBeInTheDocument();
      expect(screen.getByText('Added')).toBeInTheDocument();
    });

    it('should format currency values correctly', () => {
      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange} 
        />
      );

      // Verify currency formatting (e.g., $5,000.00)
      expect(screen.getByText(/\$5,000/)).toBeInTheDocument();
      expect(screen.getByText(/\$3,000/)).toBeInTheDocument();
      expect(screen.getByText(/\$250,000/)).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange} 
        />
      );

      // Verify date formatting (e.g., Jan 15, 2025)
      expect(screen.getByText(/Jan.*15.*2025/)).toBeInTheDocument();
      expect(screen.getByText(/Feb.*1.*2025/)).toBeInTheDocument();
    });

    it('should display zakatable status with visual indicators', () => {
      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange} 
        />
      );

      // Should show "Yes" for zakatable assets
      const yesIndicators = screen.getAllByText('Yes');
      expect(yesIndicators.length).toBe(3); // Savings, Bitcoin, Gold

      // Should show "No" for non-zakatable
      expect(screen.getByText('No')).toBeInTheDocument();
    });
  });

  describe('Accessibility (WCAG 2.1 AA)', () => {
    it('should support keyboard navigation', () => {
      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange} 
        />
      );

      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      
      // Focus the checkbox
      firstCheckbox.focus();
      expect(firstCheckbox).toHaveFocus();

      // Toggle with Space key
      fireEvent.keyDown(firstCheckbox, { key: ' ', code: 'Space' });
      expect(onSelectionChange).toHaveBeenCalled();
    });

    it('should have proper ARIA labels for checkboxes', () => {
      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange} 
        />
      );

      // Verify ARIA labels include asset names
      const savingsCheckbox = screen.getByLabelText(/Savings Account/i);
      expect(savingsCheckbox).toBeInTheDocument();
      
      const bitcoinCheckbox = screen.getByLabelText(/Bitcoin/i);
      expect(bitcoinCheckbox).toBeInTheDocument();
    });

    it('should have role="table" and proper table structure', () => {
      const onSelectionChange = jest.fn();
      
      const { container } = render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange} 
        />
      );

      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
      
      // Verify table structure
      const thead = table?.querySelector('thead');
      const tbody = table?.querySelector('tbody');
      const tfoot = table?.querySelector('tfoot'); // For totals
      
      expect(thead).toBeInTheDocument();
      expect(tbody).toBeInTheDocument();
      expect(tfoot).toBeInTheDocument();
    });

    it('should have screen reader announcements for totals', () => {
      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange} 
        />
      );

      // Verify aria-live region for total updates
      const totalsRegion = screen.getByRole('status', { name: /totals/i });
      expect(totalsRegion).toBeInTheDocument();
    });

    it('should have sufficient color contrast for zakatable indicators', () => {
      const onSelectionChange = jest.fn();
      
      const { container } = render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange} 
        />
      );

      // Verify zakatable indicators have color classes (checked in integration)
      const zakatableYes = container.querySelectorAll('.text-green-600');
      const zakatableNo = container.querySelectorAll('.text-gray-600');
      
      expect(zakatableYes.length).toBeGreaterThan(0);
      expect(zakatableNo.length).toBeGreaterThan(0);
    });

    it('should provide clear focus indicators', () => {
      const onSelectionChange = jest.fn();
      
      const { container } = render(
        <AssetSelectionTable 
          assets={mockAssets} 
          onSelectionChange={onSelectionChange} 
        />
      );

      const firstCheckbox = screen.getAllByRole('checkbox')[0];
      firstCheckbox.focus();

      // Verify focus ring is visible (Tailwind focus classes)
      expect(firstCheckbox).toHaveClass('focus:ring-2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty asset list', () => {
      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={[]} 
          onSelectionChange={onSelectionChange} 
        />
      );

      expect(screen.getByText(/No assets available/i)).toBeInTheDocument();
    });

    it('should handle assets with zero value', () => {
      const zeroValueAsset = {
        id: 'asset-5',
        name: 'Empty Account',
        category: 'cash',
        value: 0,
        isZakatable: true,
        addedAt: '2025-04-01T10:00:00Z',
      };

      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={[zeroValueAsset]} 
          onSelectionChange={onSelectionChange} 
        />
      );

      expect(screen.getByText('Empty Account')).toBeInTheDocument();
      expect(screen.getByText(/\$0/)).toBeInTheDocument();
    });

    it('should handle very large asset values', () => {
      const largeAsset = {
        id: 'asset-6',
        name: 'Investment Portfolio',
        category: 'investment',
        value: 9999999.99,
        isZakatable: true,
        addedAt: '2025-01-01T00:00:00Z',
      };

      const onSelectionChange = jest.fn();
      
      render(
        <AssetSelectionTable 
          assets={[largeAsset]} 
          onSelectionChange={onSelectionChange} 
        />
      );

      // Verify large number formatting with commas
      expect(screen.getByText(/\$9,999,999\.99/)).toBeInTheDocument();
    });
  });
});
