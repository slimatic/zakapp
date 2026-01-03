import React from 'react';
import { useOnboarding } from '../context/OnboardingContext';

export const CashStep: React.FC = () => {
    const { data, updateAsset, nextStep, prevStep } = useOnboarding();

    const handleValueChange = (asset: 'cash_on_hand' | 'bank_accounts', valueStr: string) => {
        const value = parseFloat(valueStr) || 0;
        updateAsset(asset, {
            value,
            enabled: value > 0
        });
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Cash Assets</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Enter your cash holdings. You don't have to add everything now—feel free to enter your main account and add others later via the Assets page.
                </p>

                <div className="space-y-4">
                    {/* Bank Accounts */}
                    <div className="rounded-xl border border-gray-200 p-4 hover:border-emerald-400 transition-colors focus-within:ring-1 focus-within:ring-emerald-500">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bank Accounts (Checking/Savings)
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number"
                                className="block w-full rounded-lg border-gray-300 pl-7 pr-12 focus:border-emerald-500 focus:ring-emerald-500 py-3"
                                placeholder="0.00"
                                value={data.assets.bank_accounts.value || ''}
                                onChange={(e) => handleValueChange('bank_accounts', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Cash on Hand */}
                    <div className="rounded-xl border border-gray-200 p-4 hover:border-emerald-400 transition-colors focus-within:ring-1 focus-within:ring-emerald-500">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cash on Hand
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number"
                                className="block w-full rounded-lg border-gray-300 pl-7 pr-12 focus:border-emerald-500 focus:ring-emerald-500 py-3"
                                placeholder="0.00"
                                value={data.assets.cash_on_hand.value || ''}
                                onChange={(e) => handleValueChange('cash_on_hand', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-8">
                <button
                    onClick={prevStep}
                    className="px-6 py-3 text-slate-600 font-medium hover:text-slate-800 transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={nextStep}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                    Next: Investments
                </button>
            </div>
        </div>
    );
};
