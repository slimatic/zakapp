import React from 'react';
import { Decimal } from 'decimal.js';

interface RetirementTreatmentSectionProps {
    retirementTreatment: string;
    value: string;
    calculationModifier: number;
    onTreatmentChange: (treatment: string) => void;
}

export const RetirementTreatmentSection: React.FC<RetirementTreatmentSectionProps> = ({
    retirementTreatment,
    value,
    calculationModifier,
    onTreatmentChange
}) => {
    return (
        <div className="bg-white/50 p-4 rounded-lg border border-blue-100/50 space-y-3">
            <p className="text-sm font-medium text-blue-900">Zakat Treatment:</p>

            <label className="flex items-start gap-3 cursor-pointer">
                <input
                    type="radio"
                    name="retirement-treatment"
                    checked={retirementTreatment === 'full'}
                    onChange={() => onTreatmentChange('full')}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div>
                    <span className="block text-sm font-medium text-gray-900">Full Assessment (100%)</span>
                </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
                <input
                    type="radio"
                    name="retirement-treatment"
                    checked={retirementTreatment === 'net_value'}
                    onChange={() => onTreatmentChange('net_value')}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div>
                    <span className="block text-sm font-medium text-gray-900">Deduct Taxes/Penalties (Net Value)</span>
                    <span className="block text-xs text-gray-500">Calculates zakat on ~70% of the value (after estimated taxes/fees).</span>
                </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
                <input
                    type="radio"
                    name="retirement-treatment"
                    checked={retirementTreatment === 'passive'}
                    onChange={() => onTreatmentChange('passive')}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div>
                    <span className="block text-sm font-medium text-gray-900">Passive Investment (30%)</span>
                    <span className="block text-xs text-gray-500">Treats underlying assets as passive/business assets (Zakatable on 30%).</span>
                </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
                <input
                    type="radio"
                    name="retirement-treatment"
                    checked={retirementTreatment === 'deferred'}
                    onChange={() => onTreatmentChange('deferred')}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div>
                    <span className="block text-sm font-medium text-gray-900">Deferred (Exempt)</span>
                    <span className="block text-xs text-gray-500">No Zakat due until withdrawal (based on lack of complete ownership/access).</span>
                </div>
            </label>

            {/* Modifier Summary */}
            {value && (
                <div className="mt-4 pt-4 border-t border-blue-100">
                    <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Original Value:</span>
                            <span className="font-medium text-gray-900">${parseFloat(String(value)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Modifier Applied:</span>
                            <span className="font-bold text-blue-600">{(calculationModifier * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-blue-200 pt-2">
                            <span className="font-medium text-gray-900">Zakatable Value:</span>
                            <span className="font-bold text-emerald-600">${(parseFloat(String(value)) * calculationModifier).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
