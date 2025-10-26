import React from 'react';

interface LineChartProps {
  data: Array<{ [key: string]: any }>;
  xKey: string;
  yKey: string;
  color?: string;
  height?: number;
}

/**
 * Simple LineChart component using SVG
 * For production, consider using a charting library like recharts
 */
export const LineChart: React.FC<LineChartProps> = ({
  data,
  xKey,
  yKey,
  color = '#3B82F6',
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

  // Get data ranges
  const yValues = data.map(d => d[yKey]);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  // Scale functions
  const scaleX = (x: any, index: number) => {
    return padding + (index / (data.length - 1)) * (width - 2 * padding);
  };

  const scaleY = (y: number) => {
    return height - padding - ((y - minY) / (maxY - minY)) * (height - 2 * padding);
  };

  // Create path
  const pathData = data.map((d, i) => {
    const x = scaleX(d[xKey], i);
    const y = scaleY(d[yKey]);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

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

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />

        {/* Data points */}
        {data.map((d, i) => (
          <circle
            key={i}
            cx={scaleX(d[xKey], i)}
            cy={scaleY(d[yKey])}
            r="4"
            fill={color}
          />
        ))}
      </svg>
    </div>
  );
};