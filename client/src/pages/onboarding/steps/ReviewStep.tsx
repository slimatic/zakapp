import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding, OnboardingData } from '../context/OnboardingContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useAssetRepository } from '../../../hooks/useAssetRepository';
import { useNisabRecordRepository } from '../../../hooks/useNisabRecordRepository';
import { useLiabilityRepository } from '../../../hooks/useLiabilityRepository';
import { usePaymentRepository } from '../../../hooks/usePaymentRepository';
import { useNisabThreshold } from '../../../hooks/useNisabThreshold';
import { isAssetZakatable, getAssetZakatableValue } from '../../../core/calculations/zakat';
import { calculateWealth } from '../../../core/calculations/wealthCalculator';
import { gregorianToHijri } from '../../../utils/calendarConverter';
import toast from 'react-hot-toast';

export const ReviewStep: React.FC = () => {
    const { data, prevStep } = useOnboarding();
    const { updateLocalProfile, user } = useAuth();
    const { assets: dbAssets, addAsset } = useAssetRepository();
    const { addRecord } = useNisabRecordRepository();
    const { addLiability } = useLiabilityRepository();
    const { addPayment } = usePaymentRepository();
    const { nisabAmount, goldPrice, silverPrice } = useNisabThreshold();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [zakatPaid, setZakatPaid] = useState<number>(0);
    const [completed, setCompleted] = useState(false);
    const [createdRecordId, setCreatedRecordId] = useState<string | null>(null);

    // Calculate Estimated Zakat for Preview
    const calculateEstimates = () => {
        let totalWealth = 0;
        let zakatableWealth = 0;
        let existingAssetsValue = 0;

        // Determine Methodology for Calculation
        const madhabMap: Record<string, 'STANDARD' | 'HANAFI' | 'SHAFI'> = {
            'standard': 'STANDARD',
            'hanafi': 'HANAFI',
            'shafii': 'SHAFI'
        };
        const selectedMethodologyName = madhabMap[data.methodology.madhab] || 'STANDARD';

        // 1. Process Existing Assets (from DB)
        // SKIPPED: User is running wizard to define/re-define portfolio. 
        // Including DB assets causes double counting if they are re-entering data.

        // 1. Process Existing Assets (from DB)
        const dbStats = calculateWealth(
            dbAssets.filter(a => a.isActive),
            [],
            new Date(),
            selectedMethodologyName
        );
        // We will sum them up at the end for the Grand Total
        existingAssetsValue = dbStats.totalWealth;
        // zakatableWealth += dbStats.zakatableWealth; // Don't add yet, handle carefully

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
        const grandTotalWealth = totalWealth + existingAssetsValue;
        const grandTotalZakatable = zakatableWealth + dbStats.zakatableWealth;

        const netZakatable = Math.max(0, grandTotalZakatable - totalLiabilities);
        const zakatDue = Math.max(0, (netZakatable * 0.025) - zakatPaid);

        return {
            totalWealth: grandTotalWealth, // Show GRAND TOTAL
            newAssetsValue: totalWealth,
            zakatableWealth: grandTotalZakatable,
            existingAssetsValue,
            totalLiabilities,
            netZakatable,
            zakatDue
        };
    };

    const estimates = calculateEstimates();

    const saveData = async () => {
        setIsSubmitting(true);
        const toastId = toast.loading('Setting up your portfolio...');
        try {
            // 1. Update Profile Settings
            const madhabMap: Record<string, string> = {
                'standard': 'standard',
                'hanafi': 'hanafi',
                'shafii': 'shafi' // Onboarding uses 'shafii', profile uses 'shafi'
            };

            await updateLocalProfile({
                isSetupCompleted: true,
                settings: {
                    currency: 'USD',
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
                        currency: 'USD',
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
                await addAsset(asset);
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

            // 4. Create Initial Nisab Record
            const hawlStartDate = new Date();
            const hawlEndDate = new Date();
            hawlEndDate.setDate(hawlStartDate.getDate() + 354);
            const startHijri = gregorianToHijri(hawlStartDate);

            const record = await addRecord({
                hawlStartDate: hawlStartDate.toISOString(),
                hawlCompletionDate: hawlEndDate.toISOString(),
                status: 'DRAFT',
                hijriYear: startHijri.hy,
                nisabBasis: 'GOLD', // Default to Gold safe standard
                totalWealth: estimates.totalWealth,
                zakatableWealth: estimates.netZakatable,
                totalLiabilities: estimates.totalLiabilities,
                zakatAmount: estimates.zakatDue,
                nisabThresholdAtStart: (nisabAmount || 0).toString(),
                userNotes: 'Initial record created from Onboarding Wizard',
                calculationDetails: JSON.stringify({
                    method: 'onboarding_wizard',
                    prices: { gold: goldPrice, silver: silverPrice }
                })
            });

            // 5. Save Payment Record if entered
            if (zakatPaid > 0 && record) {
                await addPayment({
                    amount: zakatPaid,
                    paymentDate: new Date().toISOString(),
                    paymentMethod: 'other',
                    notes: 'Previous payment recorded during onboarding',
                    snapshotId: record.id,
                    recipientName: 'Self-Reported (Onboarding)',
                    recipientCategory: 'general'
                });
            }

            // 6. Complete
            localStorage.setItem(`zakapp_local_prefs_${user?.id}`, JSON.stringify({
                skipped: false,
                completedAt: new Date().toISOString()
            }));

            toast.success('Setup Complete!', { id: toastId });
            if (record) setCreatedRecordId(record.id);
            setCompleted(true);
            setIsSubmitting(false);

        } catch (error: any) {
            console.error("Onboarding Save Failed", error);
            toast.error(`Failed to save data: ${error.message || 'Unknown error'}`, { id: toastId });
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    if (completed) {
        return (
            <div className="text-center space-y-8 animate-fadeIn py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-2">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">You're All Set!</h2>
                    <p className="text-gray-500 max-w-md mx-auto text-lg">
                        Your assets have been imported and your first Nisab Record has been created successfully.
                    </p>
                </div>

                <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100">
                        <h3 className="font-semibold text-emerald-900">Setup Summary</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Total Assets</span>
                            <span className="font-bold text-gray-900">{formatCurrency(estimates.totalWealth)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="text-sm text-gray-600">Zakatable Wealth</span>
                            <span className="font-bold text-emerald-700">{formatCurrency(estimates.zakatableWealth)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 bg-emerald-50 rounded-lg px-4 -mx-2">
                            <span className="text-sm font-medium text-emerald-800">Zakat Due (2.5%)</span>
                            <span className="text-xl font-extrabold text-emerald-700">{formatCurrency(estimates.zakatDue)}</span>
                        </div>
                    </div>
                </div>

                <div className="max-w-md mx-auto bg-green-50 rounded-xl p-6 border border-green-100">
                    <p className="font-medium text-green-800 mb-1">Current Status</p>
                    <p className="text-sm text-green-700">
                        Hawl Started • {estimates.zakatDue > 0 ? 'Zakat Due' : 'Tracking in Progress'}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <button
                        onClick={() => navigate('/nisab-records')}
                        className="px-8 py-4 bg-white text-gray-700 border border-gray-300 rounded-xl font-semibold shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
                    >
                        <span>📄</span> View Nisab Record
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    >
                        <span>📊</span> Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
                    <span className="text-3xl">🎉</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h2>
                <p className="text-gray-500 max-w-sm mx-auto">
                    We'll now create your <strong>Assets</strong> and initialize your first <strong>Nisab Record</strong> to start tracking your Hawl.
                </p>
            </div>

            {/* Payment Input */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Have you already paid some Zakat for this period?
                </label>
                <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={zakatPaid || ''}
                        onChange={(e) => setZakatPaid(parseFloat(e.target.value) || 0)}
                        className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-3"
                        placeholder="0.00"
                    />
                </div>
            </div>

            <div className="bg-emerald-600 rounded-2xl p-8 text-center text-white shadow-xl shadow-emerald-200">
                <p className="text-emerald-100 font-medium mb-1">Estimated Zakat Due</p>
                <div className="text-4xl font-bold mb-2">
                    {formatCurrency(estimates.zakatDue)}
                </div>
                <p className="text-xs text-emerald-200 opacity-80">
                    *Net Zakat after {formatCurrency(estimates.totalLiabilities)} liabilities and {formatCurrency(zakatPaid)} already paid.
                </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-4">Summary</h4>
                <div className="space-y-3 text-sm">
                    {/* Only showing Wizard Assets to prevent confusion/double counting */}
                    {Object.entries(data.assets).map(([key, asset]) => {
                        if (!asset.enabled || !asset.value) return null;
                        return (
                            <div key={key} className="flex justify-between items-center text-gray-700">
                                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                                <span className="font-medium">{formatCurrency(asset.value)}</span>
                            </div>
                        );
                    })}

                    {/* Liabilities Summary */}
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
                    {isSubmitting ? 'Finalizing Setup...' : 'Let\'s Review Your Setup'}
                </button>
            </div>
        </div>
    );
};
