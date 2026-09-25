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

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Asset } from '../../types';
import { useMaskedCurrency } from '../../contexts/PrivacyContext';
import { CHART_COLORS } from '../../utils/chartPalette';

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
  const { t } = useTranslation('dashboard');
    const maskedCurrency = useMaskedCurrency();

    // Color palette for chart segments - optimized for "Islamic Fintech" aesthetic
    const COLORS = CHART_COLORS;;

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
                <h3 className="text-lg font-semibold text-foreground mb-4">{t('charts.assetComposition')}</h3>
                <div className="h-[280px] flex items-center justify-center text-muted-foreground bg-muted rounded-lg border border-dashed border-border">
                    {t('charts.noZakatableAssets')}
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
                <div className="bg-card p-3 border border-border shadow-md rounded-md">
                    <p className="font-semibold text-foreground">{data.name}</p>
                    <p className="text-foreground/80">
                        {maskedCurrency(new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: currency,
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                        }).format(data.value))}
                    </p>
                    <p className="text-xs text-muted-foreground">{percentage}% of Portfolio</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="h-[320px] w-full">
            <h3 className="text-lg font-semibold text-foreground mb-4">{t('charts.assetComposition')}</h3>
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
                            formatter={(value, _entry: any) => {
                                const item = chartData.find(d => d.name === value);
                                const percent = item ? ((item.value / totalValue) * 100).toFixed(0) : 0;
                                return <span className="text-xs sm:text-sm text-muted-foreground">{value} ({percent}%)</span>;
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Screen Reader Table Summary (Hidden visually but accessible) */}
            <div className="sr-only">
                <table>
                    <caption>{t('charts.assetCompositionSubtitle')}</caption>
                    <thead>
                        <tr>
                            <th scope="col">{t('charts.category')}</th>
                            <th scope="col">{t('charts.value')}</th>
                            <th scope="col">{t('charts.percentage')}</th>
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
