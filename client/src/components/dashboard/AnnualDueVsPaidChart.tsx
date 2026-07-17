import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { usePrivacy } from '../../contexts/PrivacyContext';

interface MonthData {
  month: string;
  due: number;
  paid: number;
}

interface DueVsPaidChartProps {
  data: MonthData[];
  currency?: string;
}

export const DueVsPaidChart: React.FC<DueVsPaidChartProps> = ({
  data,
  currency = 'USD',
}) => {
  const { privacyMode } = usePrivacy();

  const formatCurrency = (value: number) => {
    if (privacyMode) return '****';
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const formatTooltip = (value: number) => {
    if (privacyMode) return '****';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (data.length === 0 || data.every((d) => d.due === 0 && d.paid === 0)) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
        No data available for this year.
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 10,
            left: 10,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickFormatter={formatCurrency}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(value: any) => [formatTooltip(Number(value) || 0)]}
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
          <Bar dataKey="due" name="Zakat Due" fill="#94a3b8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="paid" name="Zakat Paid" fill="#0f766e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
