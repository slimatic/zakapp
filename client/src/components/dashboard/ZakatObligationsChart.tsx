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
import { CHART_COLORS, CHART_AXIS_COLOR, CHART_GRID_COLOR } from '../../utils/chartPalette';

interface ZakatObligationsChartProps {
    records: NisabYearRecord[];
    payments: any[];
    currency?: string;
}

export const ZakatObligationsChart: React.FC<ZakatObligationsChartProps> = ({ records, payments, currency = 'USD' }) => {
    const { privacyMode } = usePrivacy();
    const [calendarFormat, setCalendarFormat] = React.useState<'hijri' | 'gregorian'>('hijri');

    // combine records with payment data
    const data = React.useMemo(() => {
        // Sort records oldest to newest
        const sorted = [...records].sort((a, b) => {
            const dateA = new Date(a.hawlStartDate || a.calculationDate || a.createdAt || 0).getTime();
            const dateB = new Date(b.hawlStartDate || b.calculationDate || b.createdAt || 0).getTime();
            return dateA - dateB;
        });

        return sorted.map(record => {
            const recordId = record.id;

            let label = '';
            if (calendarFormat === 'hijri') {
                label = record.hijriYear ? `${record.hijriYear} AH` : 'AH';
            } else {
                // Fallback to Gregorian year from hawlStartDate or calculationDate
                const date = new Date(record.hawlStartDate || record.calculationDate || record.createdAt || Date.now());
                label = date.getFullYear().toString();
            }

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
                name: label,
                due: due,
                paid: paidForYear,
                remaining: Math.max(0, due - paidForYear)
            };
        });

    }, [records, payments, calendarFormat]);

    const formatCurrency = (value: number) => {
        if (privacyMode) return '****';
        return new Intl.NumberFormat('en-US', {
            notation: "compact",
            compactDisplay: "short",
            style: 'currency',
            currency: currency,
        }).format(value);
    };

    const formatTooltip = (value: number) => {
        if (privacyMode) return '****';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(value);
    };

    if (data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-muted rounded-lg border border-dashed border-border">
                No obligation history available.
            </div>
        );
    }

    return (
        <div className="h-[320px] w-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-foreground">Zakat Obligations</h3>
                <div className="flex bg-muted p-0.5 rounded-lg">
                    <button
                        onClick={() => setCalendarFormat('hijri')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${calendarFormat === 'hijri'
                                ? 'bg-card text-secondary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Hijri
                    </button>
                    <button
                        onClick={() => setCalendarFormat('gregorian')}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${calendarFormat === 'gregorian'
                                ? 'bg-card text-secondary shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Gregorian
                    </button>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 10,
                        left: 20,
                        bottom: 20, // Increased bottom margin
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke={CHART_AXIS_COLOR}
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={10} // Push labels down
                    />
                    <YAxis stroke={CHART_AXIS_COLOR} fontSize={12} tickFormatter={formatCurrency} tickLine={false} axisLine={false} />
                    <Tooltip
                        formatter={(value: any) => [formatTooltip(Number(value) || 0)]}
                        cursor={{ fill: CHART_GRID_COLOR }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="due" name="Total Due" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="paid" name="Paid" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
