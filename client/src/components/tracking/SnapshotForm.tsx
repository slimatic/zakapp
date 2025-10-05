/**
 * SnapshotForm Component - T058
 * Form for creating/editing yearly snapshots with dual calendar support
 */

import React, { useState } from 'react';
import { clsx } from 'clsx';
import type { CreateYearlySnapshotDto, UpdateYearlySnapshotDto, YearlySnapshot } from '@zakapp/shared/types/tracking';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { formatDualCalendar, gregorianToHijri, hijriToGregorian } from '../../utils/calendarConverter';

interface SnapshotFormProps {
  snapshot?: YearlySnapshot; // For editing existing snapshot
  onSubmit: (data: CreateYearlySnapshotDto | UpdateYearlySnapshotDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const SnapshotForm: React.FC<SnapshotFormProps> = ({
  snapshot,
  onSubmit,
  onCancel,
  isLoading = false,
  error = null
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

  // Calendar sync state
  const [calendarLock, setCalendarLock] = useState<'gregorian' | 'hijri'>('gregorian');

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Sync calendars when date changes
  const handleDateChange = (calendar: 'gregorian' | 'hijri', field: string, value: number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      try {
        if (calendar === 'gregorian' && calendarLock === 'gregorian') {
          // Update Hijri based on Gregorian
          const gregorianDate = new Date(updated.gregorianYear, updated.gregorianMonth - 1, updated.gregorianDay);
          const hijriDate = gregorianToHijri(gregorianDate);
          updated.hijriYear = hijriDate.hy;
          updated.hijriMonth = hijriDate.hm;
          updated.hijriDay = hijriDate.hd;
        } else if (calendar === 'hijri' && calendarLock === 'hijri') {
          // Update Gregorian based on Hijri
          const gregorianDate = hijriToGregorian(updated.hijriYear, updated.hijriMonth, updated.hijriDay);
          updated.gregorianYear = gregorianDate.getFullYear();
          updated.gregorianMonth = gregorianDate.getMonth() + 1;
          updated.gregorianDay = gregorianDate.getDate();
        }
      } catch (error) {
        // Keep original values if conversion fails
        console.warn('Calendar conversion failed:', error);
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
    // Simple 2.5% calculation for demo
    const zakatAmount = Math.max(0, (formData.zakatableWealth - formData.nisabThreshold) * 0.025);
    handleInputChange('zakatAmount', zakatAmount);
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
          <ErrorMessage message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Dual Calendar Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Date</h3>
          
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium text-gray-700">Lock Calendar:</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={calendarLock === 'gregorian' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setCalendarLock('gregorian')}
              >
                Gregorian
              </Button>
              <Button
                type="button"
                variant={calendarLock === 'hijri' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setCalendarLock('hijri')}
              >
                Hijri
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Gregorian Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gregorian Date
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  placeholder="Year"
                  value={formData.gregorianYear}
                  onChange={(e) => handleDateChange('gregorian', 'gregorianYear', parseInt(e.target.value) || new Date().getFullYear())}
                  min={1900}
                  max={2200}
                />
                <Input
                  type="number"
                  placeholder="Month"
                  value={formData.gregorianMonth}
                  onChange={(e) => handleDateChange('gregorian', 'gregorianMonth', parseInt(e.target.value) || 1)}
                  min={1}
                  max={12}
                />
                <Input
                  type="number"
                  placeholder="Day"
                  value={formData.gregorianDay}
                  onChange={(e) => handleDateChange('gregorian', 'gregorianDay', parseInt(e.target.value) || 1)}
                  min={1}
                  max={31}
                />
              </div>
            </div>

            {/* Hijri Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hijri Date
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Input
                  type="number"
                  placeholder="Year"
                  value={formData.hijriYear}
                  onChange={(e) => handleDateChange('hijri', 'hijriYear', parseInt(e.target.value) || 1445)}
                  min={1}
                  max={2000}
                />
                <Input
                  type="number"
                  placeholder="Month"
                  value={formData.hijriMonth}
                  onChange={(e) => handleDateChange('hijri', 'hijriMonth', parseInt(e.target.value) || 1)}
                  min={1}
                  max={12}
                />
                <Input
                  type="number"
                  placeholder="Day"
                  value={formData.hijriDay}
                  onChange={(e) => handleDateChange('hijri', 'hijriDay', parseInt(e.target.value) || 1)}
                  min={1}
                  max={30}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Display:</strong> {formatDualCalendar(new Date(formData.gregorianYear, formData.gregorianMonth - 1, formData.gregorianDay))}
            </p>
          </div>
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
              onChange={(e) => handleInputChange('totalWealth', parseFloat(e.target.value) || 0)}
              required
            />
            
            <Input
              label="Total Liabilities"
              type="number"
              step="0.01"
              value={formData.totalLiabilities}
              onChange={(e) => handleInputChange('totalLiabilities', parseFloat(e.target.value) || 0)}
              required
            />
            
            <Input
              label="Zakatable Wealth"
              type="number"
              step="0.01"
              value={formData.zakatableWealth}
              onChange={(e) => handleInputChange('zakatableWealth', parseFloat(e.target.value) || 0)}
              required
            />
            
            <div className="space-y-2">
              <Input
                label="Zakat Amount"
                type="number"
                step="0.01"
                value={formData.zakatAmount}
                onChange={(e) => handleInputChange('zakatAmount', parseFloat(e.target.value) || 0)}
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
              onChange={(e) => handleInputChange('nisabThreshold', parseFloat(e.target.value) || 0)}
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
                <option value="Shafii">Shafi'i</option>
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
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={isLoading}
            isLoading={isLoading}
          >
            {isEditMode ? 'Update Snapshot' : 'Create Snapshot'}
          </Button>
        </div>
      </form>
    </div>
  );
};