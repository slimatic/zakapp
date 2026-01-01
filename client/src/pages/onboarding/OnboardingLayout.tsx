import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnboarding } from './context/OnboardingContext';
import { WelcomeStep, MethodologyStep, NisabStep, AssetsStep, LiabilitiesStep, PaymentsStep, SummaryStep } from './steps';

const steps = [
    { component: WelcomeStep, title: 'Welcome' },
    { component: MethodologyStep, title: 'Methodology' },
    { component: NisabStep, title: 'Nisab Threshold' },
    { component: AssetsStep, title: 'Checklist' },
    { component: LiabilitiesStep, title: 'Debts & Liabilities' },
    { component: PaymentsStep, title: 'Recent Payments' },
    { component: SummaryStep, title: 'Summary' },
];

export const OnboardingLayout: React.FC = () => {
    const { currentStep, totalSteps } = useOnboarding();
    const CurrentStepComponent = steps[currentStep]?.component || WelcomeStep;

    // Calculate progress percentage
    const progress = ((currentStep + 1) / totalSteps) * 100;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
                    <div
                        className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500 ease-in-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                {/* Wizard Card */}
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 relative overflow-hidden">
                    {/* Privacy Indicator (Trust Engineering) */}
                    <div className="absolute top-4 right-4 flex items-center text-xs text-gray-400">
                        <span className="mr-1">🔒</span>
                        Encrypted on Device
                    </div>

                    <div className="mb-6">
                        <h2 className="text-center text-2xl font-bold text-gray-900">
                            {steps[currentStep].title}
                        </h2>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="min-h-[300px]"
                        >
                            <CurrentStepComponent />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
