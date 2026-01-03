import React from 'react';
import { useOnboarding } from '../context/OnboardingContext';
import { Logo } from '../../../components/common/Logo';

export const WelcomeStep: React.FC = () => {
    const { nextStep } = useOnboarding();

    return (
        <div className="flex flex-col items-center justify-center space-y-6 animate-fadeIn text-center pt-4">
            {/* Quran Verse - Moved to Top */}
            <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 max-w-lg">
                <p className="text-emerald-800 font-serif text-xl mb-3 font-arabic" dir="rtl">
                    بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </p>
                <p className="text-emerald-800 font-serif text-lg italic mb-2">
                    "Take from their wealth a charity by which you purify them and cause them increase..."
                </p>
                <p className="text-emerald-600 text-xs font-medium uppercase tracking-wide">
                    Surah At-Tawbah (9:103)
                </p>
            </div>

            <div className="flex items-center justify-center mb-2">
                <Logo className="w-20 h-20 text-emerald-600" />
            </div>

            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome to ZakApp
                </h1>
                <p className="text-lg text-emerald-700 font-medium">
                    Helping you to purify and increase entrusted wealth
                </p>
            </div>

            <p className="text-2xl text-gray-800 font-serif font-arabic mb-2" dir="rtl">
                ٱلسَّلَامُ عَلَيْكُمْ
            </p>

            <p className="text-gray-600 max-w-md leading-relaxed">
                Let's get your portfolios set up. You are not expected to enter all your information in one sitting. You can simply start by adding a few assets now and return to the wizard or your dashboard to add more anytime.
            </p>

            <button
                onClick={nextStep}
                className="mt-6 px-12 py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
                Get Started
            </button>
        </div>
    );
};
