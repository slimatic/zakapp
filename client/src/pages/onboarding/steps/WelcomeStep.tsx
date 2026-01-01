import React from 'react';
import { useOnboarding } from '../context/OnboardingContext';
import { Logo } from '../../../components/common/Logo';

export const WelcomeStep: React.FC = () => {
    const { nextStep } = useOnboarding();

    return (
        <div className="text-center">
            <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-sm">
                    <Logo className="w-12 h-12 text-emerald-600" />
                </div>
            </div>

            <div className="space-y-2 mb-6">
                <p className="text-emerald-800 font-arabic text-xl" lang="ar" dir="rtl">السلام عليكم</p>
                <p className="text-gray-600">As-salamu alaykum</p>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to ZakApp
            </h1>

            <h2 className="text-lg text-gray-600 font-medium mb-8">
                Your Wealth, Your Privacy
            </h2>

            <div className="prose prose-sm mx-auto text-gray-500 mb-8">
                <p className="mb-4">
                    ZakApp is built on a <strong>Local-First</strong> architecture. This means:
                </p>
                <ul className="text-left list-disc pl-6 space-y-2">
                    <li>Your financial data <strong>never</strong> leaves this device unencrypted.</li>
                    <li>Calculations happen <strong>offline</strong> in your browser.</li>
                    <li>We have <strong>zero knowledge</strong> of your assets or Zakat dues.</li>
                </ul>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 text-left mb-6">
                <strong>💡 Note:</strong> In the next few steps, we'll configure your Zakat preferences according to your Madhab (School of Thought).
            </div>

            <button
                onClick={nextStep}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-md transition-colors"
            >
                Get Started
            </button>
        </div>
    );
};
