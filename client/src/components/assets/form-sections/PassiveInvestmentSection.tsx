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
        <div className="border-l-4 border-blue-300 bg-blue-50 p-4 rounded">
            <label className="flex items-start">
                <input
                    type="checkbox"
                    id="isPassiveInvestment"
                    checked={isPassiveInvestment}
                    onChange={(e) => onChange(e.target.checked)}
                    disabled={isRestrictedAccount || !zakatEligible}
                    className="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-describedby="passive-help"
                    aria-disabled={isRestrictedAccount || !zakatEligible}
                />
                <span className="ml-3">
                    <span className="text-sm font-medium text-gray-700 block">
                        Passive Investment (30% Rule)
                    </span>
                    <span className="text-xs text-gray-600 block mt-1">
                        {getPassiveInvestmentGuidance()}
                    </span>
                </span>
            </label>
            {isRestrictedAccount && (
                <p className="mt-2 text-xs text-red-600 font-medium ml-6">
                    ⚠️ Cannot be marked as both passive and restricted
                </p>
            )}
            {isPassiveInvestment && (
                <div className="mt-2 ml-6 p-2 bg-blue-100 rounded">
                    <p className="text-xs text-blue-700">
                        📊 Modifier Applied: {getModifierBadge(0.3).text}
                    </p>
                </div>
            )}
            {!zakatEligible && (
                <p className="mt-2 text-xs text-gray-600 ml-6">
                    ⚠️ Passive investments can only be marked when the asset is eligible for Zakat
                </p>
            )}
        </div>
    );
};
