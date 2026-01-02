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

            <div className="space-y-4 mb-8">
                <div className="space-y-1">
                    <p className="text-emerald-800 font-arabic text-xl" lang="ar" dir="rtl">السلام عليكم</p>
                    <p className="text-gray-600">As-salamu alaykum</p>
                </div>

                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                    <p className="text-emerald-800 italic font-serif text-lg leading-relaxed">
                        "...and spend from that of which He has made you trustees."
                    </p>
                    <p className="text-emerald-600 text-sm mt-2 font-medium">— Surah Al-Hadid (57:7)</p>
                </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome to ZakApp
            </h1>

            <h2 className="text-lg text-gray-600 font-medium mb-8">
                Helping you fulfill the Trust, privately.
            </h2>

            <div className="prose prose-sm mx-auto text-gray-500 mb-8 text-left max-w-sm">
                <p className="mb-4">
                    ZakApp helps you calculate your Zakat while honoring your privacy through a <strong>Local-First</strong> architecture:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>The details of your provision (rizq) <strong>never</strong> leave this device.</li>
                    <li>All calculations happen <strong>offline</strong>, right here in your browser.</li>
                    <li>We have <strong>zero knowledge</strong> of your assets or data.</li>
                </ul>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-900 text-left mb-6 flex gap-3">
                <span className="text-xl">💡</span>
                <span>
                    <strong>Note:</strong> In the next few steps, we'll configure settings according to your Madhab (School of Thought).
                </span>
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
