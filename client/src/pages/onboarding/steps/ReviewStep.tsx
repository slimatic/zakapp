import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding, OnboardingData } from '../context/OnboardingContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useAssetRepository } from '../../../hooks/useAssetRepository';
import { useLiabilityRepository } from '../../../hooks/useLiabilityRepository';
import { isAssetZakatable, getAssetZakatableValue } from '../../../core/calculations/zakat';
import { calculateWealth } from '../../../core/calculations/wealthCalculator';
import toast from 'react-hot-toast';

export const ReviewStep: React.FC = () => {
    const { data, prevStep, nextStep } = useOnboarding();
    const { updateLocalProfile, user } = useAuth();
    const { assets: dbAssets, addAsset } = useAssetRepository();
    const { addLiability } = useLiabilityRepository();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [zakatPaid, setZakatPaid] = useState<number>(0);
    const [completed, setCompleted] = useState(false);
    const [createdRecordId, setCreatedRecordId] = useState<string | null>(null);

    // State to hold frozen estimates after completion to prevent double-counting
    const [finalEstimates, setFinalEstimates] = useState<any>(null);

    // Calculate Estimated Zakat for Preview
    const calculateEstimates = () => {
        let totalWealth = 0;
        let zakatableWealth = 0;
        let existingAssetsValue = 0;

        // Determine Methodology for Calculation
        const madhabMap: Record<string, 'STANDARD' | 'HANAFI' | 'SHAFII'> = {
            'standard': 'STANDARD',
            'hanafi': 'HANAFI',
            'shafii': 'SHAFII'
        };
        const selectedMethodologyName = madhabMap[data.methodology.madhab] || 'STANDARD';

        // 1. Process Existing Assets (from DB)
        // Only valid if we haven't completed (otherwise we get double counting)
        // CRITICAL FIX: To prevent double counting during partial saves/retries,
        // we EXCLUDE any DB assets that match the names of assets we are about to create from the wizard.
        const onboardingAssetNames = [
            'Gold Assets', 'Silver Assets', 'Cash on Hand', 'Main Bank Account',
            'Stock Portfolio', 'Retirement Fund', 'Crypto Holdings', 'Other Assets'
        ];

        if (!completed) {
            // Filter out assets that we are managing in the wizard
            const nonOnboardingAssets = dbAssets.filter(a =>
                a.isActive && !onboardingAssetNames.includes(a.name)
            );

            const dbStats = calculateWealth(
                nonOnboardingAssets,
                [],
                new Date(),
                selectedMethodologyName
            );
            // We will sum them up at the end for the Grand Total
            existingAssetsValue = dbStats.totalWealth;
        }

        // 2. Process Wizard Assets
        const addWizardAsset = (type: string, val: number | undefined, isPassive: boolean, retirementTreatment?: string) => {
            const v = val || 0;
            if (v <= 0) return;
            totalWealth += v;

            // Apply modifiers for calculation
            let zakatableValue = v;

            // Retirement Logic
            if (type === 'RETIREMENT') {
                switch (retirementTreatment) {
                    case 'deferred':
                        zakatableValue = 0;
                        break;
                    case 'passive':
                        zakatableValue = v * 0.30;
                        break;
                    case 'net_value':
                        zakatableValue = v * 0.70;
                        break;
                    case 'full':
                    default:
                        zakatableValue = v;
                        break;
                }
            }
            // Standard Passive Logic (Stocks)
            else if (isPassive) {
                zakatableValue = v * 0.30;
            }

            zakatableWealth += zakatableValue;
        };

        const { assets } = data;
        addWizardAsset('GOLD', assets.gold.value, false);
        addWizardAsset('SILVER', assets.silver.value, false);
        addWizardAsset('CASH', assets.cash_on_hand.value, false);
        addWizardAsset('BANK_ACCOUNT', assets.bank_accounts.value, false);
        addWizardAsset('INVESTMENT_ACCOUNT', assets.stocks.value, assets.stocks.isPassive || false);
        addWizardAsset('RETIREMENT', assets.retirement.value, false, assets.retirement.retirementTreatment || 'net_value');
        addWizardAsset('CRYPTOCURRENCY', assets.crypto.value, false);
        addWizardAsset('OTHER', assets.other.value, false);

        // Deduct deductible liabilities (Immediate + Expenses usually)
        const totalLiabilities = (data.liabilities?.immediate || 0) + (data.liabilities?.expenses || 0);

        // combine
        const existingZakatable = !completed
            ? calculateWealth(dbAssets.filter(a => a.isActive && !onboardingAssetNames.includes(a.name)), [], new Date(), selectedMethodologyName).zakatableWealth
            : 0;

        const grandTotalWealth = totalWealth + existingAssetsValue;
        const grandTotalZakatable = zakatableWealth + existingZakatable;

        const netZakatable = Math.max(0, grandTotalZakatable - totalLiabilities);

        // Split Zakat Due: Gross (Obligation) vs Net (Remaining)
        const totalZakatDue = netZakatable * 0.025; // Gross Obligation
        const remainingZakatDue = Math.max(0, totalZakatDue - zakatPaid);

        return {
            totalWealth: grandTotalWealth, // Show GRAND TOTAL
            newAssetsValue: totalWealth,
            zakatableWealth: grandTotalZakatable,
            existingAssetsValue,
            totalLiabilities,
            netZakatable,
            totalZakatDue,      // Absolute Obligation
            remainingZakatDue   // Net Payable
        };
    };

    const estimates = calculateEstimates();

    // Use finalEstimates if completed, otherwise live estimates
    const displayEstimates = completed ? finalEstimates : estimates;

    const saveData = async () => {
        setIsSubmitting(true);
        const toastId = toast.loading('Saving your portfolio...');

        try {
            // 1. Update Profile Settings
            const madhabMap: Record<string, string> = {
                'standard': 'standard',
                'hanafi': 'hanafi',
                'shafii': 'shafii' // Corrected mapping
            };

            await updateLocalProfile({
                isSetupCompleted: false, // Not complete yet, next step is final
                settings: {
                    currency: data.settings?.currency || 'USD',
                    preferredMethodology: madhabMap[data.methodology.madhab] as any,
                    preferredCalendar: 'gregorian',
                }
            });

            // 2. Save NEW Assets
            const assetsToSave: any[] = [];
            const pushAsset = (key: keyof OnboardingData['assets'], type: string, name: string) => {
                const asset = data.assets[key];
                if (asset.enabled && (asset.value || 0) > 0) {
                    const metadata: any = {};
                    let subCategory = undefined;

                    // Determine subCategory and metadata defaults
                    if (type === 'gold') metadata.karat = '24k';
                    if (type === 'silver') metadata.purity = 0.999;

                    if (key === 'retirement') {
                        subCategory = 'retirement_401k'; // Default for onboarding
                        type = 'RETIREMENT';

                        // Set Details based on Treatment
                        const treatment = asset.retirementTreatment || 'net_value';
                        if (treatment === 'net_value') {
                            metadata.retirementDetails = { withdrawalPenalty: 0.1, taxRate: 0.2 }; // ~70% net
                        } else if (treatment === 'deferred') {
                            metadata.retirementDetails = { withdrawalPenalty: 1.0, taxRate: 0 }; // 0% net
                        } else if (treatment === 'passive') {
                            metadata.retirementDetails = { withdrawalPenalty: 0.7, taxRate: 0 }; // 30% net (proxy for passive)
                        } else {
                            // Full
                            metadata.retirementDetails = { withdrawalPenalty: 0, taxRate: 0 };
                        }
                    } else if (key === 'bank_accounts') {
                        subCategory = 'checking';
                    } else if (key === 'stocks') {
                        subCategory = 'individual_stocks';
                    } else if (key === 'cash_on_hand') {
                        subCategory = 'cash_on_hand';
                    } else if (key === 'crypto') {
                        subCategory = 'bitcoin'; // Generic default
                    }

                    assetsToSave.push({
                        type: type.toUpperCase(),
                        name,
                        value: asset.value,
                        quantity: asset.grams ? asset.grams : undefined,
                        currency: data.settings?.currency || 'USD',
                        isPassiveInvestment: asset.isPassive,
                        isRestrictedAccount: asset.isRestricted,
                        acquisitionDate: new Date().toISOString(),
                        metadata: JSON.stringify(metadata),
                        zakatEligible: true,
                        subCategory: subCategory
                    });
                }
            };

            pushAsset('gold', 'GOLD', 'Gold Assets');
            pushAsset('silver', 'SILVER', 'Silver Assets');
            pushAsset('cash_on_hand', 'CASH', 'Cash on Hand');
            pushAsset('bank_accounts', 'BANK_ACCOUNT', 'Main Bank Account');
            pushAsset('stocks', 'INVESTMENT_ACCOUNT', 'Stock Portfolio');
            pushAsset('retirement', 'RETIREMENT', 'Retirement Fund');
            pushAsset('crypto', 'CRYPTOCURRENCY', 'Crypto Holdings');
            pushAsset('other', 'OTHER', 'Other Assets');

            for (const asset of assetsToSave) {
                // Idempotency: Check if asset already exists
                const exists = dbAssets.some(a => a.isActive && a.name === asset.name && a.type === asset.type);
                if (!exists) {
                    await addAsset(asset);
                }
            }

            // 3. Save Liabilities
            if (data.liabilities?.immediate > 0) {
                await addLiability({
                    name: 'Immediate Debts (Onboarding)',
                    type: 'LOAN',
                    amount: data.liabilities.immediate,
                    dueDate: new Date().toISOString()
                });
            }
            if (data.liabilities?.expenses > 0) {
                await addLiability({
                    name: 'Living Expenses (Onboarding)',
                    type: 'EXPENSE',
                    amount: data.liabilities.expenses,
                    dueDate: new Date().toISOString()
                });
            }

            toast.success('Assets Saved!', { id: toastId });
            setIsSubmitting(false);

            // Navigate to next step (Zakat Setup)
            nextStep();

            // IMPORTANT: Since we are splitting, we need to call nextStep()
            // However, calculateEstimates logic above (lines 33-143) is still used for display?
            // Yes, display logic is fine.
        } catch (error: any) {
            console.error("Onboarding Save Failed", error);
            toast.error(`Failed to save data: ${error.message || 'Unknown error'}`, { id: toastId });
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: data.settings?.currency || 'USD' }).format(val);

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
                    <span className="text-3xl">📝</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Entries</h2>
                <p className="text-gray-500 max-w-sm mx-auto">
                    Please review your assets below. We will save these to your portfolio and then calculate your Zakat.
                </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">Summary of Entries</h4>
                <div className="space-y-3 text-sm">
                    {Object.entries(data.assets).map(([key, asset]) => {
                        if (!asset.enabled || !asset.value) return null;
                        return (
                            <div key={key} className="flex justify-between items-center text-gray-700">
                                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                                <span className="font-medium">{formatCurrency(asset.value)}</span>
                            </div>
                        );
                    })}

                    {(data.liabilities?.immediate > 0 || data.liabilities?.expenses > 0) && (
                        <div className="border-t border-gray-200 my-2 pt-2"></div>
                    )}
                    {data.liabilities?.immediate > 0 && (
                        <div className="flex justify-between items-center text-red-700">
                            <span>Immediate Debts</span>
                            <span className="font-medium">-{formatCurrency(data.liabilities.immediate)}</span>
                        </div>
                    )}
                    {data.liabilities?.expenses > 0 && (
                        <div className="flex justify-between items-center text-orange-700">
                            <span>Living Expenses</span>
                            <span className="font-medium">-{formatCurrency(data.liabilities.expenses)}</span>
                        </div>
                    )}
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-900">Total Net Assets</span>
                    <span className="text-lg font-bold text-emerald-700">{formatCurrency(estimates.totalWealth - estimates.totalLiabilities)}</span>
                </div>
            </div>

            <div className="flex justify-between pt-4">
                <button
                    onClick={prevStep}
                    className="px-6 py-3 text-slate-600 font-medium hover:text-slate-800 transition-colors"
                    disabled={isSubmitting}
                >
                    Back
                </button>
                <button
                    onClick={saveData}
                    disabled={isSubmitting}
                    className="px-12 py-3 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Finalizing Setup...' : 'Save & Continue'}
                </button>
            </div>
        </div>
    );
};

