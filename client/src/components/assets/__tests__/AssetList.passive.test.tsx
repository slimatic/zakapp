import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { AssetList } from '../AssetList';

jest.mock('../../../services/apiHooks', () => ({
  useAssets: () => ({ data: { data: { assets: [
    { assetId: 'p1', name: 'Passive Fund', category: 'stocks', value: 6000, currency: 'USD', description: '', zakatEligible: true, isPassiveInvestment: true, createdAt: new Date().toISOString() },
    { assetId: 'p2', name: 'Inactive Passive', category: 'stocks', value: 2000, currency: 'USD', description: '', zakatEligible: false, isPassiveInvestment: true, createdAt: new Date().toISOString() }
  ] } }, isLoading: false, error: null })
}));

describe('AssetList Passive badge', () => {
  test('shows Passive badge only when asset is eligible and passive', () => {
    render(<AssetList />);

    // Passive Fund should show 'Passive' badge
    expect(screen.getByText('Passive')).toBeInTheDocument();

    // 'Inactive Passive' is not eligible so should not show the badge text next to it
    const inactive = screen.queryAllByText('Inactive Passive');
    expect(inactive.length).toBeGreaterThan(0);
    // Ensure only one Passive badge exists
    const passiveBadges = screen.getAllByText('Passive');
    expect(passiveBadges.length).toBe(1);
  });
});
