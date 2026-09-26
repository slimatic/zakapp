import { logger } from '../../../utils/logger';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { getCurrencySymbol, formatCurrency as formatCurrencyCanonical } from '../../../utils/formatters';
import toast from 'react-hot-toast';

export const ZakatSetupStep: React.FC = () => {
  const { t } = useTranslation('onboarding');
    const { data } = useOnboarding();
    const { user, updateLocalProfile } = useAuth();
    const { assets: dbAssets, isLoading: isLoadingAssets } = useAssetRepository();
    const { liabilities: dbLiabilities, isLoading: isLoadingLiabilities } = useLiabilityRepository();
    const { addRecord } = useNisabRecordRepository();
    const { addPayment } = usePaymentRepository();
    const nisabBasis = (data.nisab.standard || 'GOLD').toUpperCase() as 'GOLD' | 'SILVER';
    // Use the user's chosen currency for nisab (#310) — onboarding saves asset
    // values in that currency, so the threshold must be in the same currency.
    const onboardingCurrency = data.settings?.currency || 'USD';
    const { nisabAmount, goldPrice, silverPrice } = useNisabThreshold(onboardingCurrency, nisabBasis);
    const navigate = useNavigate();
    const currencySymbol = getCurrencySymbol((data.settings?.currency || 'USD') as any);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [zakatPaid, setZakatPaid] = useState<number>(0);
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
            logger.debug('[ZakatSetupStep] Creating record with basis:', basis, 'from:', data.nisab);

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
                // The wizard asks only for an amount, so it knows nothing about
                // who received it. `fisabilillah` is the canonical category that
                // covers a general charitable payment — 'general' was not one of
                // the eight the server accepts, so this payment was stored
                // locally and then REJECTED on sync (see #521).
                //
                // recipientName stays as the sender's own description because no
                // recipient was named; the user can correct it in the payment
                // record, which is better than inventing a recipient here.
                await addPayment({
                    amount: zakatPaid,
                    paymentDate: new Date().toISOString(),
                    paymentMethod: 'other',
                    notes: 'Initial payment recorded during setup. Recipient not specified — recorded under fisabilillah (in the cause of Allah). Edit this record if you know the recipient.',
                    snapshotId: record.id,
                    recipientName: 'Self-Reported',
                    recipientType: 'individual' as const,
                    recipientCategory: 'fisabilillah' as const
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

            navigate('/dashboard');

        } catch (error: any) {
            console.error("Zakat Setup Failed", error);
            toast.error(`Error: ${error.message}`, { id: toastId });
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (val: number) =>
        formatCurrencyCanonical(val, user?.settings?.currency || 'USD');

    if (isLoadingAssets || !estimates) {
        return <div className="p-8 text-center text-muted-foreground">{t('steps.zakatSetup.loadingAssets')}</div>;
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent mb-6">
                    <span className="text-3xl">🧮</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{t('steps.zakatSetup.title')}</h2>
                <p className="text-muted-foreground max-w-lg mx-auto">
                    We've saved your assets. Now, let's initialize your Zakat Year (Hawl) and record any payments you've already made.
                </p>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="bg-muted px-6 py-4 border-b border-border flex justify-between items-center">
                    <h3 className="font-semibold text-foreground">{t('steps.zakatSetup.portfolioSummary')}</h3>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{t('steps.zakatSetup.sourceDatabase')}</span>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t('steps.zakatSetup.totalAssets')}</span>
                        <span className="font-medium text-foreground">{formatCurrency(estimates.totalWealth)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Liabilities</span>
                        <span className="font-medium text-danger">-{formatCurrency(estimates.totalLiabilities)}</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between items-center">
                        <span className="text-foreground font-medium">{t('steps.zakatSetup.netZakatableWealth')}</span>
                        <span className="font-bold text-secondary text-lg">{formatCurrency(estimates.netZakatable)}</span>
                    </div>
                </div>
            </div>

            <div className="bg-secondary rounded-2xl p-8 text-center text-secondary-foreground shadow-elev-3">
                <p className="text-secondary-foreground font-medium mb-1">{t('steps.zakatSetup.estimatedZakatDue')}</p>
                <div className="text-4xl font-bold mb-2">
                    {formatCurrency(estimates.totalZakatDue)}
                </div>
                <div className="text-sm text-secondary-foreground/90 mt-4 bg-secondary/30 py-2 px-4 rounded-lg inline-block">
                    Your Hawl (Year) starts today. You can pay this anytime over the coming year.
                </div>
            </div>

            {/* Payment Input */}
            <div className="bg-card rounded-xl border border-border p-6">
                <label className="block text-sm font-medium text-foreground/80 mb-3">
                    Have you already paid any Zakat for this period?
                </label>
                <div className="relative rounded-md shadow-sm max-w-md mx-auto">
                    <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none">
                        <span className="text-muted-foreground sm:text-sm">{currencySymbol}</span>
                    </div>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={zakatPaid || ''}
                        onChange={(e) => setZakatPaid(parseFloat(e.target.value) || 0)}
                        className="focus:ring-ring focus:border-ring block w-full ps-7 pe-12 sm:text-sm border-border-strong rounded-md py-3"
                        placeholder="0.00"
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                    We'll record this as a payment against your new Nisab Record.
                </p>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleFinish}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-12 py-4 bg-secondary text-secondary-foreground rounded-xl font-semibold shadow-elev-2 hover:bg-secondary/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting ? 'Finalizing...' : 'Finish & Go to Dashboard →'}
                </button>
            </div>
        </div>
    );
};
