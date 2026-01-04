import React from 'react';
import { useOnboarding } from '../context/OnboardingContext';

export const InvestmentsStep: React.FC = () => {
    const { data, updateAsset, nextStep, prevStep } = useOnboarding();

    const handleValueChange = (asset: 'stocks' | 'retirement' | 'crypto', valueStr: string) => {
        const value = parseFloat(valueStr) || 0;
        updateAsset(asset, { value, enabled: value > 0 });
    };

    const toggleFlag = (asset: 'stocks', flag: 'isPassive') => {
        const current = data.assets[asset][flag];
        updateAsset(asset, { [flag]: !current });
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Investments</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Enter market value for investments. You can start with your primary account and add more later.
                </p>

                <div className="space-y-6">
                    {/* Retirement Accounts */}
                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-200 transition-all duration-300">
                        <div className="flex justify-between items-start mb-4">
                            <label className="text-blue-900 font-medium flex items-center gap-2">
                                <span className="p-1.5 bg-blue-200 rounded text-blue-800">☂️</span>
                                Retirement (401k, IRA)
                            </label>
                            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Usually Restricted</span>
                        </div>

                        <div className="mb-4">
                            <input
                                type="number"
                                className="block w-full rounded-lg border-blue-300 focus:border-blue-500 focus:ring-blue-500 py-3"
                                placeholder="Total Market Value ($)"
                                value={data.assets.retirement.value || ''}
                                onChange={(e) => handleValueChange('retirement', e.target.value)}
                            />
                        </div>

                        {/* Collapsible Treatment Section */}
                        {(data.assets.retirement.value || 0) > 0 && (
                            <div className="bg-white/50 p-4 rounded-lg border border-blue-100/50 space-y-3 animate-fadeIn">
                                <p className="text-sm font-medium text-blue-900">Zakat Treatment:</p>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="retirement-treatment"
                                        checked={data.assets.retirement.retirementTreatment === 'full'}
                                        onChange={() => updateAsset('retirement', { retirementTreatment: 'full' })}
                                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <div>
                                        <span className="block text-sm font-medium text-gray-900">Full Assessment (100%)</span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="retirement-treatment"
                                        checked={data.assets.retirement.retirementTreatment === 'net_value' || !data.assets.retirement.retirementTreatment}
                                        onChange={() => updateAsset('retirement', { retirementTreatment: 'net_value' })}
                                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <div>
                                        <span className="block text-sm font-medium text-gray-900">Deduct Taxes/Penalties (Net Value)</span>
                                        <span className="block text-xs text-gray-500">Calculates zakat on ~70% of the value (after estimated taxes/fees).</span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="retirement-treatment"
                                        checked={data.assets.retirement.retirementTreatment === 'passive'}
                                        onChange={() => updateAsset('retirement', { retirementTreatment: 'passive' })}
                                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <div>
                                        <span className="block text-sm font-medium text-gray-900">Passive Investment (30%)</span>
                                        <span className="block text-xs text-gray-500">Treats underlying assets as passive/business assets (Zakatable on 30%).</span>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="retirement-treatment"
                                        checked={data.assets.retirement.retirementTreatment === 'deferred'}
                                        onChange={() => updateAsset('retirement', { retirementTreatment: 'deferred' })}
                                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <div>
                                        <span className="block text-sm font-medium text-gray-900">Deferred (Exempt)</span>
                                        <span className="block text-xs text-gray-500">No Zakat due until withdrawal (based on lack of complete ownership/access).</span>
                                    </div>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Stocks / ETFs */}
                    <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-200">
                        <div className="flex justify-between items-start mb-4">
                            <label className="text-indigo-900 font-medium flex items-center gap-2">
                                <span className="p-1.5 bg-indigo-200 rounded text-indigo-800">📈</span>
                                Stocks, ETFs, Mutual Funds
                            </label>
                        </div>

                        <div className="mb-4">
                            <input
                                type="number"
                                className="block w-full rounded-lg border-indigo-300 focus:border-indigo-500 focus:ring-indigo-500 py-3"
                                placeholder="Total Market Value ($)"
                                value={data.assets.stocks.value || ''}
                                onChange={(e) => handleValueChange('stocks', e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-3 bg-white/50 p-3 rounded-lg border border-indigo-100/50">
                            <input
                                type="checkbox"
                                id="passive-check"
                                checked={data.assets.stocks.isPassive}
                                onChange={() => toggleFlag('stocks', 'isPassive')}
                                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label htmlFor="passive-check" className="text-sm text-indigo-900 cursor-pointer select-none">
                                <strong>Passive Investment?</strong> (Buy & Hold)
                                <span className="block text-xs text-indigo-700 font-normal mt-0.5">
                                    Only 30% of value is zakatable (Proxy for underlying assets)
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Crypto */}
                    <div className="bg-orange-50 rounded-xl p-5 border border-orange-200">
                        <label className="text-orange-900 font-medium flex items-center gap-2 mb-4">
                            <span className="p-1.5 bg-orange-100 rounded text-orange-600">₿</span>
                            Cryptocurrency
                        </label>
                        <input
                            type="number"
                            className="block w-full rounded-lg border-orange-300 focus:border-orange-500 focus:ring-orange-500 py-3"
                            placeholder="Total Market Value ($)"
                            value={data.assets.crypto.value || ''}
                            onChange={(e) => handleValueChange('crypto', e.target.value)}
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
