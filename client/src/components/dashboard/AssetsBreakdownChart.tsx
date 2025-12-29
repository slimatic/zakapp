import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Asset } from '../../types';
import { useMaskedCurrency } from '../../contexts/PrivacyContext';

interface AssetsBreakdownChartProps {
    assets: Asset[];
    currency?: string;
}

/**
 * AssetsBreakdownChart Component
 * 
 * Visualizes the composition of the user's asset portfolio using a donut chart.
 * Groups assets by their main category (type) and displays percentage breakdown.
 * 
 * Design Rules:
 * - Simple donut chart (not 3D)
 * - Accessible colors (Teal/Slate/Emerald/Cyan/Indigo/Violet)
 * - Responsive container
 * - Custom accessible tooltip
 */
export const AssetsBreakdownChart: React.FC<AssetsBreakdownChartProps> = ({
    assets,
    currency = 'USD'
}) => {
    const maskedCurrency = useMaskedCurrency();

    // Color palette for chart segments - optimized for "Islamic Fintech" aesthetic
    const COLORS = [
        '#0d9488', // Teal 600
        '#0891b2', // Cyan 600
        '#4f46e5', // Indigo 600
        '#059669', // Emerald 600
        '#7c3aed', // Violet 600
        '#db2777', // Pink 600
        '#d97706', // Amber 600 (use sparingly)
        '#475569', // Slate 600
    ];

    // Process data for the chart
    const chartData = useMemo(() => {
        // 1. Group by category
        const groupedData: Record<string, number> = {};

        assets.forEach(asset => {
            // Use friendly names for categories
            const categoryName = asset.type.replace(/_/g, ' ').toLowerCase()
                .replace(/\b\w/g, c => c.toUpperCase());

            groupedData[categoryName] = (groupedData[categoryName] || 0) + (asset.value || 0);
        });

        // 2. Convert to array and sort by value descending
        return Object.entries(groupedData)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .filter(item => item.value > 0); // Only show segments with value
    }, [assets]);

    // Handle empty state
    if (chartData.length === 0) {
        return (
            <div className="h-[320px] w-full">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Composition</h3>
                <div className="h-[280px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    No zakatable assets found. Add assets to see breakdown.
                </div>
            </div>
        );
    }

    // Calculate total for percentage
    const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

    // Custom Tooltip Component
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percentage = ((data.value / totalValue) * 100).toFixed(1);

            return (
                <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
                    <p className="font-semibold text-gray-900">{data.name}</p>
                    <p className="text-gray-700">
                        {maskedCurrency(new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: currency,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                        }).format(data.value))}
                    </p>
                    <p className="text-xs text-gray-500">{percentage}% of Portfolio</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-[320px] w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Composition</h3>
            <div className="h-[280px] sm:h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius="40%"
                            outerRadius="70%"
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    stroke="none"
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            wrapperStyle={{
                                paddingTop: '0.75rem'
                            }}
                            formatter={(value, entry: any) => {
                                const item = chartData.find(d => d.name === value);
                                const percent = item ? ((item.value / totalValue) * 100).toFixed(0) : 0;
                                return <span className="text-xs sm:text-sm text-gray-600">{value} ({percent}%)</span>;
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Screen Reader Table Summary (Hidden visually but accessible) */}
            <div className="sr-only">
                <table>
                    <caption>Portfolio Breakdown by Asset Category</caption>
                    <thead>
                        <tr>
                            <th scope="col">Category</th>
                            <th scope="col">Value</th>
                            <th scope="col">Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chartData.map((item) => (
                            <tr key={item.name}>
                                <td>{item.name}</td>
                                <td>{item.value}</td>
                                <td>{((item.value / totalValue) * 100).toFixed(1)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
