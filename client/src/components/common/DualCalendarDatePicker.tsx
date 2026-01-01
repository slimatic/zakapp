/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatDualCalendar, gregorianToHijri, hijriToGregorian, HijriDate } from '../../utils/calendarConverter';
import { cn } from '../../lib/utils'; // Assuming this utility exists based on Input/Button usage

interface DualCalendarDatePickerProps {
    value: Date | string;
    onChange: (date: Date) => void;
    label?: string;
    className?: string;
}

export const DualCalendarDatePicker: React.FC<DualCalendarDatePickerProps> = ({
    value,
    onChange,
    label = 'Date',
    className
}) => {
    const { user } = useAuth();
    // Use safe access for settings as User type might be stale in some contexts
    const hijriAdjustment = (user as any)?.settings?.hijriAdjustment || 0;
    const preferredCalendar = (user as any)?.settings?.preferredCalendar;

    // Parse initial value to Date object safely
    const parseDateValue = (v: Date | string) => {
        if (typeof v === 'string') {
            // If it's just a date string date-only (YYYY-MM-DD), force it to local midnight
            // to prevent "UTC Midnight" being interpreted as "Previous Day" in Western timezones.
            if (!v.includes('T')) {
                return new Date(`${v}T00:00:00`);
            }
            return new Date(v);
        }
        return v;
    };

    const dateValue = parseDateValue(value);

    // State to track which calendar mode is active
    const [mode, setMode] = useState<'gregorian' | 'hijri'>('gregorian');

    // Sync mode with user preference when it loads
    useEffect(() => {
        if (preferredCalendar === 'hijri' || preferredCalendar === 'gregorian') {
            setMode(preferredCalendar);
        }
    }, [preferredCalendar]);

    // Focus state to prevent prop updates from clobbering user typing
    const [isFocused, setIsFocused] = useState(false);

    // Internal state for inputs
    const [gregorianState, setGregorianState] = useState({
        year: dateValue.getFullYear().toString(),
        month: (dateValue.getMonth() + 1).toString(),
        day: dateValue.getDate().toString()
    });

    const [hijriState, setHijriState] = useState<{ hy: string; hm: string; hd: string }>(() => {
        const h = gregorianToHijri(dateValue, hijriAdjustment);
        return { hy: h.hy.toString(), hm: h.hm.toString(), hd: h.hd.toString() };
    });

    // Validates and formats the internal state strictly
    const refreshStateFromDate = (d: Date) => {
        if (isNaN(d.getTime())) return;
        setGregorianState({
            year: d.getFullYear().toString(),
            month: (d.getMonth() + 1).toString(),
            day: d.getDate().toString()
        });
        const h = gregorianToHijri(d, hijriAdjustment);
        setHijriState({ hy: h.hy.toString(), hm: h.hm.toString(), hd: h.hd.toString() });
    };

    // Sync state when props change - BUT ONLY if not focused
    useEffect(() => {
        if (isFocused) return;
        const d = parseDateValue(value);
        refreshStateFromDate(d);
    }, [value, isFocused, hijriAdjustment]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsFocused(true);
        e.target.select();
    };

    const handleBlur = () => {
        setIsFocused(false);
        // On blur, revert to the last valid prop value if current input is invalid
        // This ensures "garbage" input gets cleaned up
        const d = parseDateValue(value);
        refreshStateFromDate(d);
    };

    const updateGregorian = (field: 'year' | 'month' | 'day', val: string) => {
        const newState = { ...gregorianState, [field]: val };
        setGregorianState(newState);

        const y = parseInt(newState.year);
        const m = parseInt(newState.month);
        const d_num = parseInt(newState.day);

        // Only propagate if full valid date
        if (!isNaN(y) && !isNaN(m) && !isNaN(d_num) &&
            y > 1000 && m >= 1 && m <= 12 && d_num >= 1 && d_num <= 31) {

            // Construct date at LOCAL NOON to be safe against timezone shifts
            // when consumers process this date (e.g., .toISOString())
            const d = new Date(y, m - 1, d_num, 12, 0, 0);

            // Verify exact match to avoid auto-correction (e.g. Feb 30 -> Mar 2)
            if (!isNaN(d.getTime()) && d.getDate() === d_num && d.getMonth() === m - 1) {
                const h = gregorianToHijri(d, hijriAdjustment);
                setHijriState({ hy: h.hy.toString(), hm: h.hm.toString(), hd: h.hd.toString() });

                onChange(d);
            }
        }
    };

    const updateHijri = (field: 'hy' | 'hm' | 'hd', val: string) => {
        const newState = { ...hijriState, [field]: val };
        setHijriState(newState);

        const y = parseInt(newState.hy);
        const m = parseInt(newState.hm);
        const d = parseInt(newState.hd);

        if (!isNaN(y) && !isNaN(m) && !isNaN(d) &&
            y > 1300 && m >= 1 && m <= 12 && d >= 1 && d <= 30) {
            try {
                const gDate = hijriToGregorian(y, m, d, hijriAdjustment);
                if (!isNaN(gDate.getTime())) {
                    setGregorianState({
                        year: gDate.getFullYear().toString(),
                        month: (gDate.getMonth() + 1).toString(),
                        day: gDate.getDate().toString()
                    });
                    onChange(gDate);
                }
            } catch (e) {
                // Invalid hijri
            }
        }
    };

    return (
        <div className={cn("bg-gray-50 p-4 rounded-lg border border-gray-200", className)}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">{label}</h3>
                <div className="flex bg-white rounded-md border border-gray-200 p-1">
                    <button
                        type="button"
                        onClick={() => setMode('gregorian')}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded transition-colors",
                            mode === 'gregorian' ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        Gregorian
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('hijri')}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded transition-colors",
                            mode === 'hijri' ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        Hijri
                        {hijriAdjustment !== 0 && (
                            <span className="ml-1 text-[10px] text-blue-600 bg-blue-50 px-1 rounded">
                                {hijriAdjustment > 0 ? `+${hijriAdjustment}` : hijriAdjustment}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
                {mode === 'gregorian' ? (
                    <>
                        <Input
                            type="text"
                            label="Day"
                            value={gregorianState.day}
                            onChange={(e) => updateGregorian('day', e.target.value)}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder="DD"
                        />
                        <Input
                            type="text"
                            label="Month"
                            value={gregorianState.month}
                            onChange={(e) => updateGregorian('month', e.target.value)}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder="MM"
                        />
                        <Input
                            type="text"
                            label="Year"
                            value={gregorianState.year}
                            onChange={(e) => updateGregorian('year', e.target.value)}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder="YYYY"
                        />
                    </>
                ) : (
                    <>
                        <Input
                            type="text"
                            label="Day"
                            value={hijriState.hd}
                            onChange={(e) => updateHijri('hd', e.target.value)}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder="DD"
                        />
                        <Input
                            type="text"
                            label="Month"
                            value={hijriState.hm}
                            onChange={(e) => updateHijri('hm', e.target.value)}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder="MM"
                        />
                        <Input
                            type="text"
                            label="Year"
                            value={hijriState.hy}
                            onChange={(e) => updateHijri('hy', e.target.value)}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder="YYYY"
                        />
                    </>
                )}
            </div>

            <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
                <span className="font-medium text-gray-700">Converted:</span>
                {formatDualCalendar(dateValue, hijriAdjustment)}
            </div>
        </div>
    );
};
