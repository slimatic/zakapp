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

interface JewelryGuidanceProps {
    zakatEligible: boolean;
    isEligibilityManual: boolean;
    isJewelryExemptMethodology: boolean;
    methodologyName: string;
}

export const JewelryGuidance: React.FC<JewelryGuidanceProps> = ({
    zakatEligible,
    isEligibilityManual,
    isJewelryExemptMethodology,
    methodologyName
}) => {
    return (
        <>
            {/* Smart Guidance for Jewelry */}
            {zakatEligible && isJewelryExemptMethodology && (
                <div className="mt-2 ml-6 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs flex gap-2 animate-pulse">
                    <span className="text-lg">ℹ️</span>
                    <span>
                        <strong>Note:</strong> Under the <strong>{methodologyName}</strong> school, personal jewelry is typically <strong>exempt</strong> from Zakat.
                        <br />Only keep this checked if the jewelry is for <strong>investment</strong> or <strong>trade</strong> purposes.
                    </span>
                </div>
            )}

            {/* Show inverse guidance: If UNCHECKED but methodology says it SHOULD be checked (rare, e.g. Hanafi) */}
            {!zakatEligible && !isJewelryExemptMethodology && (
                <div className="mt-2 ml-6 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-xs flex gap-2">
                    <span className="text-lg">ℹ️</span>
                    <span>
                        <strong>Note:</strong> Under the <strong>{methodologyName}</strong> school, jewelry is typically <strong>Zakatable</strong>.
                        <br />You have manually exempted this (personal use?).
                    </span>
                </div>
            )}

            {/* Guidance for Auto-Exempted Assets */}
            {!zakatEligible && isJewelryExemptMethodology && !isEligibilityManual && (
                <div className="mt-2 ml-6 p-2 bg-gray-50 border border-gray-200 rounded text-gray-700 text-xs flex gap-2">
                    <span className="text-lg">ℹ️</span>
                    <span>
                        <strong>Note:</strong> This asset is set to <strong>Exempt</strong> based on <strong>{methodologyName}</strong> rules regarding personal jewelry.
                        <br />Check the "Zakat eligible" box if this jewelry is for investment/trade.
                    </span>
                </div>
            )}
        </>
    );
};
