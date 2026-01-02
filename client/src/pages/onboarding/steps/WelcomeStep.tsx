import React from 'react';
import { Link } from 'react-router-dom';
import { useOnboarding } from '../context/OnboardingContext';
import { Logo } from '../../../components/common/Logo';
import { GlossaryTerm } from '../../../components/common/GlossaryTerm';

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

            <h2 className="text-xl font-bold text-gray-900 mb-4">
                Helping you fulfill the Trust, privately.
            </h2>

            <div className="text-gray-600 mb-8 max-w-sm mx-auto">
                <p className="mb-4">
                    Your financial data never leaves this device. We have zero knowledge of your assets.
                </p>
                <Link to="/privacy-policy" className="text-emerald-600 hover:text-emerald-700 font-medium text-sm inline-flex items-center gap-1" target="_blank" rel="noopener noreferrer">
                    Read our Privacy Policy
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </Link>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-900 text-left mb-6 flex gap-3">
                <span className="text-xl">💡</span>
                <span>
                    <strong>Note:</strong> In the next few steps, we'll configure settings according to your <GlossaryTerm term="madhab" /> (School of Thought).
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
