import React from 'react';
import { useOnboarding } from '../context/OnboardingContext';

export const NisabStep: React.FC = () => {
    const { data, updateData, nextStep, prevStep } = useOnboarding();

    const handleNisabChange = (standard: 'gold' | 'silver') => {
        updateData('nisab', { standard });
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">The Nisab Threshold</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Zakat is only due if your net wealth exceeds this threshold.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div
                    onClick={() => handleNisabChange('silver')}
                    className={`
                      relative rounded-lg border p-4 cursor-pointer hover:border-emerald-500 transition-colors
                      ${data.nisab.standard === 'silver' ? 'border-emerald-600 ring-1 ring-emerald-600 bg-emerald-50' : 'border-gray-300'}
                  `}
                >
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-900">Silver Standard (Recommended)</span>
                        {data.nisab.standard === 'silver' && <span className="text-emerald-600">✓</span>}
                    </div>
                    <p className="text-sm text-gray-500">
                        Based on 595g of Silver. This is the lower threshold, meaning it's safer and ensures more people contribute to those in need.
                    </p>
                </div>

                <div
                    onClick={() => handleNisabChange('gold')}
                    className={`
                      relative rounded-lg border p-4 cursor-pointer hover:border-emerald-500 transition-colors
                      ${data.nisab.standard === 'gold' ? 'border-emerald-600 ring-1 ring-emerald-600 bg-emerald-50' : 'border-gray-300'}
                  `}
                >
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-900">Gold Standard</span>
                        {data.nisab.standard === 'gold' && <span className="text-emerald-600">✓</span>}
                    </div>
                    <p className="text-sm text-gray-500">
                        Based on 85g of Gold. This is a higher threshold, typically used if you primarily hold wealth in Gold.
                    </p>
                </div>
            </div>


            <div className="flex justify-between pt-6">
                <button
                    onClick={prevStep}
                    className="px-6 py-2 text-slate-600 font-medium hover:text-slate-800 transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={nextStep}
                    className="px-8 py-2 bg-emerald-600 text-white rounded-lg font-medium shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition-all"
                >
                    Next
                </button>
            </div>
        </div >
    );
};
