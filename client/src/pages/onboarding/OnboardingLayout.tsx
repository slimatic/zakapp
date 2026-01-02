import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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

    const navigate = useNavigate();
    const { user, updateLocalProfile } = useAuth();

    const handleSkip = async () => {
        if (window.confirm("Skip the setup wizard? You can always access these tools from the Dashboard.")) {
            if (user?.id) {
                // Mark as skipped in local prefs (legacy)
                localStorage.setItem(`zakapp_local_prefs_${user.id}`, JSON.stringify({
                    skipped: true,
                    completedAt: new Date().toISOString()
                }));

                // Update User Context to prevent Redirect Loop
                await updateLocalProfile({ isSetupCompleted: true });
            }
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
            {/* Skip Option - Subtle, top right */}
            <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
                <button
                    onClick={handleSkip}
                    className="text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium flex items-center gap-1"
                >
                    <span>Skip Setup</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

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
