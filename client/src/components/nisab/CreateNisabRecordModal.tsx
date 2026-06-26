/**
 * Copyright (c) 2024 ZakApp Contributors
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
import { Asset, Liability } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AssetSelectionTable } from '../tracking/AssetSelectionTable';
import { LiabilitySelectionTable } from '../tracking/LiabilitySelectionTable';
import { DualCalendarDatePicker } from '../common/DualCalendarDatePicker';
import { calculateWealth } from '../../core/calculations/wealthCalculator';

interface CreateNisabRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Current wizard step (1: Assets, 2: Liabilities, 3: Confirm) */
  createStep: 1 | 2 | 3;
  onCreateStepChange: (step: 1 | 2 | 3) => void;
  /** All assets available for selection */
  allAssets: Asset[];
  /** All liabilities available for selection */
  allLiabilities: Liability[];
  /** Currently selected asset IDs */
  selectedAssetIds: string[];
  /** Callback when asset selection changes */
  onSelectedAssetIdsChange: (ids: string[]) => void;
  /** Currently selected liability IDs */
  selectedLiabilityIds: string[];
  /** Callback when liability selection changes */
  onSelectedLiabilityIdsChange: (ids: string[]) => void;
  /** Nisab basis (GOLD or SILVER) */
  nisabBasis: 'GOLD' | 'SILVER';
  /** Callback when nisab basis changes */
  onNisabBasisChange: (basis: 'GOLD' | 'SILVER') => void;
  /** Hawl start date */
  creationDate: Date;
  /** Callback when creation date changes */
  onCreationDateChange: (date: Date) => void;
  /** Callback when the user submits the final step */
  onSubmit: () => void;
  /** Format currency helper */
  formatCurrency: (amount: number, currency?: string) => string;
}

export const CreateNisabRecordModal: React.FC<CreateNisabRecordModalProps> = ({
  isOpen,
  onClose,
  createStep,
  onCreateStepChange,
  allAssets,
  allLiabilities,
  selectedAssetIds,
  onSelectedAssetIdsChange,
  selectedLiabilityIds,
  onSelectedLiabilityIdsChange,
  nisabBasis,
  onNisabBasisChange,
  creationDate,
  onCreationDateChange,
  onSubmit,
  formatCurrency,
}) => {
  // Calculated Preview for Create Modal
  const previewCalculation = React.useMemo(() => {
    const assets = allAssets.filter(a => selectedAssetIds.includes(a.id));
    const liabilities = allLiabilities.filter(l => selectedLiabilityIds.includes(l.id));
    return calculateWealth(assets, liabilities);
  }, [selectedAssetIds, selectedLiabilityIds, allAssets, allLiabilities]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Create Nisab Record - Step ${createStep} of 3`} size="lg">
      {/* Step Indicator */}
      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-2">
          {createStep === 1 && "Confirm the assets to include in this Zakat year calculation."}
          {createStep === 2 && "Deduct valid liabilities to determine your net Zakatable wealth."}
          {createStep === 3 && "Review your configuration and set the Nisab Standard."}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(createStep / 3) * 100}%` }}></div>
        </div>
      </div>

      <div className="space-y-6 pt-2 h-[60vh] overflow-y-auto">
        {createStep === 1 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900">Inclusive Assets</h3>
              <span className="text-xs text-gray-500">{selectedAssetIds.length} selected</span>
            </div>
            {/* Using Imported AssetSelectionTable */}
            <AssetSelectionTable
              assets={allAssets}
              initialSelection={selectedAssetIds}
              onSelectionChange={onSelectedAssetIdsChange}
            />
            <div className="bg-blue-50 p-3 rounded text-xs text-blue-700">
              💰 Estimated Wealth: {formatCurrency(allAssets.filter(a => selectedAssetIds.includes(a.id)).reduce((sum, a) => sum + (Number(a.value) || 0), 0))}
            </div>
          </div>
        )}

        {createStep === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900">Deductible Liabilities</h3>
              <span className="text-xs text-gray-500">{selectedLiabilityIds.length} selected</span>
            </div>
            <LiabilitySelectionTable
              liabilities={allLiabilities}
              selectedLiabilityIds={selectedLiabilityIds}
              onSelectionChange={onSelectedLiabilityIdsChange}
            />
            <div className="bg-amber-50 p-3 rounded text-xs text-amber-800 flex items-center gap-2">
              <span className="text-xl">📉</span>
              <div>
                <strong>Deductible Liabilities:</strong> {formatCurrency(allLiabilities.filter(l => selectedLiabilityIds.includes(l.id)).reduce((sum, l) => sum + (Number(l.amount) || 0), 0))}
                <br />
                <span className="opacity-75">Only debts due within the coming lunar year are deducted.</span>
              </div>
            </div>
          </div>
        )}

        {createStep === 3 && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded text-center">
                <span className="block text-xs text-gray-500 uppercase">Total Assets</span>
                <span className="block text-xl font-bold text-gray-900">{formatCurrency(previewCalculation.totalWealth)}</span>
              </div>
              <div className="bg-gray-50 p-4 rounded text-center border border-green-100 bg-green-50">
                <span className="block text-xs text-green-700 uppercase font-medium">Net Zakatable</span>
                <span className="block text-xl font-bold text-green-700">{formatCurrency(previewCalculation.netZakatableWealth)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <DualCalendarDatePicker
                label="Hawl Start Date"
                value={creationDate}
                onChange={onCreationDateChange}
                className="border-blue-100 bg-blue-50/50"
              />
            </div>

            {/* Nisab Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Select Nisab Standard</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`flex items-center justify-between p-4 rounded border cursor-pointer hover:bg-gray-50 transition-colors ${nisabBasis === 'GOLD' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200'}`}>
                  <div className="flex items-center">
                    <input type="radio" name="nisab" checked={nisabBasis === 'GOLD'} onChange={() => onNisabBasisChange('GOLD')} className="mr-3 h-4 w-4 text-blue-600" />
                    <div>
                      <span className="block font-medium text-gray-900">Gold Standard</span>
                      <span className="text-xs text-gray-500">For Wealthy/Safer</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-yellow-100 text-yellow-800 px-2 py-1 rounded">87.48g</span>
                </label>
                <label className={`flex items-center justify-between p-4 rounded border cursor-pointer hover:bg-gray-50 transition-colors ${nisabBasis === 'SILVER' ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200'}`}>
                  <div className="flex items-center">
                    <input type="radio" name="nisab" checked={nisabBasis === 'SILVER'} onChange={() => onNisabBasisChange('SILVER')} className="mr-3 h-4 w-4 text-blue-600" />
                    <div>
                      <span className="block font-medium text-gray-900">Silver Standard</span>
                      <span className="text-xs text-gray-500">For Low Income</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded">612.36g</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between w-full pt-4 border-t border-gray-100">
        {createStep > 1 ? (
          <Button variant="outline" onClick={() => onCreateStepChange((createStep - 1) as 1 | 2 | 3)}>
            ← Back
          </Button>
        ) : (<div />)}

        {createStep < 3 ? (
          <Button onClick={() => onCreateStepChange((createStep + 1) as 1 | 2 | 3)}>
            Next Step →
          </Button>
        ) : (
          <Button onClick={onSubmit} className="bg-green-600 hover:bg-green-700 text-white">
            Start Hawl Tracking
          </Button>
        )}
      </div>
    </Modal>
  );
};
