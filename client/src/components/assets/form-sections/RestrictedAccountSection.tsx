import React from 'react';
import { getRestrictedAccountGuidance, getModifierBadge } from '../../../utils/assetModifiers';

interface RestrictedAccountSectionProps {
    isRestrictedAccount: boolean;
    onChange: (checked: boolean) => void;
}

export const RestrictedAccountSection: React.FC<RestrictedAccountSectionProps> = ({
    isRestrictedAccount,
    onChange
}) => {
    return (
        <div className="border-l-4 border-border-strong bg-surface-2 p-4 rounded">
            <label className="flex items-start">
                <input
                    type="checkbox"
                    id="isRestrictedAccount"
                    checked={isRestrictedAccount}
                    onChange={(e) => onChange(e.target.checked)}
                    className="mt-1 rounded border-border-strong text-muted-foreground shadow-sm focus:border-ring focus:ring-2 focus:ring-ring"
                    aria-describedby="restricted-help"
                />
                <span className="ml-3">
                    <span className="text-sm font-medium text-foreground block">
                        Zakat-Deferred (401k/IRA/HSA)
                    </span>
                    <span className="text-xs text-muted-foreground block mt-1">
                        {getRestrictedAccountGuidance()}
                    </span>
                </span>
            </label>
            {isRestrictedAccount && (
                <div className="mt-2 ml-6 p-2 bg-muted rounded">
                    <p className="text-xs text-foreground">
                        ⏸️ Modifier Applied: {getModifierBadge(0.0).text}
                    </p>
                </div>
            )}
        </div>
    );
};
