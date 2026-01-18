import React from 'react';
import { Link } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';

export const LiabilitiesStep: React.FC = () => {
    const { data, updateData, nextStep, prevStep } = useOnboarding();

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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Liabilities & Expenses</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Deductible debts can lower your Zakat. <Link to="/learn" target="_blank" rel="noopener" className="text-emerald-600 underline">Learn more about liabilities</Link>.
                </p>

                <div className="space-y-6">
                    {/* Immediate Debts */}
                    <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                        <label className="text-red-900 font-medium flex items-center gap-2 mb-2">
                            <span className="p-1.5 bg-red-200 rounded text-red-800">📉</span>
                            Immediate / Short-term Debts
                        </label>
                        <p className="text-xs text-red-700 mb-4">
                            Debts due now or within the next month (e.g., credit card bills, utility bills due).
                        </p>
                        <input
                            type="number"
                            className="block w-full rounded-lg border-red-300 focus:border-red-500 focus:ring-red-500 py-3"
                            placeholder="Amount ($)"
                            value={data.liabilities?.immediate || ''}
                            onChange={(e) => handleValueChange('immediate', e.target.value)}
                        />
                    </div>

                    {/* Living Expenses */}
                    <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
                        <label className="text-orange-900 font-medium flex items-center gap-2 mb-2">
                            <span className="p-1.5 bg-orange-200 rounded text-orange-800">🏠</span>
                            Next Month's Living Expenses
                        </label>
                        <p className="text-xs text-orange-700 mb-4">
                            Some scholars allow deducting one month of living expenses (rent, food, etc.).
                        </p>
                        <input
                            type="number"
                            className="block w-full rounded-lg border-orange-300 focus:border-orange-500 focus:ring-orange-500 py-3"
                            placeholder="Amount ($)"
                            value={data.liabilities?.expenses || ''}
                            onChange={(e) => handleValueChange('expenses', e.target.value)}
                        />
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
                    Next: Review
                </button>
            </div>
        </div>
    );
};
