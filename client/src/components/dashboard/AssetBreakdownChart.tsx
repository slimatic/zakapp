import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { AssetBreakdown } from '../../types';
import { usePrivacy } from '../../contexts/PrivacyContext';

interface AssetBreakdownChartProps {
    data: AssetBreakdown[];
    totalAssets: number;
}

// Color Palette (Tailwind-aligned)
const COLORS = [
    '#10B981', // emerald-500 (Solvent/Nisab Met)
    '#F59E0B', // amber-500 (Warning)
    '#3B82F6', // blue-500 (Standard Asset)
    '#6366F1', // indigo-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#9CA3AF', // gray-400 (Exempt/Other)
];

const renderAccessibleTable = (data: AssetBreakdown[]) => (
    <table className="sr-only">
        <caption>Asset Breakdown for Zakat Calculation</caption>
        <thead>
            <tr>
                <th scope="col">Asset Type</th>
                <th scope="col">Value</th>
                <th scope="col">Zakatable Amount</th>
            </tr>
        </thead>
        <tbody>
            {data.map((item, index) => (
                <tr key={index}>
                    <td>{item.type}</td>
                    <td>{item.totalValue}</td>
                    <td>{item.zakatableAmount}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

export const AssetBreakdownChart: React.FC<AssetBreakdownChartProps> = ({ data, totalAssets }) => {
    const { privacyMode } = usePrivacy();

    // Filter out zero values for better chart visuals
    const chartData = data.filter(d => d.totalValue > 0).map(d => ({
        name: d.type.replace('_', ' '), // Format labels
        value: d.totalValue,
        zakatable: d.zakatableAmount
    }));

    if (chartData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500 text-sm">No asset data available to display.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-80 relative" aria-label="Asset Breakdown Chart" role="img">
            {/* Screen Reader Table */}
            {renderAccessibleTable(data)}

            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number) => privacyMode ? '****' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)}
                        contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            </ResponsiveContainer>

            {/* Center Text (Total) */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total</p>
                <p className="text-lg font-bold text-gray-900">
                    {privacyMode
                        ? '****'
                        : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: "compact" }).format(totalAssets)
                    }
                </p>
            </div>
        </div>
    );
};
