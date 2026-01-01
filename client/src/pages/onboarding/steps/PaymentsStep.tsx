import React from 'react';
import { motion } from 'framer-motion';
import { useOnboarding } from '../context/OnboardingContext';

export const PaymentsStep: React.FC = () => {
    const { data, updateData, nextStep, prevStep } = useOnboarding();

    const handleToggle = (madePayments: boolean) => {
        updateData('payments', { madePayments });
    };

    const updateAmount = (value: string) => {
        const numValue = parseFloat(value);
        updateData('payments', {
            amount: isNaN(numValue) ? undefined : numValue
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
                <h2 className="text-2xl font-bold text-emerald-900">Recent Zakat Payments?</h2>
                <p className="text-emerald-600">
                    Have you already paid any Zakat for this current lunar year?
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button
                    className={`p-6 rounded-xl border-2 transition-all ${data.payments.madePayments === false
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 hover:border-emerald-200 text-slate-600'
                        }`}
                    data-testid="payments-no"
                    onClick={() => handleToggle(false)}
                >
                    <span className="text-2xl block mb-2">❌</span>
                    <span className="font-semibold">No, not yet</span>
                </button>
                <button
                    className={`p-6 rounded-xl border-2 transition-all ${data.payments.madePayments === true
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 hover:border-emerald-200 text-slate-600'
                        }`}
                    data-testid="payments-yes"
                    onClick={() => handleToggle(true)}
                >
                    <span className="text-2xl block mb-2">✅</span>
                    <span className="font-semibold">Yes, I have</span>
                </button>
            </div>

            <motion.div
                animate={{
                    height: data.payments.madePayments ? 'auto' : 0,
                    opacity: data.payments.madePayments ? 1 : 0
                }}
                className="overflow-hidden"
            >
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
                    <label className="block text-sm font-medium text-slate-700">How much have you paid so far?</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                        <input
                            type="number"
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                            value={data.payments.amount || ''}
                            onChange={(e) => updateAmount(e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-slate-500">
                        We'll verify this against your liability to calculate your remaining balance.
                    </p>
                </div>
            </motion.div>

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
