import React from 'react';
import { OnboardingProvider } from './context/OnboardingContext';

export const OnboardingWizard: React.FC = () => {
    return (
        <OnboardingProvider>
            <OnboardingLayout />
        </OnboardingProvider>
    );
};
