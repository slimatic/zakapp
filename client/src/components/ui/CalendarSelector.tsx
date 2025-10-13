import React, { useState, useEffect } from 'react';
import { gregorianToHijri, hijriToGregorian, formatHijriDate, HIJRI_MONTHS } from '../../utils/calendarConverter';

export interface CalendarSelectorProps {
  /**
   * Currently selected calendar type
   */
  calendarType: 'hijri' | 'gregorian';
  
  /**
   * Currently selected date (Gregorian)
   */
  selectedDate: Date;
  
  /**
   * Callback when calendar type changes
   */
  onCalendarTypeChange?: (type: 'hijri' | 'gregorian') => void;
  
  /**
   * Callback when date changes
   */
  onDateChange?: (date: Date) => void;
  
  /**
   * Optional label for the selector
   */
  label?: string;
  
  /**
   * Whether the selector is disabled
   */
  disabled?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * CalendarSelector Component
 * 
 * Provides a dual calendar selector allowing users to switch between
 * Hijri (Islamic lunar) and Gregorian (solar) calendars with real-time
 * date conversion display.
 * 
 * Features:
 * - Toggle between Hijri and Gregorian calendars
 * - Date picker for both calendar systems
 * - Real-time date conversion display
 * - Accessible keyboard navigation
 * - Responsive design
 */
export const CalendarSelector: React.FC<CalendarSelectorProps> = ({
  calendarType,
  selectedDate,
  onCalendarTypeChange,
  onDateChange,
  label = 'Select Date',
  disabled = false,
  className = ''
}) => {
  const [localCalendarType, setLocalCalendarType] = useState<'hijri' | 'gregorian'>(calendarType);
  const [gregorianDate, setGregorianDate] = useState<Date>(selectedDate);
  const [hijriDate, setHijriDate] = useState(() => gregorianToHijri(selectedDate));

  // Update local state when props change
  useEffect(() => {
    setLocalCalendarType(calendarType);
  }, [calendarType]);

  useEffect(() => {
    setGregorianDate(selectedDate);
    setHijriDate(gregorianToHijri(selectedDate));
  }, [selectedDate]);

  /**
   * Handle calendar type toggle
   */
  const handleCalendarTypeChange = (newType: 'hijri' | 'gregorian') => {
    setLocalCalendarType(newType);
    onCalendarTypeChange?.(newType);
  };

  /**
   * Handle Gregorian date change
   */
  const handleGregorianDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (isNaN(newDate.getTime())) return;

    setGregorianDate(newDate);
    setHijriDate(gregorianToHijri(newDate));
    onDateChange?.(newDate);
  };

  /**
   * Handle Hijri date change
   */
  const handleHijriDateChange = (field: 'year' | 'month' | 'day', value: number) => {
    const updatedHijri = { ...hijriDate };
    
    if (field === 'year') updatedHijri.hy = value;
    else if (field === 'month') updatedHijri.hm = value;
    else if (field === 'day') updatedHijri.hd = value;

    // Validate Hijri date
    if (updatedHijri.hy < 1 || updatedHijri.hm < 1 || updatedHijri.hm > 12 || 
        updatedHijri.hd < 1 || updatedHijri.hd > 30) {
      return; // Invalid date
    }

    setHijriDate(updatedHijri);

    // Convert to Gregorian and update
    try {
      const newGregorianDate = hijriToGregorian(updatedHijri.hy, updatedHijri.hm, updatedHijri.hd);
      setGregorianDate(newGregorianDate);
      onDateChange?.(newGregorianDate);
    } catch (error) {
      console.error('Error converting Hijri to Gregorian:', error);
    }
  };

  /**
   * Format Gregorian date for input
   */
  const formatGregorianForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className={`calendar-selector ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      {/* Calendar Type Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => handleCalendarTypeChange('gregorian')}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            localCalendarType === 'gregorian'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          aria-pressed={localCalendarType === 'gregorian'}
        >
          Gregorian
        </button>
        <button
          type="button"
          onClick={() => handleCalendarTypeChange('hijri')}
          disabled={disabled}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            localCalendarType === 'hijri'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          aria-pressed={localCalendarType === 'hijri'}
        >
          Hijri (Islamic)
        </button>
      </div>

      {/* Date Input Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-4">
        {localCalendarType === 'gregorian' ? (
          /* Gregorian Date Picker */
          <div>
            <label htmlFor="gregorian-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gregorian Date
            </label>
            <input
              id="gregorian-date"
              type="date"
              value={formatGregorianForInput(gregorianDate)}
              onChange={handleGregorianDateChange}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        ) : (
          /* Hijri Date Picker */
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hijri Date
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Day */}
              <div>
                <label htmlFor="hijri-day" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Day
                </label>
                <input
                  id="hijri-day"
                  type="number"
                  min="1"
                  max="30"
                  value={hijriDate.hd}
                  onChange={(e) => handleHijriDateChange('day', parseInt(e.target.value))}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-green-500 focus:border-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Month */}
              <div>
                <label htmlFor="hijri-month" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Month
                </label>
                <select
                  id="hijri-month"
                  value={hijriDate.hm}
                  onChange={(e) => handleHijriDateChange('month', parseInt(e.target.value))}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-green-500 focus:border-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {HIJRI_MONTHS.map((month, index) => (
                    <option key={index + 1} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <label htmlFor="hijri-year" className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Year
                </label>
                <input
                  id="hijri-year"
                  type="number"
                  min="1"
                  max="9999"
                  value={hijriDate.hy}
                  onChange={(e) => handleHijriDateChange('year', parseInt(e.target.value))}
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                           focus:ring-2 focus:ring-green-500 focus:border-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Conversion Display */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {localCalendarType === 'gregorian' ? (
              <span>
                <strong className="text-gray-900 dark:text-gray-100">Hijri:</strong>{' '}
                {formatHijriDate(hijriDate)} ({hijriDate.hd} {HIJRI_MONTHS[hijriDate.hm - 1]} {hijriDate.hy} AH)
              </span>
            ) : (
              <span>
                <strong className="text-gray-900 dark:text-gray-100">Gregorian:</strong>{' '}
                {gregorianDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Educational Note */}
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        ℹ️ The Islamic calendar is lunar-based with 354-355 days per year. 
        Zakat is due after one Hijri year from your last payment.
      </p>
    </div>
  );
};

export default CalendarSelector;
