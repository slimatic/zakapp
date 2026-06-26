/**
 * Copyright (c) 2024-2026 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

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
        <div className="border-l-4 border-gray-300 bg-gray-50 p-4 rounded">
            <label className="flex items-start">
                <input
                    type="checkbox"
                    id="isRestrictedAccount"
                    checked={isRestrictedAccount}
                    onChange={(e) => onChange(e.target.checked)}
                    className="mt-1 rounded border-gray-300 text-gray-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    aria-describedby="restricted-help"
                />
                <span className="ml-3">
                    <span className="text-sm font-medium text-gray-700 block">
                        Zakat-Deferred (401k/IRA/HSA)
                    </span>
                    <span className="text-xs text-gray-600 block mt-1">
                        {getRestrictedAccountGuidance()}
                    </span>
                </span>
            </label>
            {isRestrictedAccount && (
                <div className="mt-2 ml-6 p-2 bg-gray-100 rounded">
                    <p className="text-xs text-gray-700">
                        ⏸️ Modifier Applied: {getModifierBadge(0.0).text}
                    </p>
                </div>
            )}
        </div>
    );
};
