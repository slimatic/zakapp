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

import React, { useMemo, useState } from 'react';
import { Liability } from '../../types';
import { useMaskedCurrency } from '../../contexts/PrivacyContext';
import { Button, Input } from '../ui';
import clsx from 'clsx';
import { format, addDays } from 'date-fns';

interface LiabilitySelectionTableProps {
    liabilities: Liability[];
    selectedLiabilityIds: string[];
    onSelectionChange: (ids: string[]) => void;
    className?: string;
    referenceDate?: Date;
}

/**
 * LiabilitySelectionTable
 * 
 * Allows users to select active liabilities to deduct from their Zakat.
 * implements (@faqih Rule 2.3):
 * - Highlights liabilities due within the current Hawl (354 days) as "Deductible".
 * - Greys out or warns about long-term liabilities that shouldn't be fully deducted.
 */
export const LiabilitySelectionTable: React.FC<LiabilitySelectionTableProps> = ({
    liabilities,
    selectedLiabilityIds,
    onSelectionChange,
    className,
    referenceDate = new Date()
}) => {
    const maskedCurrency = useMaskedCurrency();
    const [filter, setFilter] = useState('');

    // 1. Process Liabilities (Identify Deductible vs Long-Term)
    const processedLiabilities = useMemo(() => {
        const hawlDurationMs = 355 * 24 * 60 * 60 * 1000;
        const cutoffDate = new Date(referenceDate.getTime() + hawlDurationMs);

        return liabilities.map(lib => {
            const dueDate = new Date(lib.dueDate);
            const isDeductible = !isNaN(dueDate.getTime()) && dueDate <= cutoffDate;
            const daysUntilDue = Math.ceil((dueDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));

            return {
                ...lib,
                isDeductible,
                daysUntilDue,
                dueDateObj: dueDate
            };
        }).sort((a, b) => {
            // Sort: Deductible first, then by due date ascending
            if (a.isDeductible !== b.isDeductible) return a.isDeductible ? -1 : 1;
            return a.dueDateObj.getTime() - b.dueDateObj.getTime();
        });
    }, [liabilities, referenceDate]);

    // 2. Filter Display
    const filteredLiabilities = processedLiabilities.filter(l =>
        l.name.toLowerCase().includes(filter.toLowerCase()) ||
        (l.type || '').toLowerCase().includes(filter.toLowerCase())
    );

    const toggleSelection = (id: string) => {
        if (selectedLiabilityIds.includes(id)) {
            onSelectionChange(selectedLiabilityIds.filter(lid => lid !== id));
        } else {
            onSelectionChange([...selectedLiabilityIds, id]);
        }
    };

    const selectSuggested = () => {
        // Select all "Deductible" liabilities
        const deductibleIds = processedLiabilities
            .filter(l => l.isDeductible)
            .map(l => l.id);
        onSelectionChange(deductibleIds);
    };

    return (
        <div className={clsx("rounded-lg border border-gray-200 bg-white overflow-hidden", className)}>
            {/* Header & Filter */}
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div>
                    <h3 className="font-medium text-gray-900">Deductible Liabilities</h3>
                    <p className="text-xs text-gray-500">Debts due within the coming lunar year (354 days) are deductible.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="secondary" size="sm" onClick={selectSuggested} type="button">
                        Select Eligible
                    </Button>
                    <Input
                        placeholder="Filter liabilities..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="max-w-[200px]"
                    />
                </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto max-h-[300px]">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                                <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={filteredLiabilities.length > 0 && filteredLiabilities.every(l => selectedLiabilityIds.includes(l.id))}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            onSelectionChange([...new Set([...selectedLiabilityIds, ...filteredLiabilities.map(l => l.id)])]);
                                        } else {
                                            // Unselect current filtered list
                                            const currentIds = filteredLiabilities.map(l => l.id);
                                            onSelectionChange(selectedLiabilityIds.filter(id => !currentIds.includes(id)));
                                        }
                                    }}
                                />
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liability</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredLiabilities.length > 0 ? (
                            filteredLiabilities.map((liability) => {
                                const isSelected = selectedLiabilityIds.includes(liability.id);
                                return (
                                    <tr
                                        key={liability.id}
                                        onClick={() => toggleSelection(liability.id)}
                                        className={clsx(
                                            "cursor-pointer transition-colors hover:bg-gray-50",
                                            isSelected ? "bg-blue-50/50" : ""
                                        )}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                checked={isSelected}
                                                onChange={() => toggleSelection(liability.id)}
                                                // Stop propagation to prevent row click
                                                onClick={e => e.stopPropagation()}
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{liability.name}</div>
                                            <div className="text-xs text-gray-500">{liability.type}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={clsx("text-sm", liability.isDeductible ? "text-gray-900" : "text-amber-600")}>
                                                {format(liability.dueDateObj, 'MMM d, yyyy')}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {liability.daysUntilDue <= 0 ? 'Due/Overdue' : `${liability.daysUntilDue} days`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                            {maskedCurrency(new Intl.NumberFormat('en-US', { style: 'currency', currency: liability.currency }).format(liability.amount))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {liability.isDeductible ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Deductible
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800" title="Due > 354 days from now">
                                                    Long-term
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                                    No liabilities found matching your filter.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
