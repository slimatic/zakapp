import React, { Suspense, useState, useEffect } from 'react';

// Lazy load the heavy chart component
const CalculationTrendsChart = React.lazy(() => import('./CalculationTrendsChart'));

interface TrendData {
  period: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  calculationCount: number;
  wealthTrend: Array<{
    date: string;
    wealth: number;
  }>;
  zakatTrend: Array<{
    date: string;
    zakat: number;
  }>;
  methodologyDistribution: Record<string, number>;
  averages: {
    wealth: number;
    zakat: number;
  };
  totals: {
    wealth: number;
    zakat: number;
  };
}

interface CalculationTrendsProps {
  userId?: string;
}

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const CalculationTrends: React.FC<CalculationTrendsProps> = ({ userId }) => {
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'1month' | '3months' | '6months' | '1year' | '2years' | 'all'>('1year');

  useEffect(() => {
    loadTrends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const loadTrends = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/calculations/trends/analysis?period=${selectedPeriod}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load trend analysis');
      }

      const data = await response.json();

      if (data.success) {
        setTrends(data.trends);
      } else {
        throw new Error(data.message || 'Failed to load trends');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error Loading Trends
            </h3>
            <div className="mt-2 text-sm text-red-700">
              {error}
            </div>
            <div className="mt-4">
              <button
                onClick={loadTrends}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trends) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <div className="text-gray-500">
          <p>No trend data available</p>
          <p className="text-sm mt-2">Complete some Zakat calculations to see trends</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CalculationTrendsChart
        wealthTrend={trends.wealthTrend}
        zakatTrend={trends.zakatTrend}
        methodologyDistribution={trends.methodologyDistribution}
        averages={trends.averages}
        totals={trends.totals}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />
    </Suspense>
  );
};

export default CalculationTrends;
