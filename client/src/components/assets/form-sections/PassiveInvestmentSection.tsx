import React from 'react';
import { getPassiveInvestmentGuidance, getModifierBadge } from '../../../utils/assetModifiers';

interface PassiveInvestmentSectionProps {
    isPassiveInvestment: boolean;
    isRestrictedAccount: boolean;
    zakatEligible: boolean;
    onChange: (checked: boolean) => void;
}

export const PassiveInvestmentSection: React.FC<PassiveInvestmentSectionProps> = ({
    isPassiveInvestment,
    isRestrictedAccount,
    zakatEligible,
    onChange
}) => {
    return (
        <div className="border-s-4 border-border-strong bg-accent p-4 rounded">
            <label className="flex items-start">
                <input
                    type="checkbox"
                    id="isPassiveInvestment"
                    checked={isPassiveInvestment}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={isRestrictedAccount || !zakatEligible}
                    className="mt-1 rounded border-border-strong text-secondary shadow-sm focus:border-ring focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-describedby="passive-help"
                    aria-disabled={isRestrictedAccount || !zakatEligible}
                />
                <span className="ms-3">
                    <span className="text-sm font-medium text-foreground block">
                        Passive Investment (30% Rule)
                    </span>
                    <span className="text-xs text-muted-foreground block mt-1">
                        {getPassiveInvestmentGuidance()}
                    </span>
                </span>
            </label>
            {isRestrictedAccount && (
                <p className="mt-2 text-xs text-danger font-medium ms-6">
                    ⚠️ Cannot be marked as both passive and restricted
                </p>
            )}
            {isPassiveInvestment && (
                <div className="mt-2 ms-6 p-2 bg-accent rounded">
                    <p className="text-xs text-secondary">
                        📊 Modifier Applied: {getModifierBadge(0.3).text}
                    </p>
                </div>
            )}
            {!zakatEligible && (
                <p className="mt-2 text-xs text-muted-foreground ms-6">
                    ⚠️ Passive investments can only be marked when the asset is eligible for Zakat
                </p>
            )}
        </div>
    );
};
