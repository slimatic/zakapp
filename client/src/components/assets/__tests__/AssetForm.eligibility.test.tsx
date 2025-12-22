import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AssetForm } from '../AssetForm';

// Mock api hooks to capture mutate calls
const mockUpdateMutate = jest.fn();
const mockCreateMutate = jest.fn();

jest.mock('../../../services/apiHooks', () => ({
  useCreateAsset: () => ({ mutate: mockCreateMutate, isPending: false }),
  useUpdateAsset: () => ({ mutate: mockUpdateMutate, isPending: false }),
}));

describe('AssetForm eligibility and passive behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Passive checkbox is disabled when zakatEligible is unchecked and cleared', () => {
    render(<AssetForm asset={{ assetId: 'a1', name: 'Test', category: 'stocks' as any, value: 100, currency: 'USD', acquisitionDate: new Date().toISOString(), description: '', zakatEligible: true, isPassiveInvestment: true, isRestrictedAccount: false, calculationModifier: 0.3 }} /> as any);

    // Passive checkbox should be checked initially
    const passiveCheckbox = screen.getByLabelText(/Passive Investment/i) as HTMLInputElement;
    expect(passiveCheckbox).toBeInTheDocument();
    expect(passiveCheckbox).toBeEnabled();
    expect(passiveCheckbox.checked).toBe(true);

    // Uncheck eligibility
    const eligibleCheckbox = screen.getByLabelText(/This asset is eligible for Zakat calculation/i) as HTMLInputElement;
    expect(eligibleCheckbox.checked).toBe(true);
    fireEvent.click(eligibleCheckbox);

    // Passive should now be disabled and unchecked
    expect(passiveCheckbox).toBeDisabled();
    expect(passiveCheckbox.checked).toBe(false);
  });

  test('Update submission includes zakatEligible and cleared passive when eligibility removed', () => {
    render(<AssetForm asset={{ assetId: 'a2', name: 'Stocks Inc', category: 'stocks' as any, value: 5000, currency: 'USD', acquisitionDate: new Date().toISOString(), description: '', zakatEligible: true, isPassiveInvestment: true, isRestrictedAccount: false, calculationModifier: 0.3 }} onSuccess={() => {}} /> as any);

    const eligibleCheckbox = screen.getByLabelText(/This asset is eligible for Zakat calculation/i) as HTMLInputElement;
    fireEvent.click(eligibleCheckbox); // uncheck

    const submitButton = screen.getByRole('button', { name: /Update Asset/i });
    fireEvent.click(submitButton);

    expect(mockUpdateMutate).toHaveBeenCalledTimes(1);
    const callArg = mockUpdateMutate.mock.calls[0][0];
    // Expect shape { assetId, assetData }
    expect(callArg.assetId).toBe('a2');
    expect(callArg.assetData.zakatEligible).toBe(false);
    expect(callArg.assetData.isPassiveInvestment).toBe(false);
  });
});
