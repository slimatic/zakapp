import React from 'react';
import { useOnboarding } from '../context/OnboardingContext';

export const IdentityStep: React.FC = () => {
    const { data, updateData, nextStep } = useOnboarding();

    const handleMadhabChange = (madhab: 'hanafi' | 'shafii' | 'standard') => {
        updateData('methodology', { madhab });
    };

    const handleNisabChange = (standard: 'gold' | 'silver') => {
        updateData('nisab', { standard });
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">School of Thought (Madhab)</h3>
                <p className="text-sm text-gray-500 mb-4">
                    This determines which assets are Zakatable, especially jewelry.
                </p>
                <div className="grid grid-cols-1 gap-3">
                    {[
                        { id: 'standard', title: 'Standard (Recommended)', desc: 'Follows international consensus (Fiqh Academy).' },
                        { id: 'hanafi', title: 'Hanafi', desc: 'Gold/Silver jewelry is always Zakatable.' },
                        { id: 'shafii', title: 'Shafi\'i / Maliki / Hanbali', desc: 'Personal use jewelry is generally exempt.' }
                    ].map((option) => (
                        <div
                            key={option.id}
                            onClick={() => handleMadhabChange(option.id as any)}
                            className={`
                            relative rounded-lg border p-4 cursor-pointer flex flex-col hover:border-emerald-500 transition-all
                            ${data.methodology.madhab === option.id ? 'border-emerald-600 ring-2 ring-emerald-600 bg-emerald-50' : 'border-gray-200'}
                        `}
                        >
                            <div className="flex items-center justify-between">
                                <span className="block font-medium text-gray-900">{option.title}</span>
                                {data.methodology.madhab === option.id && (
                                    <span className="text-emerald-600 text-lg">✓</span>
                                )}
                            </div>
                            <span className="mt-1 text-sm text-gray-500">{option.desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nisab Threshold</h3>
                <p className="text-sm text-gray-500 mb-4">
                    The minimum wealth required before Zakat is due.
                </p>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { id: 'silver', title: 'Silver Standard', desc: 'More cautious, benefits the poor (Lower Threshold).' },
                        { id: 'gold', title: 'Gold Standard', desc: 'Higher threshold, often used in modern economies.' }
                    ].map((option) => (
                        <div
                            key={option.id}
                            onClick={() => handleNisabChange(option.id as any)}
                            className={`
                            relative rounded-lg border p-4 cursor-pointer hover:border-emerald-500 transition-all text-center
                            ${data.nisab.standard === option.id ? 'border-emerald-600 ring-2 ring-emerald-600 bg-emerald-50' : 'border-gray-200'}
                        `}
                        >
                            <span className="block font-medium text-gray-900">{option.title}</span>
                            <span className="mt-1 block text-xs text-gray-500">{option.desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end pt-8">
                <button
                    onClick={nextStep}
                    className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                >
                    Continue
                </button>
            </div>
        </div>
    );
};
