import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useAssetRepository } from '../../../hooks/useAssetRepository';
import { useNisabRecordRepository } from '../../../hooks/useNisabRecordRepository';
import { useLiabilityRepository } from '../../../hooks/useLiabilityRepository';
import { usePaymentRepository } from '../../../hooks/usePaymentRepository';
import { useNisabThreshold } from '../../../hooks/useNisabThreshold';
import { calculateWealth } from '../../../core/calculations/wealthCalculator';
import { gregorianToHijri } from '../../../utils/calendarConverter';
import { useOnboarding } from '../context/OnboardingContext';
import { getCurrencySymbol } from '../../../utils/formatters';
import toast from 'react-hot-toast';

export const ZakatSetupStep: React.FC = () => {
    const { data } = useOnboarding();
    const { user, updateLocalProfile } = useAuth();
    const { assets: dbAssets, isLoading: isLoadingAssets } = useAssetRepository();
    const { liabilities: dbLiabilities, isLoading: isLoadingLiabilities } = useLiabilityRepository();
    const { addRecord } = useNisabRecordRepository();
    const { addPayment } = usePaymentRepository();
    const nisabBasis = (data.nisab.standard || 'GOLD').toUpperCase() as 'GOLD' | 'SILVER';
    const { nisabAmount, goldPrice, silverPrice } = useNisabThreshold('USD', nisabBasis);
    const navigate = useNavigate();
    const currencySymbol = getCurrencySymbol((data.settings?.currency || 'USD') as any);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [zakatPaid, setZakatPaid] = useState<number>(0);
    const [setupCompleted, setSetupCompleted] = useState(false);
    const [estimates, setEstimates] = useState<any>(null);

    // Calculate Estimates based on SAVED DB Data
    useEffect(() => {
        if (!isLoadingAssets && !isLoadingLiabilities) {
            // Handle empty assets case - set default zero estimates
            if (dbAssets.length === 0) {
                setEstimates({
                    totalWealth: 0,
                    zakatableWealth: 0,
                    totalLiabilities: 0,
                    netZakatable: 0,
                    totalZakatDue: 0
                });
                return;
            }

            // Original logic for when assets exist
            const activeAssets = dbAssets.filter(a => a.isActive);
            const wealthStats = calculateWealth(
                activeAssets,
                [],
                new Date(),
                (user?.settings?.preferredMethodology || 'STANDARD') as any
            );

            // Calculate Liabilities (Manual sum as specific hook might return different structure, but assuming array)
            // Note: LiabilityRepo typically exposes `liabilities` array
            const totalLiabilities = dbLiabilities.reduce((sum, l) => sum + (l.amount || 0), 0);

            const netZakatable = Math.max(0, wealthStats.zakatableWealth - totalLiabilities);
            const totalZakatDue = netZakatable * 0.025;

            setEstimates({
                totalWealth: wealthStats.totalWealth,
                zakatableWealth: wealthStats.zakatableWealth,
                totalLiabilities,
                netZakatable,
                totalZakatDue
            });
        }
    }, [dbAssets, dbLiabilities, isLoadingAssets, isLoadingLiabilities, user?.settings?.preferredMethodology]);

    const handleFinish = async () => {
        setIsSubmitting(true);
        const toastId = toast.loading('Initializing your Zakat Year...');

        try {
            // 1. Create Nisab Record
            const hawlStartDate = new Date();
            const hawlEndDate = new Date();
            hawlEndDate.setDate(hawlStartDate.getDate() + 354);
            const startHijri = gregorianToHijri(hawlStartDate);

            // Double check validation
            if (!estimates) throw new Error("Please wait for calculations to finish");

            const basis = (data.nisab.standard || 'GOLD').toUpperCase() as 'GOLD' | 'SILVER';
            console.log('[ZakatSetupStep] Creating record with basis:', basis, 'from:', data.nisab);

            const record = await addRecord({
                hawlStartDate: hawlStartDate.toISOString(),
                hawlCompletionDate: hawlEndDate.toISOString(),
                status: 'DRAFT',
                hijriYear: startHijri.hy,
                nisabBasis: basis,
                totalWealth: estimates.totalWealth,
                zakatableWealth: estimates.netZakatable,
                totalLiabilities: estimates.totalLiabilities,
                zakatAmount: estimates.totalZakatDue,
                nisabThresholdAtStart: (nisabAmount || 0).toString(),
                userNotes: 'Initial record created from Onboarding Wizard',
                currency: data.settings?.currency || 'USD',
                calculationDetails: JSON.stringify({
                    method: 'onboarding_wizard_v2',
                    prices: { gold: goldPrice, silver: silverPrice }
                })
            });

            // 2. Record Payment if entered
            if (zakatPaid > 0 && record) {
                await addPayment({
                    amount: zakatPaid,
                    paymentDate: new Date().toISOString(),
                    paymentMethod: 'other',
                    notes: 'Initial payment recorded during setup',
                    snapshotId: record.id,
                    recipientName: 'Self-Reported',
                    recipientCategory: 'general'
                });
            }

            // 3. Mark Complete
            // 3. Mark Complete and Save Preferences
            await updateLocalProfile({
                isSetupCompleted: true,
                settings: {
                    ...user?.settings,
                    preferredMethodology: data.methodology.madhab,
                    preferredCalendar: data.methodology.calendar === 'lunar' ? 'hijri' : 'gregorian',
                    currency: data.settings.currency,
                    preferredNisabStandard: data.nisab.standard.toUpperCase() as 'GOLD' | 'SILVER'
                }
            });

            // Legacy fallback
            localStorage.setItem(`zakapp_local_prefs_${user?.id}`, JSON.stringify({
                skipped: false,
                completedAt: new Date().toISOString()
            }));

            toast.success('All Set!', { id: toastId });
            setSetupCompleted(true);

            navigate('/dashboard');

        } catch (error: any) {
            console.error("Zakat Setup Failed", error);
            toast.error(`Error: ${error.message}`, { id: toastId });
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: user?.settings?.currency || 'USD' }).format(val);

    if (isLoadingAssets || !estimates) {
        return <div className="p-8 text-center text-gray-500">Loading your assets...</div>;
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-6">
                    <span className="text-3xl">🧮</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Zakat Overview</h2>
                <p className="text-gray-500 max-w-lg mx-auto">
                    We've saved your assets. Now, let's initialize your Zakat Year (Hawl) and record any payments you've already made.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Your Portfolio Summary</h3>
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Source: Database</span>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Assets</span>
                        <span className="font-medium text-gray-900">{formatCurrency(estimates.totalWealth)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Liabilities</span>
                        <span className="font-medium text-red-600">-{formatCurrency(estimates.totalLiabilities)}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                        <span className="text-gray-900 font-medium">Net Zakatable Wealth</span>
                        <span className="font-bold text-emerald-700 text-lg">{formatCurrency(estimates.netZakatable)}</span>
                    </div>
                </div>
            </div>

            <div className="bg-emerald-600 rounded-2xl p-8 text-center text-white shadow-xl shadow-emerald-200">
                <p className="text-emerald-100 font-medium mb-1">Estimated Zakat Due</p>
                <div className="text-4xl font-bold mb-2">
                    {formatCurrency(estimates.totalZakatDue)}
                </div>
                <div className="text-sm text-emerald-100 opacity-90 mt-4 bg-emerald-700/30 py-2 px-4 rounded-lg inline-block">
                    Your Hawl (Year) starts today. You can pay this anytime over the coming year.
                </div>
            </div>

            {/* Payment Input */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    Have you already paid any Zakat for this period?
                </label>
                <div className="relative rounded-md shadow-sm max-w-md mx-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">{currencySymbol}</span>
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
                <p className="text-xs text-gray-500 mt-2 text-center">
                    We'll record this as a payment against your new Nisab Record.
                </p>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleFinish}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-12 py-4 bg-emerald-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? 'Finalizing...' : 'Finish & Go to Dashboard →'}
                </button>
            </div>
        </div>
    );
};
