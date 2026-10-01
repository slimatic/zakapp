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
            <div className="mt-2 ms-6 p-2 bg-warn-soft border border-warn/40 rounded text-warn-strong text-xs flex gap-2">
                <span className="text-lg">⚠️</span>
                <span>
                    <strong>Warning:</strong> Do not include the value of precious stones (diamonds, rubies, pearls) in your calculation.
                    <br />Only input the value or weight of the Gold and Silver content.
                </span>
            </div>

            {/* Smart Guidance for Jewelry */}
            {zakatEligible && isJewelryExemptMethodology && (
                <div className="mt-2 ms-6 p-2 bg-warn-soft border border-warn/30 rounded text-warn-strong text-xs flex gap-2 animate-pulse">
                    <span className="text-lg">ℹ️</span>
                    <span>
                        <strong>Note:</strong> Under the <strong>{methodologyName}</strong> school, personal jewelry is typically <strong>exempt</strong> from Zakat.
                        <br />Only keep this checked if the jewelry is for <strong>investment</strong> or <strong>trade</strong> purposes.
                    </span>
                </div>
            )}

            {/* Show inverse guidance: If UNCHECKED but methodology says it SHOULD be checked (rare, e.g. Hanafi) */}
            {!zakatEligible && !isJewelryExemptMethodology && (
                <div className="mt-2 ms-6 p-2 bg-accent border border-border rounded text-secondary text-xs flex gap-2">
                    <span className="text-lg">ℹ️</span>
                    <span>
                        <strong>Note:</strong> Under the <strong>{methodologyName}</strong> school, jewelry is typically <strong>Zakatable</strong>.
                        <br />You have manually exempted this (personal use?).
                    </span>
                </div>
            )}

            {/* Guidance for Auto-Exempted Assets */}
            {!zakatEligible && isJewelryExemptMethodology && !isEligibilityManual && (
                <div className="mt-2 ms-6 p-2 bg-surface-2 border border-border rounded text-foreground text-xs flex gap-2">
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
