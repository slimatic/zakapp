import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types for the onboarding data
export interface AssetData {
    enabled: boolean;
    value?: number; // Make value optional as it's not always present in initial state
    category?: string; // Add category for the new structure
}

export interface OnboardingData {
    methodology: {
        madhab: 'hanafi' | 'shafii' | 'standard';
        calendar: 'lunar' | 'solar';
    };
    nisab: {
        standard: 'gold' | 'silver';
    };
    assets: Record<string, AssetData>;
    liabilities: Record<string, AssetData>;
    payments: {
        madePayments: boolean;
        amount?: number;
        date?: string;
    };
}

export interface OnboardingContextType {
    currentStep: number;
    totalSteps: number;
    data: OnboardingData;
    canProceed: boolean;
    updateData: (section: keyof OnboardingData, payload: any) => void;
    nextStep: () => void;
    prevStep: () => void;
    setCanProceed: (can: boolean) => void;
    goToStep: (step: number) => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const INITIAL_ASSET_DATA: AssetData = { enabled: false, value: 0 };

const INITIAL_DATA: OnboardingData = {
    methodology: {
        madhab: 'standard',
        calendar: 'lunar'
    },
    nisab: {
        standard: 'silver'
    },
    assets: {
        cash: { category: 'cash', enabled: false },
        gold: { category: 'gold', enabled: false },
        silver: { category: 'silver', enabled: false },
        stocks: { category: 'stock', enabled: false },
        crypto: { category: 'crypto', enabled: false },
        retirement: { category: 'retirement', enabled: false },
        business: { category: 'business_assets', enabled: false },
        receivables: { category: 'receivables', enabled: false },
        realEstateRental: { category: 'property', enabled: false },
        realEstateResale: { category: 'property', enabled: false },
    },
    liabilities: {
        personal_loans: { category: 'debt_personal', enabled: false },
        credit_cards: { category: 'debt_credit_card', enabled: false },
        student_loans: { category: 'debt_student_loan', enabled: false },
        mortgage: { category: 'debt_mortgage', enabled: false },
        commercial_debt: { category: 'debt_commercial', enabled: false },
    },
    payments: {
        madePayments: false,
    }
};

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
    const [canProceed, setCanProceed] = useState(true); // Default to true, steps disable if needed

    // Fixed number of steps: Welcome, Methodology, Nisab, Assets, Liabilities, Payments, Summary
    const totalSteps = 7;

    const updateData = (section: keyof OnboardingData, payload: any) => {
        setData((prev) => ({
            ...prev,
            [section]: { ...prev[section], ...payload },
        }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep((curr) => curr + 1);
            setCanProceed(true); // Reset for next step
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep((curr) => curr - 1);
            setCanProceed(true);
        }
    };

    const goToStep = (step: number) => {
        if (step >= 0 && step < totalSteps) {
            setCurrentStep(step);
        }
    };

    return (
        <OnboardingContext.Provider
            value={{
                currentStep,
                totalSteps,
                data,
                canProceed,
                updateData,
                nextStep,
                prevStep,
                setCanProceed,
                goToStep,
            }}
        >
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
};
