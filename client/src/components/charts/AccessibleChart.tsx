/**
 * Chart Text Alternatives Component
 * Provides accessible alternatives for data visualizations
 * 
 * WCAG 2.1 Success Criterion 1.1.1 (Non-text Content):
 * All non-text content must have a text alternative
 */

import React from 'react';

interface DataPoint {
  label: string;
  value: number;
  [key: string]: any;
}

interface ChartTextAlternativeProps {
  title: string;
  description: string;
  data: DataPoint[];
  type: 'bar' | 'line' | 'pie' | 'donut';
  valueFormatter?: (value: number) => string;
}

/**
 * Provides a text-based summary of chart data for screen readers
 */
export const ChartTextAlternative: React.FC<ChartTextAlternativeProps> = ({
  title,
  description,
  data,
  type,
  valueFormatter = (value) => value.toString()
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const max = Math.max(...data.map(item => item.value));
  const min = Math.min(...data.map(item => item.value));
  
  return (
    <div className="sr-only" aria-label={`${title} data summary`}>
      <h3>{title}</h3>
      <p>{description}</p>
      <p>Chart type: {type}</p>
      <p>Total items: {data.length}</p>
      <p>Total value: {valueFormatter(total)}</p>
      <p>Highest value: {valueFormatter(max)}</p>
      <p>Lowest value: {valueFormatter(min)}</p>
      <h4>Data points:</h4>
      <ul>
        {data.map((item, index) => (
          <li key={index}>
            {item.label}: {valueFormatter(item.value)}
            {type === 'pie' || type === 'donut' ? (
              <span> ({((item.value / total) * 100).toFixed(1)}% of total)</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Wrapper component for charts with accessibility features
 */
interface AccessibleChartProps {
  children: React.ReactNode;
  title: string;
  description: string;
  data: DataPoint[];
  type: 'bar' | 'line' | 'pie' | 'donut';
  valueFormatter?: (value: number) => string;
  ariaLabel?: string;
}

export const AccessibleChart: React.FC<AccessibleChartProps> = ({
  children,
  title,
  description,
  data,
  type,
  valueFormatter,
  ariaLabel
}) => {
  return (
    <figure 
      role="img" 
      aria-label={ariaLabel || `${title} chart`}
      className="relative"
    >
      <figcaption className="mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </figcaption>
      
      {/* Visual chart */}
      <div aria-hidden="true">
        {children}
      </div>
      
      {/* Text alternative for screen readers */}
      <ChartTextAlternative
        title={title}
        description={description}
        data={data}
        type={type}
        valueFormatter={valueFormatter}
      />
      
      {/* Data table alternative (visually hidden) */}
      <div className="sr-only">
        <table>
          <caption>Data table for {title}</caption>
          <thead>
            <tr>
              <th scope="col">Category</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <th scope="row">{item.label}</th>
                <td>{valueFormatter ? valueFormatter(item.value) : item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
};

export default AccessibleChart;
