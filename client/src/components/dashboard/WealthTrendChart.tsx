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
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { NisabYearRecord } from '../../types/nisabYearRecord';

interface WealthTrendChartProps {
    records: NisabYearRecord[];
}

export const WealthTrendChart: React.FC<WealthTrendChartProps> = ({ records }) => {
    const { privacyMode } = usePrivacy();

    // Create sanitized data for the chart from Nisab Records
    const data = React.useMemo(() => {
        // Sort records oldest to newest
        const sorted = [...records].sort((a, b) => {
            const dateA = new Date(a.startDate || a.createdAt || 0).getTime();
            const dateB = new Date(b.startDate || b.createdAt || 0).getTime();
            return dateA - dateB;
        });

        return sorted.map(record => ({
            name: record.hijriYear ? `${record.hijriYear} AH` : new Date(record.createdAt || Date.now()).getFullYear().toString(),
            totalWealth: typeof record.totalWealth === 'number' ? record.totalWealth : parseFloat(record.totalWealth as string || '0'),
            zakatDue: typeof record.zakatAmount === 'number' ? record.zakatAmount : parseFloat(record.zakatAmount as string || '0'),
        }));
    }, [records]);

    // Format currency for tooltip/axis
    const formatCurrency = (value: number) => {
        if (privacyMode) return '****';
        // Compact notation for Axis (e.g. 10k)
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
                No historical data available. Finalize a Nisab Year to see trends.
            </div>
        );
    }

    return (
        <div className="h-[320px] w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Wealth Trend</h3>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0f766e" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#0f766e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorZakat" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={formatCurrency} tickLine={false} axisLine={false} />
                    <Tooltip
                        formatter={(value: number) => [formatTooltip(value)]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="totalWealth"
                        name="Total Wealth"
                        stroke="#0f766e"
                        fillOpacity={1}
                        fill="url(#colorWealth)"
                    />
                    <Area
                        type="monotone"
                        dataKey="zakatDue"
                        name="Zakat Due"
                        stroke="#fbbf24"
                        fillOpacity={1}
                        fill="url(#colorZakat)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
