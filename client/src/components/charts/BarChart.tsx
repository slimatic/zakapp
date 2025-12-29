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

interface BarChartProps {
  data: Array<{ [key: string]: any }>;
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
}

/**
 * Simple BarChart component using SVG
 * For production, consider using a charting library like recharts
 */
export const BarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  yKey,
  color = '#8B5CF6',
  height = 300
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  // Calculate dimensions
  const width = 400;
  const padding = 40;
  const barWidth = (width - 2 * padding) / data.length * 0.8;

  // Get data ranges
  const yValues = data.map(d => d[yKey]);
  const maxY = Math.max(...yValues);

  // Scale functions
  const scaleY = (y: number) => {
    return height - padding - (y / maxY) * (height - 2 * padding);
  };

  return (
    <div className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Axes */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#6b7280"
          strokeWidth="1"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#6b7280"
          strokeWidth="1"
        />

        {/* Bars */}
        {data.map((d, i) => {
          const barHeight = height - padding - scaleY(d[yKey]);
          const x = padding + (i * (width - 2 * padding) / data.length) + ((width - 2 * padding) / data.length - barWidth) / 2;
          const y = scaleY(d[yKey]);

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={color}
              rx="2"
            />
          );
        })}

        {/* Labels */}
        {data.map((d, i) => {
          const x = padding + (i * (width - 2 * padding) / data.length) + ((width - 2 * padding) / data.length) / 2;
          const label = typeof d[xKey] === 'string' && d[xKey].length > 10
            ? d[xKey].substring(0, 10) + '...'
            : d[xKey];

          return (
            <text
              key={`label-${i}`}
              x={x}
              y={height - padding + 15}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
};