import React from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../context/OnboardingContext';
import { getCurrencySymbol } from '../../../utils/formatters';

export const CashStep: React.FC = () => {
  const { t } = useTranslation('onboarding');
    const { data, updateAsset, nextStep, prevStep } = useOnboarding();
    const currencySymbol = getCurrencySymbol((data.settings?.currency || 'USD') as any);

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
                <h3 className="text-xl font-semibold text-foreground mb-2">{t('steps.cash.title')}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Enter your cash holdings. You don't have to add everything now—feel free to enter your main account and add others later via the Assets page.
                </p>

                <div className="space-y-4">
                    {/* Bank Accounts */}
                    <div className="rounded-xl border border-border p-4 hover:border-secondary/50 transition-colors focus-within:ring-1 focus-within:ring-ring">
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                            Bank Accounts (Checking/Savings)
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
                                <span className="text-muted-foreground sm:text-sm">{currencySymbol}</span>
                            </div>
                            <input
                                type="number"
                                className="block w-full rounded-lg border-border-strong ps-7 pe-12 focus:border-ring focus:ring-ring py-3"
                                placeholder="0.00"
                                value={data.assets.bank_accounts.value || ''}
                                onChange={(e) => handleValueChange('bank_accounts', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Cash on Hand */}
                    <div className="rounded-xl border border-border p-4 hover:border-secondary/50 transition-colors focus-within:ring-1 focus-within:ring-ring">
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                            Cash on Hand
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3">
                                <span className="text-muted-foreground sm:text-sm">{currencySymbol}</span>
                            </div>
                            <input
                                type="number"
                                className="block w-full rounded-lg border-border-strong ps-7 pe-12 focus:border-ring focus:ring-ring py-3"
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
                    className="px-6 py-3 text-muted-foreground font-medium hover:text-foreground transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={nextStep}
                    className="px-8 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold shadow-elev-2 hover:bg-secondary/90 transition-all"
                >
                    Next: Investments
                </button>
            </div>
        </div>
    );
};
