import React, { useState, useEffect } from 'react';
import { Decimal } from 'decimal.js';
import type { RetirementMethodology, RetirementConfig } from '../../../types/asset.types';
import { formatCurrency } from '../../../utils/formatters';

interface RetirementTreatmentSectionProps {
    retirementConfig?: RetirementConfig;
    value: string;
    /**
     * The asset's own currency. Required, not optional — see the note on the preview
     * block below for why defaulting this was the bug.
     */
    currency: string;
    onConfigChange: (config: RetirementConfig | undefined) => void;
}

// Tax bracket options (simplified from full table)
const TAX_BRACKET_OPTIONS = [
    { value: 0.10, label: '10%' },
    { value: 0.12, label: '12%' },
    { value: 0.22, label: '22%' },
    { value: 0.24, label: '24%' },
    { value: 0.32, label: '32%' },
    { value: 0.35, label: '35%' },
    { value: 0.37, label: '37%' },
];

// Penalty rate options
const PENALTY_OPTIONS = [
    { value: 0.0, label: '0%' },
    { value: 0.10, label: '10%' },
    { value: 0.20, label: '20%' },
    { value: 0.30, label: '30%' },
    { value: 0.35, label: '35%' },
];

export const RetirementTreatmentSection: React.FC<RetirementTreatmentSectionProps> = ({
    retirementConfig,
    value,
    currency,
    onConfigChange
}) => {
    const [methodology, setMethodology] = useState<RetirementMethodology>(
        retirementConfig?.methodology || 'collectible_value'
    );
    const [withdrawalPenalty, setWithdrawalPenalty] = useState<number>(
        retirementConfig?.withdrawalPenalty ?? 0.10
    );
    const [estimatedTaxRate, setEstimatedTaxRate] = useState<number>(
        retirementConfig?.estimatedTaxRate ?? 0.25
    );

    // Update parent when values change
    useEffect(() => {
        if (methodology === 'manual') {
            onConfigChange(undefined);
        } else if (methodology === 'preserved_growth') {
            onConfigChange({
                methodology: 'preserved_growth',
                withdrawalPenalty: 0,
                estimatedTaxRate: 0,
            });
        } else {
            // collectible_value
            onConfigChange({
                methodology: 'collectible_value',
                withdrawalPenalty,
                estimatedTaxRate,
            });
        }
    }, [methodology, withdrawalPenalty, estimatedTaxRate]);

    // Calculate preview values
    const numericValue = parseFloat(String(value)) || 0;
    const gross = new Decimal(numericValue);

    let zatakatableValue = gross;
    let zatakatRate = 0.025;
    let explanation = '';

    if (methodology === 'preserved_growth') {
        // 0.5% rule
        zatakatableValue = gross.times(0.20); // 20% is equivalent to 0.5% vs 2.5%
        zatakatRate = 0.005;
        explanation = 'Based on Dr. Salah Al-Sawy\'s opinion: Zakat is due on the liquid assets of the underlying companies (0.5% of total).';
    } else if (methodology === 'collectible_value') {
        // Net after penalty/tax * 2.5%
        const penalty = new Decimal(withdrawalPenalty);
        const tax = new Decimal(estimatedTaxRate);
        const netFactor = Decimal.max(0, new Decimal(1).minus(penalty).minus(tax));
        zatakatableValue = gross.times(netFactor);
        explanation = `Zakat is due only on what you would receive after paying ${(withdrawalPenalty * 100).toFixed(0)}% penalty and ${(estimatedTaxRate * 100).toFixed(0)}% taxes.`;
    } else {
        explanation = 'Standard 2.5% Zakat applied to the full balance.';
    }

    const zatakatDue = zatakatableValue.times(zatakatRate);

    return (
        <div className="bg-card/50 p-4 rounded-lg border border-border/50 space-y-4">
            <div>
                <p className="text-sm font-medium text-secondary mb-2">How should we calculate Zakat on this retirement account?</p>
                <p className="text-xs text-muted-foreground mb-4">
                    Based on scholarly analysis of US retirement plans
                </p>
            </div>

            {/* Option 1: Collectible Value */}
            <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border-2 transition-colors ${
                methodology === 'collectible_value' ? 'border-secondary bg-accent' : 'border-border hover:border-border-strong'
            }`}>
                <input
                    type="radio"
                    name="retirement-methodology"
                    checked={methodology === 'collectible_value'}
                    onChange={() => setMethodology('collectible_value')}
                    className="mt-1 h-4 w-4 text-secondary focus:ring-ring border-border-strong"
                />
                <div className="flex-1">
                    <span className="block text-sm font-medium text-foreground">Option 1: Withdrawal Value (Conservative)</span>
                    <span className="block text-xs text-muted-foreground mt-1">
                        Best if you plan to cash out soon. We calculate the value after taxes & penalties.
                    </span>

                    {methodology === 'collectible_value' && (
                        <div className="mt-3 space-y-3 ps-2 border-l-2 border-border-strong">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">
                                        Early Withdrawal Penalty
                                    </label>
                                    <select
                                        value={withdrawalPenalty}
                                        onChange={(e) => setWithdrawalPenalty(parseFloat(e.target.value))}
                                        className="w-full text-sm px-2 py-1.5 border border-border-strong rounded focus:ring-1 focus:ring-ring"
                                    >
                                        {PENALTY_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-foreground mb-1">
                                        Estimated Tax Rate
                                    </label>
                                    <select
                                        value={estimatedTaxRate}
                                        onChange={(e) => setEstimatedTaxRate(parseFloat(e.target.value))}
                                        className="w-full text-sm px-2 py-1.5 border border-border-strong rounded focus:ring-1 focus:ring-ring"
                                    >
                                        {TAX_BRACKET_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground italic">
                                {(withdrawalPenalty * 100).toFixed(0)}% penalty + {(estimatedTaxRate * 100).toFixed(0)}% tax = {(gross.minus(gross.times(withdrawalPenalty + estimatedTaxRate)).div(gross).times(100).toNumber()).toFixed(0)}% net
                            </p>
                        </div>
                    )}
                </div>
            </label>

            {/* Option 2: Preserved Growth */}
            <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border-2 transition-colors ${
                methodology === 'preserved_growth' ? 'border-secondary bg-accent' : 'border-border hover:border-border-strong'
            }`}>
                <input
                    type="radio"
                    name="retirement-methodology"
                    checked={methodology === 'preserved_growth'}
                    onChange={() => setMethodology('preserved_growth')}
                    className="mt-1 h-4 w-4 text-secondary focus:ring-ring border-border-strong"
                />
                <div>
                    <span className="block text-sm font-medium text-foreground">Option 2: Invested Growth (0.5% Rule)</span>
                    <span className="block text-xs text-muted-foreground mt-1">
                        Follows the opinion of Dr. Salah Al-Sawy. Assumes Zakat is due on the liquid assets of the companies you hold.
                    </span>
                </div>
            </label>

            {/* Option 3: Manual (Standard) */}
            <label className={`flex items-start gap-3 cursor-pointer p-3 rounded-lg border-2 transition-colors ${
                methodology === 'manual' ? 'border-secondary bg-accent' : 'border-border hover:border-border-strong'
            }`}>
                <input
                    type="radio"
                    name="retirement-methodology"
                    checked={methodology === 'manual'}
                    onChange={() => setMethodology('manual')}
                    className="mt-1 h-4 w-4 text-secondary focus:ring-ring border-border-strong"
                />
                <div>
                    <span className="block text-sm font-medium text-foreground">Option 3: Standard Calculation</span>
                    <span className="block text-xs text-muted-foreground mt-1">
                        Apply standard 2.5% Zakat to the full balance (default behavior).
                    </span>
                </div>
            </label>

            {/* Calculation Preview */}
            {value && numericValue > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                    <div className="bg-accent rounded-lg p-3 space-y-2">
                        {/* All three figures render in the ASSET'S currency.
                            They previously used a hardcoded "$" and
                            toLocaleString('en-US'), so an asset recorded in IDR had its
                            values labelled and grouped as US dollars — "Rp 50,000,000"
                            displayed as "$50,000,000". The asset's currency is stored
                            correctly; only the preview was wrong. */}
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Original Balance:</span>
                            <span className="font-medium text-foreground">{formatCurrency(numericValue, currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Zakatable Amount:</span>
                            <span className="font-bold text-secondary">{formatCurrency(zatakatableValue.toNumber(), currency)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Zakat Rate:</span>
                            <span className="font-medium text-foreground">{(zatakatRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-border pt-2">
                            <span className="font-medium text-foreground">Zakat Due:</span>
                            <span className="font-bold text-secondary">{formatCurrency(zatakatDue.toNumber(), currency)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                            💡 {explanation}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
