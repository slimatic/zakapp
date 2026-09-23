import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';
import { getCurrencySymbol } from '../../../utils/formatters';

export const LiabilitiesStep: React.FC = () => {
  const { t } = useTranslation('onboarding');
    const { data, updateData, nextStep, prevStep } = useOnboarding();
    const currencySymbol = getCurrencySymbol((data.settings?.currency || 'USD') as 'USD' | 'EUR' | 'GBP' | 'SAR' | 'AED' | 'PKR' | 'INR' | 'MYR' | 'IDR' | 'TRY' | 'EGP');

    // Ensure liabilities section exists in data (will be added to context later)
    // For now we assume the parent component or context initializes it, or we handle it safely here.

    const handleValueChange = (type: 'immediate' | 'expenses', valueStr: string) => {
        const value = parseFloat(valueStr) || 0;
        updateData('liabilities', {
            ...data.liabilities,
            [type]: value
        });
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{t('steps.liabilities.title')}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Deductible debts can lower your Zakat. <Link to="/learn" target="_blank" rel="noopener" className="text-secondary underline">{t('steps.liabilities.learnMore')}</Link>.
                </p>

                <div className="space-y-6">
                    {/* Immediate Debts */}
                    <div className="bg-danger-soft rounded-xl p-5 border border-danger/30">
                        <label className="text-danger font-medium flex items-center gap-2 mb-2">
                            <span className="p-1.5 bg-danger-soft rounded text-danger">📉</span>
                            Immediate / Short-term Debts
                        </label>
                        <p className="text-xs text-danger mb-4">
                            Debts due now or within the next month (e.g., credit card bills, utility bills due).
                        </p>
                        <input
                            type="number"
                            className="block w-full rounded-lg border-danger/40 focus:border-danger focus:ring-danger py-3"
                            placeholder={`Amount (${currencySymbol})`}
                            value={data.liabilities?.immediate || ''}
                            onChange={(e) => handleValueChange('immediate', e.target.value)}
                        />
                    </div>

                    {/* Living Expenses */}
                    <div className="bg-warn-soft rounded-xl p-5 border border-warn/30">
                        <label className="text-warn-strong font-medium flex items-center gap-2 mb-2">
                            <span className="p-1.5 bg-warn-soft rounded text-warn-strong">🏠</span>
                            Next Month's Living Expenses
                        </label>
                        <p className="text-xs text-warn-strong mb-4">
                            Some scholars allow deducting one month of living expenses (rent, food, etc.).
                        </p>
                        <input
                            type="number"
                            className="block w-full rounded-lg border-border-strong focus:border-warn focus:ring-warn py-3"
                            placeholder={`Amount (${currencySymbol})`}
                            value={data.liabilities?.expenses || ''}
                            onChange={(e) => handleValueChange('expenses', e.target.value)}
                        />
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
                    className="px-8 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold shadow-elev-2 hover:bg-secondary/90 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                    Next: Review
                </button>
            </div>
        </div>
    );
};
