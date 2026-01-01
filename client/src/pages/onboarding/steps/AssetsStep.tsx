import React from 'react';
import { useOnboarding } from '../context/OnboardingContext';
import { motion, AnimatePresence } from 'framer-motion';

export const AssetsStep: React.FC = () => {
    const { data, updateData, nextStep, prevStep } = useOnboarding();

    const toggleAsset = (key: keyof typeof data.assets) => {
        const current = data.assets[key];
        updateData('assets', {
            [key]: { ...current, enabled: !current.enabled }
        });
    };

    const updateValue = (key: keyof typeof data.assets, value: string) => {
        const numValue = parseFloat(value) || 0;
        updateData('assets', {
            [key]: { ...data.assets[key], value: numValue }
        });
    };

    const assetTypes = [
        { key: 'cash', icon: '💵', label: 'Cash & Bank Accounts', desc: 'Savings, Checking, Cash on hand' },
        { key: 'gold', icon: '✨', label: 'Gold', desc: 'Jewelry, Bars, Coins' },
        { key: 'silver', icon: '🥈', label: 'Silver', desc: 'Silverware, Bars, Coins' },
        { key: 'stocks', icon: '📈', label: 'Stocks & Investments', desc: 'Shares, ETFs, Mutual Funds, 401k' },
        { key: 'crypto', icon: '₿', label: 'Cryptocurrencies', desc: 'Bitcoin, Ethereum, etc.' },
        { key: 'realEstateResale', icon: '🏗️', label: 'Property for Resale', desc: 'Land/Buildings bought to sell for profit (Trade Assets)' },
        { key: 'realEstateRental', icon: '🏠', label: 'Rental Property & Home', desc: 'Your home or rental properties (Value is exempt, rent is income)' },
    ];

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">What do you own?</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Select the assets you own. You can enter an estimated value now to jumpstart your dashboard.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {assetTypes.map((asset) => {
                    const assetKey = asset.key as keyof typeof data.assets;
                    const isEnabled = data.assets[assetKey].enabled;

                    return (
                        <div
                            key={asset.key}
                            className={`
                                rounded-lg border transition-all duration-200
                                ${isEnabled
                                    ? 'border-emerald-600 bg-emerald-50 shadow-sm'
                                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'}
                            `}
                        >
                            <div
                                onClick={() => toggleAsset(assetKey)}
                                className="flex items-center p-3 cursor-pointer"
                            >
                                <span className="text-2xl mr-4">{asset.icon}</span>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-gray-900">{asset.label}</span>
                                        <div className={`
                                            w-5 h-5 rounded border flex items-center justify-center transition-colors
                                            ${isEnabled
                                                ? 'bg-emerald-600 border-emerald-600'
                                                : 'border-gray-300 bg-white'}
                                        `}>
                                            {isEnabled && (
                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{asset.desc}</p>
                                </div>
                            </div>

                            <AnimatePresence>
                                {isEnabled && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-3 pt-0 pl-14 pr-4">
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Estimated Value (Optional)
                                            </label>
                                            <div className="relative rounded-md shadow-sm">
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                    <span className="text-gray-500 sm:text-sm">$</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    className="block w-full rounded-md border-gray-300 pl-7 pr-12 focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm py-2"
                                                    placeholder="0.00"
                                                    aria-label="Asset Value"
                                                    value={data.assets[assetKey].value || ''}
                                                    onChange={(e) => updateValue(assetKey, e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                    <span className="text-gray-500 sm:text-sm">USD</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
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
        </div>
    );
};
