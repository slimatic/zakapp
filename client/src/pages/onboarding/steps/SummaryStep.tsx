import React, { useState, useEffect } from 'react';
import { TermHelp } from '../../../components/ui/TermHelp';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useOnboarding, AssetData } from '../context/OnboardingContext';
import { AssetType } from '../../../types';
import { apiService } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';
import { useAssetRepository } from '../../../hooks/useAssetRepository';
import { useNisabRecordRepository } from '../../../hooks/useNisabRecordRepository';
import { usePaymentRepository } from '../../../hooks/usePaymentRepository';
import { useLiabilityRepository } from '../../../hooks/useLiabilityRepository';
import { gregorianToHijri, hijriDateToString } from '../../../utils/calendarConverter';
import { addDays } from 'date-fns';
import { AssetsBreakdownChart } from '../../../components/dashboard/AssetsBreakdownChart';
import { WealthSummaryCard } from '../../../components/dashboard/WealthSummaryCard';
import { ActiveRecordWidget } from '../../../components/dashboard/ActiveRecordWidget';
import { useNisabThreshold } from '../../../hooks/useNisabThreshold';
import { Asset } from '../../../types';

export const SummaryStep: React.FC = () => {
    const { data } = useOnboarding();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tasks, setTasks] = useState({
        preferences: 'pending',
        assets: 'pending',
        liabilities: 'pending',
        hawl: 'pending',
        payments: 'pending'
    });
    const [postOnboardingStep, setPostOnboardingStep] = useState<'wealth' | 'nisab' | null>(null);
    const [createdRecord, setCreatedRecord] = useState<any>(null); // To store the created Nisab record

    const assetList = Object.values(data.assets).filter((a: any) => a.enabled) as AssetData[];
    const liabilityList = Object.values(data.liabilities || {}).filter((a: any) => a.enabled) as AssetData[];

    const { addAsset, assets: existingAssets } = useAssetRepository();
    const { addRecord } = useNisabRecordRepository();
    const { addPayment } = usePaymentRepository();
    const { addLiability, liabilities: existingLiabilities } = useLiabilityRepository();

    // Calculate totals including EXISTING database items + NEW items
    const existingZakatableAssets = existingAssets
        .filter(a => a.zakatEligible)
        .reduce((sum, a) => sum + (a.value * (a.calculationModifier ?? 1)), 0);

    const existingLiabilitiesTotal = existingLiabilities
        .reduce((sum, l) => sum + l.amount, 0);

    // Calculate NEW items totals (Session Preview)
    const newAssetsValue = assetList.reduce((sum, a) => sum + (a.value || 0), 0);
    const newLiabilitiesValue = liabilityList.reduce((sum, a) => sum + (a.value || 0), 0);

    // Grand Totals for UI Preview
    // Note: This is an approximation for the "Review" screen. 
    // The precise Zakatable amount is calculated in handleFinish.
    const totalAssetsPreview = existingAssets.reduce((sum, a) => sum + a.value, 0) + newAssetsValue;
    const totalLiabilitiesPreview = existingLiabilitiesTotal + newLiabilitiesValue;
    const netWealthPreview = totalAssetsPreview - totalLiabilitiesPreview;

    // Status Icon Helper
    const StatusIcon = ({ taskStatus }: { taskStatus: string }) => {
        if (taskStatus === 'success') return <span className="text-emerald-500">✓</span>;
        if (taskStatus === 'error') return <span className="text-red-500">✗</span>;
        if (taskStatus === 'loading') return <span className="animate-spin">⏳</span>;
        return <span className="text-gray-300">•</span>;
    };

    // Get Nisab threshold for summary view
    const nisabBasis = (data.nisab.standard.toUpperCase()) as 'GOLD' | 'SILVER';
    const { nisabAmount } = useNisabThreshold('USD', nisabBasis);
    const nisabThreshold = nisabAmount || 5000;

    const handleFinish = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Sync Calendar & Madhab to Backend
            try {
                setTasks(prev => ({ ...prev, preferences: 'loading' }));
                if (data.methodology.calendar && data.methodology.madhab) {
                    const calendarMap: Record<string, 'hijri' | 'gregorian'> = {
                        lunar: 'hijri',
                        solar: 'gregorian'
                    };
                    await apiService.updateCalendarPreferences({
                        preferredCalendar: calendarMap[data.methodology.calendar] || 'hijri',
                        preferredMethodology: data.methodology.madhab as any
                    });
                }
                setTasks(p => ({ ...p, preferences: 'success' }));
            } catch (err) {
                console.error('Failed to save preferences:', err);
                setTasks(p => ({ ...p, preferences: 'error' }));
            }

            const now = new Date();
            const completionDate = addDays(now, 354); // Approx lunar year
            const hijriStart = gregorianToHijri(now);
            const hijriEnd = gregorianToHijri(completionDate);

            // 2. Create Assets (Local)
            let createdZakatableAssets = 0;
            const createdAssetsList: Asset[] = [];

            try {
                setTasks(prev => ({ ...prev, assets: 'loading' }));
                const assetPromises = (Object.entries(data.assets) as [string, AssetData][])
                    .filter(([_, assetData]) => assetData.enabled)
                    .map(async ([key, assetData]) => {
                        const typeMap: Record<string, string> = {
                            cash: 'CASH',
                            gold: 'GOLD',
                            silver: 'SILVER',
                            stocks: 'INVESTMENT_ACCOUNT',
                            stock: 'INVESTMENT_ACCOUNT',
                            crypto: 'CRYPTOCURRENCY',
                            realEstateResale: 'REAL_ESTATE',
                            realEstateRental: 'REAL_ESTATE',
                            retirement: 'RETIREMENT',
                            business: 'BUSINESS_ASSETS',
                            receivables: 'DEBTS_OWED_TO_YOU'
                        };

                        const assetValue = assetData.value || 0;
                        const isExempt = key === 'realEstateRental';
                        const mod = isExempt ? 0 : 1.0;

                        // Calculate zakatable portion for the record
                        if (!isExempt) {
                            createdZakatableAssets += assetValue * mod;
                        }

                        // Determine subtype
                        let subtype: string | undefined;
                        if (key === 'realEstateResale') subtype = 'property_for_resale';
                        if (key === 'realEstateRental') subtype = 'rental_property';

                        const newAsset = {
                            name: `Initial ${key.replace(/([A-Z])/g, ' $1').trim()}`,
                            type: (typeMap[key] || 'OTHER') as AssetType,
                            subCategory: subtype,
                            value: assetValue,
                            currency: 'USD',
                            acquisitionDate: now.toISOString(),
                            zakatEligible: !isExempt,
                            calculationModifier: mod
                        };

                        // Store for chart later
                        // We push a mock version to createdAssetsList for immediate display, 
                        // though addAsset returns the doc usually.
                        createdAssetsList.push({
                            ...newAsset,
                            id: `temp-new-${key}`,
                            userId: user?.id || 'temp',
                            createdAt: now.toISOString(),
                            updatedAt: now.toISOString(),
                            isActive: true,
                        } as Asset);

                        return addAsset(newAsset);
                    });

                if (assetPromises.length > 0) {
                    await Promise.all(assetPromises);
                }
                setTasks(p => ({ ...p, assets: 'success' }));
            } catch (err) {
                console.error('Failed to create assets:', err);
                setTasks(p => ({ ...p, assets: 'error' }));
                setError(err instanceof Error ? `Asset creation failed: ${err.message}` : 'Failed to create assets');
                setIsSubmitting(false);
                return;
            }

            // 3. Create Liabilities (Local)
            let createdDeductibleLiabilities = 0;
            try {
                setTasks(prev => ({ ...prev, liabilities: 'loading' }));
                const liabilityPromises = (Object.entries(data.liabilities || {}) as [string, AssetData][])
                    .filter(([_, assetData]) => assetData.enabled)
                    .map(([key, assetData]) => {
                        const typeMap: Record<string, string> = {
                            personal_loans: 'short_term',
                            credit_cards: 'short_term',
                            student_loans: 'long_term',
                            mortgage: 'long_term',
                            commercial_debt: 'business_payable'
                        };

                        const liabilityName = key.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
                        const dueDate = new Date(completionDate);
                        dueDate.setDate(dueDate.getDate() - 1);

                        const liabilityAmount = Math.abs(assetData.value || 0);
                        createdDeductibleLiabilities += liabilityAmount;

                        return addLiability({
                            name: liabilityName,
                            type: typeMap[key] || 'short_term',
                            amount: liabilityAmount,
                            currency: 'USD',
                            dueDate: dueDate.toISOString(),
                            notes: 'Created during onboarding'
                        });
                    });

                if (liabilityPromises.length > 0) {
                    await Promise.all(liabilityPromises);
                }
                setTasks(p => ({ ...p, liabilities: 'success' }));
            } catch (err) {
                console.error('Failed to create liabilities:', err);
                setTasks(p => ({ ...p, liabilities: 'error' }));
                setIsSubmitting(false);
                return;
            }

            let hawlRecordId: string | undefined;

            // 4. Initialize Hawl (Nisab Year) - Combine EXISTING + NEW
            const grandTotalZakatableAssets = existingZakatableAssets + createdZakatableAssets;
            const grandTotalLiabilities = existingLiabilitiesTotal + createdDeductibleLiabilities;
            const grandTotalNetWealth = Math.max(0, grandTotalZakatableAssets - grandTotalLiabilities); // No negative wealth
            const calculatedZakatAmount = (grandTotalNetWealth >= nisabThreshold) ? (grandTotalNetWealth * 0.025) : 0;

            try {
                setTasks(prev => ({ ...prev, hawl: 'loading' }));

                const hawlDoc = await addRecord({
                    hawlStartDate: now.toISOString(),
                    hawlStartDateHijri: hijriDateToString(hijriStart),
                    hawlCompletionDate: completionDate.toISOString(),
                    hawlCompletionDateHijri: hijriDateToString(hijriEnd),
                    hijriYear: hijriStart.hy,
                    nisabBasis: data.nisab.standard.toUpperCase() as 'GOLD' | 'SILVER',
                    totalWealth: grandTotalNetWealth,
                    zakatableWealth: grandTotalNetWealth,
                    zakatAmount: calculatedZakatAmount,
                    status: 'DRAFT',
                    nisabThresholdAtStart: nisabThreshold.toString()
                });

                if (hawlDoc) {
                    hawlRecordId = hawlDoc.id;
                    setCreatedRecord({ ...hawlDoc.toJSON(), id: hawlDoc.id });
                }

                setTasks(prev => ({ ...prev, hawl: 'success' }));
            } catch (err) {
                console.error('Failed to init Nisab record:', err);
                setTasks(p => ({ ...p, hawl: 'error' }));
            }

            // 5. Record Payments
            if (data.payments?.madePayments && data.payments.amount && hawlRecordId) {
                try {
                    setTasks(p => ({ ...p, payments: 'loading' }));
                    await addPayment({
                        amount: Number(data.payments.amount),
                        currency: 'USD',
                        paymentDate: new Date().toISOString(),
                        snapshotId: hawlRecordId,
                        notes: 'Initial payment recorded during onboarding'
                    });
                    setTasks(p => ({ ...p, payments: 'success' }));
                } catch (err) {
                    console.error('Failed to record payment:', err);
                    setTasks(p => ({ ...p, payments: 'error' }));
                }
            } else {
                setTasks(p => ({ ...p, payments: 'success' }));
            }

            // 6. Local Storage & Transition
            if (user?.id) {
                localStorage.setItem(`zakapp_local_prefs_${user.id}`, JSON.stringify({
                    ...data,
                    completedAt: new Date().toISOString()
                }));
            }

            setIsSubmitting(false);
            setPostOnboardingStep('wealth');

        } catch (err) {
            console.error('Onboarding setup failed:', err);
            setError(err instanceof Error ? err.message : 'Setup failed');
            setIsSubmitting(false);
        }
    };

    const completeOnboarding = () => {
        navigate('/dashboard', { replace: true });
        window.location.reload();
    };

    if (postOnboardingStep === 'wealth') {
        // Merge Existing Assets + Newly Created Assets (simulated) 
        // to show the COMPLETE portfolio in the chart
        const newAssetsForChart: Asset[] = (Object.entries(data.assets) as [string, AssetData][])
            .filter(([_, assetData]) => assetData.enabled)
            .map(([key, assetData], index) => {
                const typeMap: Record<string, string> = {
                    cash: 'CASH',
                    gold: 'GOLD',
                    silver: 'SILVER',
                    stocks: 'INVESTMENT_ACCOUNT',
                    stock: 'INVESTMENT_ACCOUNT',
                    crypto: 'CRYPTOCURRENCY',
                    realEstateResale: 'REAL_ESTATE',
                    realEstateRental: 'REAL_ESTATE',
                    retirement: 'RETIREMENT',
                    business: 'BUSINESS_ASSETS',
                    receivables: 'DEBTS_OWED_TO_YOU'
                };
                return {
                    id: `temp-new-${index}`,
                    name: `Asset ${index}`,
                    type: (typeMap[key] || 'OTHER') as any,
                    value: assetData.value || 0,
                    currency: 'USD',
                    isZakatable: true,
                    isActive: true,
                    userId: user?.id || 'temp',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            });

        const combinedAssetsForChart = [...existingAssets, ...newAssetsForChart];

        // Calculate wealth including existing DB items
        const finalTotalWealth = existingZakatableAssets + newAssetsValue - (existingLiabilitiesTotal + newLiabilitiesValue);

        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Assets Successfully Added!</h3>
                    <p className="text-gray-500">
                        Here is a breakdown of your complete wealth portfolio.
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <WealthSummaryCard
                        totalWealth={finalTotalWealth}
                        nisabThreshold={nisabThreshold}
                        currency="USD"
                    />
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <AssetsBreakdownChart assets={combinedAssetsForChart} currency="USD" />
                </div>

                <button
                    onClick={() => setPostOnboardingStep('nisab')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-lg py-3 transition-colors"
                >
                    Next: View Nisab Record
                </button>
            </div>
        );
    }

    if (postOnboardingStep === 'nisab') {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold text-emerald-800" lang="ar" dir="rtl" aria-label="As-salamu alaykum">
                        السلام عليكم
                    </h2>
                    <p className="text-sm text-emerald-600/80 uppercase tracking-widest font-medium">Peace be upon you</p>

                    <div className="pt-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Your Nisab Year has Started</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            We've created a record to track your wealth over the lunar year (Hawl).
                        </p>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 text-sm text-blue-900 shadow-sm">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span className="text-xl">🌙</span> What happens next?
                    </h4>
                    <div className="space-y-3 leading-relaxed opacity-90">
                        <p>
                            Your <strong><TermHelp term="Hawl" arabic="الحول" definition="The lunar year period (354 days) that wealth must be held continuously before Zakat becomes due.">Hawl Period</TermHelp></strong> (354 days) has begun. If your wealth remains above the <strong><TermHelp term="Nisab" arabic="النصاب" definition="The minimum amount of wealth a Muslim must own for a full lunar year to be eligible to pay Zakat.">Nisab threshold</TermHelp></strong>
                            until <strong>{createdRecord?.hawlCompletionDate ? new Date(createdRecord.hawlCompletionDate).toLocaleDateString() : 'the end date'}</strong>,
                            Zakat will be due.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-100">
                        <p className="text-gray-600 font-medium text-center text-sm">Your New <TermHelp term="Nisab Record" arabic="سجل النصاب" definition="A digital record tracking your Zakatable assets over a specific lunar year.">Nisab Record</TermHelp></p>
                    </div>
                    {createdRecord && (
                        <div className="p-4">
                            <ActiveRecordWidget record={createdRecord} />
                        </div>
                    )}
                </div>

                <div
                    onClick={() => navigate('/learn')}
                    className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-emerald-100 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-semibold text-emerald-900 text-sm">Have Questions?</h4>
                            <p className="text-emerald-700 text-xs">Visit the Knowledge Hub for guides & FAQs</p>
                        </div>
                    </div>
                    <svg className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>

                <div className="pt-4 space-y-3">
                    <button
                        onClick={completeOnboarding}
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-lg shadow-gray-200 py-4 transition-all active:scale-[0.98]"
                    >
                        Go to Dashboard
                    </button>

                    <button
                        onClick={completeOnboarding}
                        className="w-full text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl font-medium py-3 transition-colors text-sm"
                    >
                        I have more assets to add
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Review & Confirm</h3>
                <p className="text-sm text-gray-500 mb-6">
                    We're ready to set up your dashboard.
                </p>
            </div>

            <div className="bg-white rounded-lg p-4 space-y-4 border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900">Preferences</span>
                        <span className="text-xs text-gray-500">
                            {data.methodology.madhab || 'Standard'}, {data.methodology.calendar}
                        </span>
                    </div>
                    <StatusIcon taskStatus={tasks.preferences} />
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900">Assets Setup</span>
                        <span className="text-xs text-gray-500">
                            {assetList.length} items to create
                            {existingAssets.length > 0 && ` + ${existingAssets.length} existing`}
                        </span>
                    </div>
                    <StatusIcon taskStatus={tasks.assets} />
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900">Liabilities Setup</span>
                        <span className="text-xs text-gray-500">
                            {liabilityList.length} items to create
                            {existingLiabilities.length > 0 && ` + ${existingLiabilities.length} existing`}
                        </span>
                    </div>
                    <StatusIcon taskStatus={tasks.liabilities} />
                </div>

                {existingZakatableAssets > 0 && (
                    <div className="bg-blue-50 p-2 rounded text-xs text-blue-800">
                        <span className="font-semibold">Note:</span> Your existing portfolio (${existingZakatableAssets.toLocaleString()}) will be included in your new Nisab record.
                    </div>
                )}

                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-900">Nisab Tracker</span>
                        <span className="text-xs text-gray-500">
                            Starting Hawl with {data.nisab.standard} standard
                        </span>
                    </div>
                    <StatusIcon taskStatus={tasks.hawl} />
                </div>
            </div>

            {error && (
                <div className="text-red-500 text-sm p-3 bg-red-50 rounded border border-red-100">
                    {error}
                </div>
            )}

            <div className="pt-4">
                <button
                    className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-lg shadow-emerald-200 py-3 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    onClick={handleFinish}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Setting up...' : 'Finish Setup'}
                </button>
            </div>
        </div>
    );
};
