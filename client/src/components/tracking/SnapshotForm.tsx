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

/**
 * SnapshotForm Component - T058
 * Form for creating/editing yearly snapshots with dual calendar support
 */

import React, { useState } from 'react';
import type { CreateYearlySnapshotDto, UpdateYearlySnapshotDto, YearlySnapshot } from '@zakapp/shared/types/tracking';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ErrorMessage } from '../ui/ErrorMessage';
import { formatDualCalendar, gregorianToHijri, hijriToGregorian } from '../../utils/calendarConverter';
import { DualCalendarDatePicker } from '../common/DualCalendarDatePicker';
import { toNumber, toDecimal, calculateZakat, calculateZakatableWealth } from '../../utils/precision';

interface SnapshotFormProps {
  snapshot?: YearlySnapshot; // For editing existing snapshot
  onSubmit: (data: CreateYearlySnapshotDto | UpdateYearlySnapshotDto) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  error?: string | null;
  submitButtonText?: string;
}

export const SnapshotForm: React.FC<SnapshotFormProps> = ({
  snapshot,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null,
  submitButtonText = 'Save Snapshot'
}) => {
  const isEditMode = !!snapshot;

  // Form state
  const [formData, setFormData] = useState({
    calculationDate: snapshot?.calculationDate ? new Date(snapshot.calculationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    gregorianYear: snapshot?.gregorianYear || new Date().getFullYear(),
    gregorianMonth: snapshot?.gregorianMonth || (new Date().getMonth() + 1),
    gregorianDay: snapshot?.gregorianDay || new Date().getDate(),
    hijriYear: snapshot?.hijriYear || gregorianToHijri(new Date()).hy,
    hijriMonth: snapshot?.hijriMonth || gregorianToHijri(new Date()).hm,
    hijriDay: snapshot?.hijriDay || gregorianToHijri(new Date()).hd,
    totalWealth: snapshot?.totalWealth || 0,
    totalLiabilities: snapshot?.totalLiabilities || 0,
    zakatableWealth: snapshot?.zakatableWealth || 0,
    zakatAmount: snapshot?.zakatAmount || 0,
    methodologyUsed: snapshot?.methodologyUsed || 'Standard' as const,
    nisabThreshold: snapshot?.nisabThreshold || 0,
    nisabType: snapshot?.nisabType || 'gold' as const,
    status: snapshot?.status || 'draft' as const,
    userNotes: snapshot?.userNotes || '',
    isPrimary: snapshot?.isPrimary || false
  });

  // Calendar sync state - Handled by DualCalendarDatePicker now
  // const [calendarLock, setCalendarLock] = useState<'gregorian' | 'hijri'>('gregorian');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate zakatable wealth when wealth or liabilities change
      // Using Decimal precision for accurate financial calculations
      if (field === 'totalWealth' || field === 'totalLiabilities') {
        updated.zakatableWealth = toNumber(
          calculateZakatableWealth(updated.totalWealth, updated.totalLiabilities)
        );
      }

      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate calculation date from form data
    const calculationDate = new Date(formData.gregorianYear, formData.gregorianMonth - 1, formData.gregorianDay);

    const submitData = {
      ...formData,
      calculationDate: calculationDate.toISOString()
    };

    onSubmit(submitData);
  };

  const handleCalculateZakat = () => {
    // Calculate Zakat at 2.5% of zakatable wealth (if above nisab)
    // Using Decimal.js for precision - critical for Islamic finance
    const meetsNisab = toDecimal(formData.zakatableWealth).gte(toDecimal(formData.nisabThreshold));
    const zakatAmount = meetsNisab
      ? toNumber(calculateZakat(formData.zakatableWealth))
      : 0;
    // Round to 2 decimal places for currency display
    handleInputChange('zakatAmount', Math.round(zakatAmount * 100) / 100);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditMode ? 'Edit Snapshot' : 'Create New Snapshot'}
        </h2>
        <p className="text-gray-600 mt-1">
          {isEditMode ? 'Update your Zakat calculation snapshot' : 'Record your annual Zakat calculation for historical tracking'}
        </p>
      </div>

      {error && (
        <div className="mb-6">
          <ErrorMessage error={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Dual Calendar Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <DualCalendarDatePicker
            label="Calculation Date"
            value={new Date(formData.gregorianYear, formData.gregorianMonth - 1, formData.gregorianDay)}
            onChange={(date) => {
              const hijri = gregorianToHijri(date);
              setFormData(prev => ({
                ...prev,
                calculationDate: date.toISOString().split('T')[0],
                gregorianYear: date.getFullYear(),
                gregorianMonth: date.getMonth() + 1,
                gregorianDay: date.getDate(),
                hijriYear: hijri.hy,
                hijriMonth: hijri.hm,
                hijriDay: hijri.hd
              }));
            }}
          />
        </div>

        {/* Financial Data Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Total Wealth"
              type="number"
              step="0.01"
              value={formData.totalWealth}
              onChange={(e) => handleInputChange('totalWealth', toNumber(e.target.value))}
              onFocus={(e) => e.target.select()}
              required

            />

            <Input
              label="Total Liabilities"
              type="number"
              step="0.01"
              value={formData.totalLiabilities}
              onChange={(e) => handleInputChange('totalLiabilities', toNumber(e.target.value))}
              onFocus={(e) => e.target.select()}
              required

            />

            <Input
              label="Zakatable Wealth"
              type="number"
              step="0.01"
              value={formData.zakatableWealth}
              onChange={(e) => handleInputChange('zakatableWealth', toNumber(e.target.value))}
              onFocus={(e) => e.target.select()}
              required

            />

            <div className="space-y-2">
              <Input
                label="Zakat Amount"
                type="number"
                step="0.01"
                value={formData.zakatAmount}
                onChange={(e) => handleInputChange('zakatAmount', toNumber(e.target.value))}
                onFocus={(e) => e.target.select()}
                required

              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleCalculateZakat}
                className="w-full"
              >
                Calculate 2.5%
              </Button>
            </div>

            <Input
              label="Nisab Threshold"
              type="number"
              step="0.01"
              value={formData.nisabThreshold}
              onChange={(e) => handleInputChange('nisabThreshold', toNumber(e.target.value))}
              onFocus={(e) => e.target.select()}
              required

            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nisab Type
              </label>
              <select
                value={formData.nisabType}
                onChange={(e) => handleInputChange('nisabType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="gold">Gold (87.48g)</option>
                <option value="silver">Silver (612.36g)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Methodology and Notes */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Methodology Used
              </label>
              <select
                value={formData.methodologyUsed}
                onChange={(e) => handleInputChange('methodologyUsed', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Standard">Standard</option>
                <option value="Hanafi">Hanafi</option>
                <option value="shafi">Shafi'i</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPrimary"
                checked={formData.isPrimary}
                onChange={(e) => handleInputChange('isPrimary', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="isPrimary" className="ml-2 block text-sm text-gray-900">
                Set as primary snapshot for this year
              </label>
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="userNotes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="userNotes"
              value={formData.userNotes}
              onChange={(e) => handleInputChange('userNotes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Add any notes about this calculation..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            isLoading={isLoading}
          >
            {submitButtonText || (isEditMode ? 'Update Snapshot' : 'Create Snapshot')}
          </Button>
        </div>
      </form>
    </div>
  );
};