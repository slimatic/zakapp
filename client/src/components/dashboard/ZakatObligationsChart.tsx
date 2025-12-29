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
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { NisabYearRecord } from '../../types/nisabYearRecord';

interface ZakatObligationsChartProps {
    records: NisabYearRecord[];
    payments: any[]; // Full payment list to filter
}

export const ZakatObligationsChart: React.FC<ZakatObligationsChartProps> = ({ records, payments }) => {
    const { privacyMode } = usePrivacy();

    // combine records with payment data
    const data = React.useMemo(() => {
        // Sort records oldest to newest
        const sorted = [...records].sort((a, b) => {
            const dateA = new Date(a.startDate || a.createdAt || 0).getTime();
            const dateB = new Date(b.startDate || b.createdAt || 0).getTime();
            return dateA - dateB;
        });

        return sorted.map(record => {
            const recordId = record.id;
            const yearLabel = record.hijriYear ? `${record.hijriYear} AH` : new Date(record.createdAt || Date.now()).getFullYear().toString();

            // Sum payments linked to this record ID (assuming payment has nisabYearId) 
            // OR fallback: sum payments within the date range of the hawl
            // For simplicity/robustness in this phase, we'll try match by ID logic if available, 
            // or just mock it as "Total vs Paid" aggregate if ID linking isn't fully enforced yet.
            // Let's assume payments track 'nisabYearRecordId'.

            const paidForYear = payments
                .filter(p => p.nisabYearId === recordId) // Direct link
                .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

            const due = typeof record.zakatAmount === 'number' ? record.zakatAmount : parseFloat(record.zakatAmount as string || '0');

            return {
                name: yearLabel,
                due: due,
                paid: paidForYear,
                remaining: Math.max(0, due - paidForYear)
            };
        });

    }, [records, payments]);

    const formatCurrency = (value: number) => {
        if (privacyMode) return '****';
        return new Intl.NumberFormat('en-US', {
            notation: "compact",
            compactDisplay: "short",
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

    const formatTooltip = (value: number) => {
        if (privacyMode) return '****';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(value);
    };

    if (data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                No obligation history available.
            </div>
        );
    }

    return (
        <div className="h-[320px] w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Zakat Obligations</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={formatCurrency} tickLine={false} axisLine={false} />
                    <Tooltip
                        formatter={(value: number) => [formatTooltip(value)]}
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="due" name="Total Due" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="paid" name="Paid" fill="#0f766e" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
