/**
 * Copyright (c) 2024-2026 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types for the onboarding data
export interface AssetData {
    enabled: boolean;
    value?: number; // Calculated total value in currency
    // Metal specific
    grams?: number;
    // Investment specific
    isPassive?: boolean; // 30% rule
    isRestricted?: boolean; // 401k/penalties
    retirementTreatment?: 'full' | 'net_value' | 'deferred' | 'passive';
}

export interface OnboardingData {
    methodology: {
        madhab: 'hanafi' | 'shafii' | 'standard';
        calendar: 'lunar' | 'solar';
    };
    settings: {
        currency: string;
    };
    nisab: {
        standard: 'gold' | 'silver';
    };
    // Flattened assets structure for wizard
    assets: {
        gold: AssetData;
        silver: AssetData;
        cash_on_hand: AssetData;
        bank_accounts: AssetData;
        stocks: AssetData;
        retirement: AssetData; // 401k
        crypto: AssetData;
        other: AssetData;
    };
    liabilities: {
        immediate: number;
        expenses: number;
    };
}

export interface OnboardingContextType {
    currentStep: number;
    totalSteps: number;
    data: OnboardingData;
    canProceed: boolean;
    updateData: (section: keyof OnboardingData, payload: any) => void;
    updateAsset: (key: keyof OnboardingData['assets'], data: Partial<AssetData>) => void;
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
    settings: {
        currency: 'USD'
    },
    nisab: {
        standard: 'silver'
    },
    assets: {
        gold: { ...INITIAL_ASSET_DATA, grams: 0 },
        silver: { ...INITIAL_ASSET_DATA, grams: 0 },
        cash_on_hand: { ...INITIAL_ASSET_DATA },
        bank_accounts: { ...INITIAL_ASSET_DATA },
        stocks: { ...INITIAL_ASSET_DATA, isPassive: false },
        retirement: { ...INITIAL_ASSET_DATA, isRestricted: true, retirementTreatment: 'net_value' },
        crypto: { ...INITIAL_ASSET_DATA },
        other: { ...INITIAL_ASSET_DATA },
    },
    liabilities: {
        immediate: 0,
        expenses: 0
    }
};

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
    const [canProceed, setCanProceed] = useState(true);

    // 8 Steps: Welcome, Identity, Metals, Cash, Investments, Liabilities, Review, Zakat Setup
    const totalSteps = 8;

    const updateData = (section: keyof OnboardingData, payload: any) => {
        setData((prev) => ({
            ...prev,
            [section]: { ...prev[section], ...payload },
        }));
    };

    const updateAsset = (key: keyof OnboardingData['assets'], assetData: Partial<AssetData>) => {
        setData((prev) => ({
            ...prev,
            assets: {
                ...prev.assets,
                [key]: { ...prev.assets[key], ...assetData }
            }
        }));
    };

    const nextStep = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep((curr) => curr + 1);
            window.scrollTo(0, 0);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep((curr) => curr - 1);
            window.scrollTo(0, 0);
        }
    };

    const goToStep = (step: number) => {
        if (step >= 0 && step < totalSteps) {
            setCurrentStep(step);
            window.scrollTo(0, 0);
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
                updateAsset,
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
