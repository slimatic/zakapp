import React, { useEffect } from 'react';
import { useOnboarding, AssetData } from '../context/OnboardingContext';
import { useNisabThreshold } from '../../../hooks/useNisabThreshold';
import { useMaskedCurrency } from '../../../contexts/PrivacyContext';

export const MetalsStep: React.FC = () => {
    const { data, updateAsset, nextStep, prevStep } = useOnboarding();
    const { goldPrice, silverPrice, isLoading } = useNisabThreshold('USD', 'GOLD'); // Fetch both
    const maskedCurrency = useMaskedCurrency();

    // Auto-calculate values when grams change
    useEffect(() => {
        if (data.assets.gold.grams && goldPrice) {
            updateAsset('gold', { value: data.assets.gold.grams * goldPrice });
        }
    }, [data.assets.gold.grams, goldPrice]);

    useEffect(() => {
        if (data.assets.silver.grams && silverPrice) {
            updateAsset('silver', { value: data.assets.silver.grams * silverPrice });
        }
    }, [data.assets.silver.grams, silverPrice]);


    const handleGramsChange = (asset: 'gold' | 'silver', gramsStr: string) => {
        const grams = parseFloat(gramsStr) || 0;
        const price = asset === 'gold' ? goldPrice : silverPrice;

        updateAsset(asset, {
            grams,
            enabled: grams > 0,
            value: grams * (price || 0)
        });
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Precious Metals</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Gold & Silver. Enter the weight you own. You don't need to be exact right now—you can always update this later in your Assets Dashboard.
                </p>

                <div className="space-y-6">
                    {/* Gold Input */}
                    <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-amber-900 font-medium flex items-center gap-2">
                                <span className="bg-amber-200 p-1.5 rounded-lg text-amber-700">🏆</span>
                                Gold (24k)
                            </label>
                            <span className="text-xs font-mono bg-amber-100 text-amber-800 px-2 py-1 rounded">
                                Live: {isLoading ? '...' : formatCurrency(goldPrice || 0)}/g
                            </span>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs text-amber-700 mb-1">Weight (Grams)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0 g"
                                    className="w-full rounded-lg border-amber-300 focus:ring-amber-500 focus:border-amber-500"
                                    value={data.assets.gold.grams || ''}
                                    onChange={(e) => handleGramsChange('gold', e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-amber-700 mb-1">Value</label>
                                <div className="w-full h-10 px-3 py-2 bg-amber-100/50 rounded-lg border border-amber-200 text-amber-900 font-medium flex items-center">
                                    {maskedCurrency(formatCurrency(data.assets.gold.value || 0))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Silver Input */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-slate-900 font-medium flex items-center gap-2">
                                <span className="bg-slate-200 p-1.5 rounded-lg text-slate-700">🥈</span>
                                Silver
                            </label>
                            <span className="text-xs font-mono bg-slate-200 text-slate-700 px-2 py-1 rounded">
                                Live: {isLoading ? '...' : formatCurrency(silverPrice || 0)}/g
                            </span>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs text-slate-600 mb-1">Weight (Grams)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0 g"
                                    className="w-full rounded-lg border-slate-300 focus:ring-slate-500 focus:border-slate-500"
                                    value={data.assets.silver.grams || ''}
                                    onChange={(e) => handleGramsChange('silver', e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-slate-600 mb-1">Value</label>
                                <div className="w-full h-10 px-3 py-2 bg-slate-100 rounded-lg border border-slate-200 text-slate-900 font-medium flex items-center">
                                    {maskedCurrency(formatCurrency(data.assets.silver.value || 0))}
                                </div>
                            </div>
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
                    Next: Cash
                </button>
            </div>
        </div>
    );
};
