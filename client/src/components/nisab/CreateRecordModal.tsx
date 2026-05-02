/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AssetSelectionTable } from '../tracking/AssetSelectionTable';
import { LiabilitySelectionTable } from '../tracking/LiabilitySelectionTable';
import { DualCalendarDatePicker } from '../common/DualCalendarDatePicker';
import { Asset, Liability } from '../../types';
import { WealthCalculationResult } from '../../core/calculations/wealthCalculator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  allAssets: Asset[];
  allLiabilities: Liability[];
  selectedAssetIds: string[];
  selectedLiabilityIds: string[];
  onAssetSelectionChange: (ids: string[]) => void;
  onLiabilitySelectionChange: (ids: string[]) => void;
  creationDate: Date;
  onCreationDateChange: (date: Date) => void;
  nisabBasis: 'GOLD' | 'SILVER';
  onNisabBasisChange: (basis: 'GOLD' | 'SILVER') => void;
  previewCalculation: WealthCalculationResult;
  onSubmit: () => void;
  formatCurrency: (amount: number, currency?: string) => string;
  defaultNisabBasis?: 'GOLD' | 'SILVER';
}

export const CreateRecordModal: React.FC<Props> = ({
  isOpen,
  onClose,
  allAssets,
  allLiabilities,
  selectedAssetIds,
  selectedLiabilityIds,
  onAssetSelectionChange,
  onLiabilitySelectionChange,
  creationDate,
  onCreationDateChange,
  nisabBasis,
  onNisabBasisChange,
  previewCalculation,
  onSubmit,
  formatCurrency,
  defaultNisabBasis = 'GOLD',
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Auto-select defaults when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (selectedAssetIds.length === 0 && allAssets.length > 0) {
      const potentialZakatableTypes = ['CASH', 'GOLD', 'SILVER', 'CRYPTOCURRENCY', 'BUSINESS_ASSETS', 'INVESTMENT_ACCOUNT', 'STOCKS'];
      const defaultSelected = allAssets
        .filter(a => potentialZakatableTypes.includes(a.type) || a.zakatEligible)
        .map(a => a.id);
      onAssetSelectionChange(defaultSelected);
    }

    if (selectedLiabilityIds.length === 0 && allLiabilities.length > 0) {
      const hawlDurationMs = 355 * 24 * 60 * 60 * 1000;
      const cutoffDate = new Date(Date.now() + hawlDurationMs);
      const defaultLiabs = allLiabilities.filter(l => {
        const d = new Date(l.dueDate);
        return !isNaN(d.getTime()) && d <= cutoffDate && l.isActive;
      }).map(l => l.id);
      onLiabilitySelectionChange(defaultLiabs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, allAssets.length, allLiabilities.length]);

  // Reset step & nisab on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      onNisabBasisChange(defaultNisabBasis);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultNisabBasis]);

  const assetWealth = allAssets
    .filter(a => selectedAssetIds.includes(a.id))
    .reduce((sum, a) => sum + (Number(a.value) || 0), 0);

  const deductibleLiabilities = allLiabilities
    .filter(l => selectedLiabilityIds.includes(l.id))
    .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Create Nisab Record - Step ${step} of 3`} size="lg">
      {/* Step Indicator */}
      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-2">
          {step === 1 && "Confirm the assets to include in this Zakat year calculation."}
          {step === 2 && "Deduct valid liabilities to determine your net Zakatable wealth."}
          {step === 3 && "Review your configuration and set the Nisab Standard."}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>
      </div>

      <div className="space-y-6 pt-2 h-[60vh] overflow-y-auto">
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900">Inclusive Assets</h3>
              <span className="text-xs text-gray-500">{selectedAssetIds.length} selected</span>
            </div>
            <AssetSelectionTable
              assets={allAssets}
              initialSelection={selectedAssetIds}
              onSelectionChange={onAssetSelectionChange}
            />
            <div className="bg-blue-50 p-3 rounded text-xs text-blue-700">
              💰 Estimated Wealth: {formatCurrency(assetWealth)}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900">Deductible Liabilities</h3>
              <span className="text-xs text-gray-500">{selectedLiabilityIds.length} selected</span>
            </div>
            <LiabilitySelectionTable
              liabilities={allLiabilities}
              selectedLiabilityIds={selectedLiabilityIds}
              onSelectionChange={onLiabilitySelectionChange}
            />
            <div className="bg-amber-50 p-3 rounded text-xs text-amber-800 flex items-center gap-2">
              <span className="text-xl">📉</span>
              <div>
                <strong>Deductible Liabilities:</strong> {formatCurrency(deductibleLiabilities)}
                <br />
                <span className="opacity-75">Only debts due within the coming lunar year are deducted.</span>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
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
        {step > 1 ? (
          <Button variant="outline" onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}>
            ← Back
          </Button>
        ) : (<div />)}

        {step < 3 ? (
          <Button onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}>
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
