import React from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '../context/OnboardingContext';

export const LiabilitiesStep: React.FC = () => {
    const { data, updateData, nextStep, prevStep } = useOnboarding();

    const liabilitiesList = [
        { id: 'personal_loans', label: 'Personal Loans', icon: '🤝', description: 'Money you owe to friends or family.' },
        { id: 'credit_cards', label: 'Credit Card Debt', icon: '💳', description: 'Outstanding balances on credit cards.' },
        { id: 'student_loans', label: 'Student Loans', icon: '🎓', description: 'Current due installments for education.' },
        { id: 'business_debt', label: 'Business Debts', icon: 'shop', description: 'Short-term liabilities for your business.' },
    ];

    const toggleLiability = (id: string) => {
        const current = data.liabilities[id] || { category: id, enabled: false };
        updateData('liabilities', {
            [id]: { ...current, enabled: !current.enabled }
        });
    };

    const updateLiabilityValue = (id: string, value: string) => {
        const numValue = parseFloat(value);
        const current = data.liabilities[id];
        updateData('liabilities', {
            [id]: { ...current, value: isNaN(numValue) ? undefined : numValue }
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-emerald-900">Short-Term Liabilities?</h2>
                <p className="text-emerald-600">
                    Deductible debts can lower your Zakat liability. Focus on debts due <b>within the current lunar year</b>.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {liabilitiesList.map((item) => {
                    const isSelected = data.liabilities[item.id]?.enabled;

                    return (
                        <div
                            key={item.id}
                            data-testid={`liability-${item.id}`}
                            className={`
                                relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                                ${isSelected
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-slate-200 hover:border-emerald-200 bg-white'
                                }
                            `}
                            onClick={() => toggleLiability(item.id)}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl">{item.icon}</span>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900">{item.label}</h3>
                                    <p className="text-sm text-slate-500">{item.description}</p>
                                </div>
                                <div className={`
                                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                    ${isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}
                                `}>
                                    {isSelected && (
                                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                            </div>

                            {/* Value Input (Conditional) */}
                            {isSelected && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-4 pl-10 pr-2"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            aria-label="Estimated Value"
                                            className="w-full pl-8 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                            value={data.liabilities[item.id]?.value || ''}
                                            onChange={(e) => updateLiabilityValue(item.id, e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Amount due within lunar year</p>
                                </motion.div>
                            )}
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
        </motion.div>
    );
};
