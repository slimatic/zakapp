import React from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../context/OnboardingContext';
import { Logo } from '../../../components/common/Logo';

export const WelcomeStep: React.FC = () => {
  const { t } = useTranslation('onboarding');
    const { nextStep } = useOnboarding();

    return (
        <div className="flex flex-col items-center justify-center space-y-6 animate-fadeIn text-center pt-4">
            {/* Quran Verse - Moved to Top */}
            <div className="bg-accent p-6 rounded-xl border border-border max-w-lg">
                <p className="text-secondary font-serif text-xl mb-3 font-arabic" dir="rtl">
                    بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </p>
                <p className="text-secondary font-serif text-lg italic mb-2">
                    "Take from their wealth a charity by which you purify them and cause them increase..."
                </p>
                <p className="text-secondary text-xs font-medium uppercase tracking-wide">
                    Surah At-Tawbah (9:103)
                </p>
            </div>

            <div className="flex items-center justify-center mb-2">
                <Logo className="w-20 h-20 text-secondary" />
            </div>

            <p className="text-2xl text-foreground font-serif font-arabic mb-2" dir="rtl">
                ٱلسَّلَامُ عَلَيْكُمْ
            </p>

            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">
                    {t('welcome.title')}
                </h1>
                <p className="text-lg text-secondary font-medium">
                    {t('welcome.subtitle')}
                </p>
            </div>

            <p className="text-muted-foreground max-w-md leading-relaxed">
                {t('welcome.body')}
            </p>

            <button
                onClick={nextStep}
                className="mt-6 px-12 py-4 bg-secondary text-secondary-foreground rounded-xl font-bold shadow-elev-2 hover:bg-secondary/90 transition-all transform hover:-translate-y-1"
            >
                {t('welcome.getStarted')}
            </button>
        </div>
    );
};
