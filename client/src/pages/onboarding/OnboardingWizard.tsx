import React from 'react';
import { OnboardingProvider } from './context/OnboardingContext';
import { OnboardingLayout } from './OnboardingLayout';

export const OnboardingWizard: React.FC = () => {
    return (
        <OnboardingProvider>
            <OnboardingLayout />
        </OnboardingProvider>
    );
};
