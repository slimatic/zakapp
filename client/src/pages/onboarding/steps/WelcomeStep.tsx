import React from 'react';
import { useOnboarding } from '../context/OnboardingContext';
import { Logo } from '../../../components/common/Logo';

export const WelcomeStep: React.FC = () => {
    const { nextStep } = useOnboarding();

    return (
        <div className="flex flex-col items-center justify-center space-y-8 animate-fadeIn text-center pt-8">
            <div className="flex items-center justify-center mb-4">
                <Logo className="w-24 h-24 text-emerald-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900">
                Welcome to ZakApp
            </h1>

            <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 max-w-lg">
                <p className="text-emerald-800 font-serif text-lg italic mb-2">
                    "Take from their wealth a charity by which you purify them and cause them increase..."
                </p>
                <p className="text-emerald-600 text-xs font-medium uppercase tracking-wide">
                    Surah At-Tawbah (9:103)
                </p>
            </div>

            <p className="text-gray-600 max-w-md">
                Let's get your portfolio set up. We'll walk you through adding your assets to accurately track your Zakat obligations securely.
            </p>

            <button
                onClick={nextStep}
                className="mt-8 px-12 py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
                Get Started
            </button>
        </div>
    );
};
