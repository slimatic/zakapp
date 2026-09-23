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
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
import { getCurrencySymbol, type CurrencyCode } from '../../utils/formatters';
import {
 LineChart,
 Line,
 BarChart,
 Bar,
 PieChart,
 Pie,
 Cell,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 Legend,
 ResponsiveContainer
} from 'recharts';

interface CalculationTrendsProps {
 wealthTrend: Array<{
 date: string;
 wealth: number;
 }>;
 zakatTrend: Array<{
 date: string;
 zakat: number;
 }>;
 methodologyDistribution: Record<string, number>;
 averages: {
 wealth: number;
 zakat: number;
 };
 totals: {
 wealth: number;
 zakat: number;
 };
 selectedPeriod: '1month' | '3months' | '6months' | '1year' | '2years' | 'all';
 onPeriodChange: (period: '1month' | '3months' | '6months' | '1year' | '2years' | 'all') => void;
}

const METHODOLOGY_COLORS = {
 standard: '#3B82F6', // Blue
 hanafi: '#10B981', // Green
 shafii: '#8B5CF6', // Purple
 custom: '#6B7280' // Gray
};

const METHODOLOGY_NAMES: Record<string, string> = {
 standard: 'Standard (AAOIFI)',
 hanafi: 'Hanafi',
 shafii: "Shafi'i",
 custom: 'Custom'
};

export const CalculationTrendsChart: React.FC<CalculationTrendsProps> = ({
 wealthTrend,
 zakatTrend,
 methodologyDistribution,
 averages,
 totals,
 selectedPeriod,
 onPeriodChange
}) => {
 const { currency, formatCurrency: formatDisplayCurrency } = useDisplayCurrency();

 const formatCurrency = (value: number): string => formatDisplayCurrency(value);

 /**
 * Compact notation for chart axis ticks and summary tiles (e.g. "1.2M").
 * The magnitude suffix is language-neutral, but the symbol must follow the
 * user's display currency rather than a hardcoded "$" (#310).
 */
 const formatCompactCurrency = (value: number): string => {
 const symbol = getCurrencySymbol(currency as CurrencyCode) || currency;
 if (value >= 1000000) {
 return `${symbol}${(value / 1000000).toFixed(1)}M`;
 } else if (value >= 1000) {
 return `${symbol}${(value / 1000).toFixed(1)}K`;
 }
 return `${symbol}${value.toFixed(0)}`;
 };

 // Combine wealth and zakat trends for the line chart
 const combinedData = wealthTrend.map((wealthPoint, index) => ({
 date: wealthPoint.date,
 wealth: wealthPoint.wealth,
 zakat: zakatTrend[index]?.zakat || 0
 }));

 // Prepare methodology distribution data for charts
 const methodologyData = Object.entries(methodologyDistribution).map(([methodology, count]) => ({
 name: METHODOLOGY_NAMES[methodology] || methodology,
 value: count,
 color: METHODOLOGY_COLORS[methodology as keyof typeof METHODOLOGY_COLORS] || METHODOLOGY_COLORS.custom
 }));

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex justify-between items-center">
 <h2 className="text-2xl font-bold text-foreground">
 Calculation Trends
 </h2>

 {/* Period Selector */}
 <select
 value={selectedPeriod}
 onChange={(e) => onPeriodChange(e.target.value as typeof selectedPeriod)}
 className="px-4 py-2 border border-border-strong rounded-md shadow-sm focus:ring-ring focus:border-ring"
 >
 <option value="1month">Last Month</option>
 <option value="3months">Last 3 Months</option>
 <option value="6months">Last 6 Months</option>
 <option value="1year">Last Year</option>
 <option value="2years">Last 2 Years</option>
 <option value="all">All Time</option>
 </select>
 </div>

 {/* Summary Cards */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <div className="bg-card rounded-lg shadow p-6">
 <p className="text-sm text-muted-foreground">Total Calculations</p>
 <p className="text-3xl font-bold text-foreground mt-2">
 {combinedData.length}
 </p>
 </div>

 <div className="bg-card rounded-lg shadow p-6">
 <p className="text-sm text-muted-foreground">Average Wealth</p>
 <p className="text-3xl font-bold text-secondary mt-2">
 {formatCompactCurrency(averages.wealth)}
 </p>
 </div>

 <div className="bg-card rounded-lg shadow p-6">
 <p className="text-sm text-muted-foreground">Average Zakat</p>
 <p className="text-3xl font-bold text-success mt-2">
 {formatCompactCurrency(averages.zakat)}
 </p>
 </div>

 <div className="bg-card rounded-lg shadow p-6">
 <p className="text-sm text-muted-foreground">Total Zakat</p>
 <p className="text-3xl font-bold text-success mt-2">
 {formatCompactCurrency(totals.zakat)}
 </p>
 </div>
 </div>

 {/* Combined Trend Chart */}
 <div className="bg-card rounded-lg shadow p-6">
 <h3 className="text-lg font-semibold text-foreground mb-4">
 Wealth & Zakat Over Time
 </h3>
 <ResponsiveContainer width="100%" height={400}>
 <LineChart data={combinedData}>
 <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
 <XAxis
 dataKey="date"
 stroke="#9CA3AF"
 style={{ fontSize: '12px' }}
 />
 <YAxis
 stroke="#9CA3AF"
 style={{ fontSize: '12px' }}
 tickFormatter={formatCompactCurrency}
 />
 <Tooltip
 formatter={(value: any, name: string | undefined) => [
 formatCompactCurrency(value),
 name === 'wealth' ? 'Total Wealth' : 'Zakat Due'
 ]}
 labelStyle={{ color: '#111827' }}
 contentStyle={{
 backgroundColor: '#F9FAFB',
 border: '1px solid #D1D5DB',
 borderRadius: '8px'
 }}
 />
 <Legend />
 <Line
 type="monotone"
 dataKey="wealth"
 stroke="#3B82F6"
 strokeWidth={3}
 name="Total Wealth"
 dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
 activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
 />
 <Line
 type="monotone"
 dataKey="zakat"
 stroke="#10B981"
 strokeWidth={3}
 name="Zakat Due"
 dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
 activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
 />
 </LineChart>
 </ResponsiveContainer>
 </div>

 {/* Methodology Distribution */}
 {methodologyData.length > 0 && (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Pie Chart */}
 <div className="bg-card rounded-lg shadow p-6">
 <h3 className="text-lg font-semibold text-foreground mb-4">
 Methodology Distribution
 </h3>
 <ResponsiveContainer width="100%" height={300}>
 <PieChart>
 <Pie
 data={methodologyData}
 cx="50%"
 cy="50%"
 labelLine={false}
 label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
 outerRadius={80}
 fill="#8884d8"
 dataKey="value"
 >
 {methodologyData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Pie>
 <Tooltip />
 </PieChart>
 </ResponsiveContainer>
 </div>

 {/* Bar Chart */}
 <div className="bg-card rounded-lg shadow p-6">
 <h3 className="text-lg font-semibold text-foreground mb-4">
 Calculations by Methodology
 </h3>
 <ResponsiveContainer width="100%" height={300}>
 <BarChart data={methodologyData}>
 <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
 <XAxis
 dataKey="name"
 stroke="#9CA3AF"
 style={{ fontSize: '12px' }}
 angle={-15}
 textAnchor="end"
 height={80}
 />
 <YAxis
 stroke="#9CA3AF"
 style={{ fontSize: '12px' }}
 allowDecimals={false}
 />
 <Tooltip
 contentStyle={{
 backgroundColor: '#1F2937',
 border: '1px solid #374151',
 borderRadius: '0.5rem',
 color: '#F9FAFB'
 }}
 />
 <Bar dataKey="value" name="Calculations">
 {methodologyData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.color} />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>
 )}

 {/* Data Table Alternative for Accessibility */}
 <details className="bg-card rounded-lg shadow p-6">
 <summary className="text-lg font-semibold text-foreground cursor-pointer">
 View Data Table (Accessible Alternative)
 </summary>
 <div className="mt-4 overflow-x-auto">
 <table className="min-w-full divide-y divide-border ">
 <thead>
 <tr>
 <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
 Date
 </th>
 <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">
 Wealth
 </th>
 <th className="px-4 py-2 text-right text-sm font-medium text-muted-foreground">
 Zakat
 </th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border ">
 {combinedData.map((row, index) => (
 <tr key={index}>
 <td className="px-4 py-2 text-sm text-foreground">
 {row.date}
 </td>
 <td className="px-4 py-2 text-sm text-right text-foreground">
 {formatCurrency(row.wealth)}
 </td>
 <td className="px-4 py-2 text-sm text-right text-success">
 {formatCurrency(row.zakat)}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </details>

 {/* Educational Note */}
 <div className="bg-accent border border-border rounded-lg p-4">
 <div className="flex">
 <svg
 className="h-5 w-5 text-secondary/80 mr-3 flex-shrink-0"
 fill="currentColor"
 viewBox="0 0 20 20"
 >
 <path
 fillRule="evenodd"
 d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-4 4a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
 clipRule="evenodd"
 />
 </svg>
 <div>
 <p className="text-sm text-secondary">
 <strong>Understanding Your Trends:</strong> These trends show how your wealth and Zakat obligations have changed over time. Regular tracking helps you plan for your annual Zakat payment and understand your financial growth.
 </p>
 </div>
 </div>
 </div>
 </div>
 );
};

export default CalculationTrendsChart;
