import React from 'react';

interface PieChartProps {
  data: Array<{ [key: string]: any }>;
  dataKey: string;
  nameKey: string;
  height?: number;
}

/**
 * Simple PieChart component using SVG
 * For production, consider using a charting library like recharts
 */
export const PieChart: React.FC<PieChartProps> = ({
  data,
  dataKey,
  nameKey,
  height = 300
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No data available
      </div>
    );
  }

  const radius = Math.min(150, height / 2 - 20);
  const centerX = 200;
  const centerY = height / 2;

  // Calculate total
  const total = data.reduce((sum, d) => sum + d[dataKey], 0);

  // Colors for segments
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];

  // Calculate segments
  let currentAngle = -90; // Start from top
  const segments = data.map((d, i) => {
    const value = d[dataKey];
    const percentage = value / total;
    const angle = percentage * 360;

    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    // Convert to radians
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    // Calculate path
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    currentAngle = endAngle;

    return {
      pathData,
      color: colors[i % colors.length],
      label: d[nameKey],
      value: d[dataKey],
      percentage
    };
  });

  return (
    <div className="w-full">
      <svg width="100%" height={height} viewBox={`0 0 400 ${height}`}>
        {/* Pie segments */}
        {segments.map((segment, i) => (
          <path
            key={i}
            d={segment.pathData}
            fill={segment.color}
            stroke="#ffffff"
            strokeWidth="2"
          />
        ))}

        {/* Legend */}
        <g transform={`translate(320, 20)`}>
          {segments.map((segment, i) => (
            <g key={`legend-${i}`} transform={`translate(0, ${i * 25})`}>
              <rect
                x="0"
                y="0"
                width="15"
                height="15"
                fill={segment.color}
                rx="2"
              />
              <text
                x="20"
                y="12"
                fontSize="12"
                fill="#374151"
              >
                {segment.label}: {(segment.percentage * 100).toFixed(1)}%
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
};