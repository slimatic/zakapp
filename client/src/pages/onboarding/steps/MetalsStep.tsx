import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnboarding } from '../context/OnboardingContext';
import { useNisabThreshold } from '../../../hooks/useNisabThreshold';
import { useMaskedCurrency } from '../../../contexts/PrivacyContext';
import { formatCurrency as formatCurrencyCanonical } from '../../../utils/formatters';

export const MetalsStep: React.FC = () => {
  const { t } = useTranslation('onboarding');
    const { data, updateAsset, nextStep, prevStep } = useOnboarding();
    // Fetch metal prices in the USER's chosen currency (#310) — values entered
    // during onboarding are saved in that currency, so USD prices would misstate wealth.
    const userCurrency = data.settings?.currency || 'USD';
    const { goldPrice, silverPrice, isLoading } = useNisabThreshold(userCurrency, 'GOLD');
    const maskedCurrency = useMaskedCurrency();

    // Auto-calculate values when grams change
    useEffect(() => {
        if (data.assets.gold.grams && goldPrice) {
            updateAsset('gold', { value: data.assets.gold.grams * goldPrice });
        }
    }, [data.assets.gold.grams, goldPrice]);

    useEffect(() => {
        if (data.assets.silver.grams && silverPrice) {
            updateAsset('silver', { value: data.assets.silver.grams * silverPrice });
        }
    }, [data.assets.silver.grams, silverPrice]);


    const handleGramsChange = (asset: 'gold' | 'silver', gramsStr: string) => {
        const grams = parseFloat(gramsStr) || 0;
        const price = asset === 'gold' ? goldPrice : silverPrice;

        updateAsset(asset, {
            grams,
            enabled: grams > 0,
            value: grams * (price || 0)
        });
    };

    const formatCurrency = (val: number) => {
        return formatCurrencyCanonical(val, data.settings?.currency || 'USD');
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{t('steps.metals.title')}</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Gold & Silver. Enter the weight you own. You don't need to be exact right now—you can always update this later in your Assets Dashboard.
                </p>

                <div className="space-y-6">
                    {/* Gold Input */}
                    <div className="bg-warn-soft rounded-xl p-5 border border-warn/30">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-warn-strong font-medium flex items-center gap-2">
                                <span className="bg-warn-soft p-1.5 rounded-lg text-warn-strong">🏆</span>
                                Gold (24k)
                            </label>
                            <span className="text-xs font-mono bg-warn-soft text-warn-strong px-2 py-1 rounded">
                                Live: {isLoading ? '...' : formatCurrency(goldPrice || 0)}/g · {userCurrency}
                            </span>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs text-warn-strong mb-1">Weight (Grams)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0 g"
                                    className="w-full rounded-lg border-warn/40 focus:ring-warn focus:border-warn"
                                    value={data.assets.gold.grams || ''}
                                    onChange={(e) => handleGramsChange('gold', e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-warn-strong mb-1">Value</label>
                                <div className="w-full h-10 px-3 py-2 bg-warn-soft/50 rounded-lg border border-warn/30 text-warn-strong font-medium flex items-center">
                                    {maskedCurrency(formatCurrency(data.assets.gold.value || 0))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Silver Input */}
                    <div className="bg-surface-2 rounded-xl p-5 border border-border">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-foreground font-medium flex items-center gap-2">
                                <span className="bg-border-strong p-1.5 rounded-lg text-foreground">🥈</span>
                                Silver
                            </label>
                            <span className="text-xs font-mono bg-border-strong text-foreground px-2 py-1 rounded">
                                Live: {isLoading ? '...' : formatCurrency(silverPrice || 0)}/g
                            </span>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs text-muted-foreground mb-1">Weight (Grams)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0 g"
                                    className="w-full rounded-lg border-border-strong focus:ring-ring focus:border-ring"
                                    value={data.assets.silver.grams || ''}
                                    onChange={(e) => handleGramsChange('silver', e.target.value)}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs text-muted-foreground mb-1">Value</label>
                                <div className="w-full h-10 px-3 py-2 bg-muted rounded-lg border border-border text-foreground font-medium flex items-center">
                                    {maskedCurrency(formatCurrency(data.assets.silver.value || 0))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-8">
                <button
                    onClick={prevStep}
                    className="px-6 py-3 text-muted-foreground font-medium hover:text-foreground transition-colors"
                >
                    Back
                </button>
                <button
                    onClick={nextStep}
                    className="px-8 py-3 bg-secondary text-secondary-foreground rounded-xl font-semibold shadow-elev-2 hover:bg-secondary/90 transition-all"
                >
                    Next: Cash
                </button>
            </div>
        </div>
    );
};
