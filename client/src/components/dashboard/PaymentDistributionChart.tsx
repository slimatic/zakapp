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
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import { usePrivacy } from '../../contexts/PrivacyContext';

interface PaymentDistributionChartProps {
    payments: any[];
    currency?: string;
}

const COLORS = [
    '#0f766e', // Primary Teal
    '#fbbf24', // Secondary Gold
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f97316', // Orange
    '#22c55e', // Green
    '#64748b', // Slate
];

const RECIPIENT_LABELS: { [key: string]: string } = {
    'poor': 'Fakir (Poor)',
    'needy': 'Miskin (Needy)',
    'admin': 'Amil (Admins)',
    'revert': 'Muallaf (Reverts)',
    'slave': 'Riqab (Captives)',
    'debtor': 'Gharimin (Debtors)',
    'fisabilillah': 'Fisabilillah (In God\'s Cause)',
    'traveller': 'Ibn Sabil (Wayfarers)',
    'other': 'Other'
};

export const PaymentDistributionChart: React.FC<PaymentDistributionChartProps> = ({ payments, currency = 'USD' }) => {
    const { privacyMode } = usePrivacy();

    // Group payments by category
    const data = React.useMemo(() => {
        const grouped = payments.reduce((acc, payment) => {
            const category = payment.recipientCategory || 'other';
            acc[category] = (acc[category] || 0) + (Number(payment.amount) || 0);
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(grouped)
            .map((entry) => {
                const [name, val] = entry;
                const value = val as number;
                return {
                    name: RECIPIENT_LABELS[name] || name,
                    value,
                    originalValue: value // store meaningful value for sorting
                };
            })
            .filter((item) => item.value > 0)
            .sort((a, b) => b.value - a.value); // Sort biggest first
    }, [payments]);

    // Format currency for tooltip
    const formatCurrency = (value: number) => {
        if (privacyMode) return '****';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(value);
    };

    if (data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                No payment data available
            </div>
        );
    }

    return (
        <div className="h-[320px] w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Distribution</h3>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Amount']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '12px', paddingLeft: '20px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
