import React from 'react';
import { useOnboarding } from '../context/OnboardingContext';

export const MethodologyStep: React.FC = () => {
    const { data, updateData, nextStep, prevStep } = useOnboarding();

    const handleMadhabChange = (madhab: 'hanafi' | 'shafi' | 'standard') => {
        updateData('methodology', { madhab });
    };

    const handleCalendarChange = (calendar: 'lunar' | 'solar') => {
        updateData('methodology', { calendar });
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">School of Thought (Madhab)</h3>
                <p className="text-sm text-gray-500 mb-4">
                    This affects how Zakat is calculated on jewelry and certain long-term assets.
                </p>
                <div className="grid grid-cols-1 gap-3">
                    {[
                        { id: 'standard', title: 'Standard (Recommended)', desc: 'International Council of Fiqh Academy consensus.' },
                        { id: 'hanafi', title: 'Hanafi', desc: 'Gold/Silver jewelry is always Zakatable.' },
                        { id: 'shafi', title: 'Shafi\'i / Maliki / Hanbali', desc: 'Personal use jewelry is generally exempt.' }
                    ].map((option) => (
                        <div
                            key={option.id}
                            onClick={() => handleMadhabChange(option.id as any)}
                            className={`
                            relative rounded-lg border p-4 cursor-pointer flex flex-col hover:border-emerald-500 transition-colors
                            ${data.methodology.madhab === option.id ? 'border-emerald-600 ring-1 ring-emerald-600 bg-emerald-50' : 'border-gray-300'}
                        `}
                        >
                            <div className="flex items-center justify-between">
                                <span className="block text-sm font-medium text-gray-900">{option.title}</span>
                                {data.methodology.madhab === option.id && (
                                    <span className="text-emerald-600">✓</span>
                                )}
                            </div>
                            <span className="mt-1 flex items-center text-sm text-gray-500">{option.desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Calendar System</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Used to determine your Hawl key dates (Zakat due date).
                </p>
                <div className="grid grid-cols-2 gap-4">
                    {[
                        { id: 'lunar', title: 'Hijri (Lunar)', desc: '354 Days (Traditional)' },
                        { id: 'solar', title: 'Gregorian (Solar)', desc: '365 Days' }
                    ].map((option) => (
                        <div
                            key={option.id}
                            onClick={() => handleCalendarChange(option.id as any)}
                            className={`
                            relative rounded-lg border p-4 cursor-pointer hover:border-emerald-500 transition-colors
                            ${data.methodology.calendar === option.id ? 'border-emerald-600 ring-1 ring-emerald-600 bg-emerald-50' : 'border-gray-300'}
                        `}
                        >
                            <div className="text-center">
                                <span className="block text-sm font-medium text-gray-900">{option.title}</span>
                                <span className="mt-1 block text-xs text-gray-500">{option.desc}</span>
                            </div>
                        </div>
                    ))}
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
