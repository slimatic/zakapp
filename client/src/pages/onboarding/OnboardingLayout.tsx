import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboarding } from './context/OnboardingContext';
import {
    IdentityStep,
    MetalsStep,
    CashStep,
    InvestmentsStep,
    LiabilitiesStep,
    ReviewStep,
    WelcomeStep,
    ZakatSetupStep
} from './steps';

const steps = [
    { component: WelcomeStep, title: '' }, // No title for welcome
    { component: IdentityStep, title: 'Identity & Methodology' },
    { component: MetalsStep, title: 'Precious Metals' },
    { component: CashStep, title: 'Cash Assets' },
    { component: InvestmentsStep, title: 'Investments' },
    { component: LiabilitiesStep, title: 'Liabilities' },
    { component: ReviewStep, title: 'Review & Save' },
    { component: ZakatSetupStep, title: 'Zakat Setup' },
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
                try {
                    await updateLocalProfile({ isSetupCompleted: true });
                } catch (error) {
                    console.error("OnboardingLayout: Failed to update profile, relying on local prefs fallback", error);
                }
            }
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative bg-[url('/patterns/grid.svg')]">
            {/* Learning Hub - Top Left */}
            <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-10">
                <Link
                    to="/learn"
                    target="_blank"
                    rel="noopener"
                    className="group flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 text-sm font-medium text-gray-600 hover:text-blue-600 hover:border-blue-200 hover:shadow-md transition-all"
                    title="Open ZakApp Learning Hub (opens in new tab)"
                >
                    <svg className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span>Learning Hub</span>
                </Link>
            </div>

            {/* Skip Option - Top Right */}
            <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-10">
                <button
                    onClick={handleSkip}
                    className="text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium flex items-center gap-1 px-3 py-1 rounded-md hover:bg-slate-100"
                >
                    <span>Skip Setup</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-xl">
                {/* Wizard Card */}
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200 border border-slate-100 sm:rounded-2xl sm:px-12 relative overflow-hidden">

                    {/* Header Section with Progress */}
                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                                Step {currentStep + 1} of {totalSteps}
                            </span>
                            {/* Privacy Indicator */}
                            <div className="flex items-center text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                                <span className="mr-1">🔒</span>
                                Encrypted on Device
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2 mb-6 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>

                        <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                            {steps[currentStep].title}
                        </h2>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            className="min-h-[300px]"
                        >
                            <CurrentStepComponent />
                        </motion.div>
                    </AnimatePresence>
                </div>

                <p className="text-center text-xs text-slate-400 mt-6">
                    ZakApp protects your privacy. Your financial data never leaves your device unencrypted.
                </p>
            </div>
        </div>
    );
};
