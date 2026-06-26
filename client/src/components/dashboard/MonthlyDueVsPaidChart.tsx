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
  ResponsiveContainer,
} from 'recharts';
import { usePrivacy } from '../../contexts/PrivacyContext';

interface MonthlyDataPoint {
  name: string;
  due: number;
  paid: number;
}

interface MonthlyDueVsPaidChartProps {
  data: MonthlyDataPoint[];
  currency?: string;
}

export const MonthlyDueVsPaidChart: React.FC<MonthlyDueVsPaidChartProps> = ({
  data,
  currency = 'USD',
}) => {
  const { privacyMode } = usePrivacy();

  const formatter = (val: number) => {
    if (privacyMode) return '•••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="w-full h-72 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#d1d5db' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#d1d5db' }}
            tickFormatter={(v: number) =>
              privacyMode
                ? '•••'
                : new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency,
                    notation: 'compact',
                    maximumFractionDigits: 0,
                  }).format(v)
            }
          />
          <Tooltip
            formatter={(value, name) => [formatter(Number(value)), String(name)]}
            labelStyle={{ color: '#374151', fontWeight: 600 }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              fontSize: 13,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 13 }}
          />
          <Bar
            name="Due"
            dataKey="due"
            fill="#0f766e"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            name="Paid"
            dataKey="paid"
            fill="#22c55e"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
