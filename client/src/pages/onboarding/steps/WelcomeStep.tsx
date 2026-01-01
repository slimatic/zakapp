import React from 'react';
import { useOnboarding } from '../context/OnboardingContext';

export const WelcomeStep: React.FC = () => {
    const { nextStep } = useOnboarding();

    return (
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 mb-6">
                <span className="text-3xl">🛡️</span>
            </div>

            <h3 className="text-xl font-medium text-gray-900 mb-4">
                Your Wealth, Your Privacy
            </h3>

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
