/**
 * ComparisonPage - T072
 * Multi-snapshot comparison interface
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSnapshots } from '../hooks/useSnapshots';
import { useComparison } from '../hooks/useComparison';
import { ComparisonTable } from '../components/tracking/ComparisonTable';
import { SnapshotCard } from '../components/tracking/SnapshotCard';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export const ComparisonPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Get snapshot IDs from URL if provided
  useEffect(() => {
    const snapshotsParam = searchParams.get('snapshots');
    if (snapshotsParam) {
      const ids = snapshotsParam.split(',').filter(Boolean);
      setSelectedIds(ids);
      if (ids.length >= 2) {
        setShowComparison(true);
      }
    }
  }, [searchParams]);

  const { data: snapshotsData, isLoading: isLoadingSnapshots } = useSnapshots({
    page: 1,
    limit: 100,
  });

  const { data: comparisonData, isLoading: isLoadingComparison } = useComparison({
    snapshotIds: selectedIds,
    enabled: showComparison && selectedIds.length >= 2,
  });

  const handleToggleSnapshot = (snapshotId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(snapshotId)) {
        return prev.filter(id => id !== snapshotId);
      }
      if (prev.length >= 5) {
        alert('Maximum 5 snapshots can be compared at once');
        return prev;
      }
      return [...prev, snapshotId];
    });
  };

  const handleCompare = () => {
    if (selectedIds.length < 2) {
      alert('Please select at least 2 snapshots to compare');
      return;
    }
    setShowComparison(true);
    // Update URL with selected snapshots
    navigate(`/tracking/comparison?snapshots=${selectedIds.join(',')}`);
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
    setShowComparison(false);
    navigate('/tracking/comparison');
  };

  if (isLoadingSnapshots) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const snapshots = snapshotsData?.snapshots || [];
  const finalized = snapshots.filter(s => s.status === 'finalized');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Year-Over-Year Comparison</h1>
              <p className="text-gray-600 mt-2">
                Compare multiple yearly snapshots to analyze trends and changes
              </p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/tracking')}>
              ← Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Selection Summary */}
        {!showComparison && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Selected Snapshots: {selectedIds.length} / 5
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Select 2-5 finalized snapshots to compare
                </p>
              </div>
              <div className="flex items-center space-x-3">
                {selectedIds.length >= 2 && (
                  <Button onClick={handleCompare}>
                    Compare Selected
                  </Button>
                )}
                {selectedIds.length > 0 && (
                  <Button variant="secondary" onClick={handleClearSelection}>
                    Clear Selection
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Comparison View */}
        {showComparison && comparisonData && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Comparison Results</h2>
                <Button variant="secondary" onClick={handleClearSelection}>
                  Change Selection
                </Button>
              </div>
              {isLoadingComparison ? (
                <div className="py-12 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <ComparisonTable snapshotIds={selectedIds} />
              )}
            </div>
          </div>
        )}

        {/* Snapshot Selection Grid */}
        {!showComparison && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Select Snapshots to Compare
              </h2>
              <p className="text-sm text-gray-600">
                Only finalized snapshots can be compared. Click on a snapshot to select/deselect it.
              </p>
            </div>

            {finalized.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Finalized Snapshots</h3>
                <p className="mt-2 text-gray-600">
                  You need at least 2 finalized snapshots to perform a comparison.
                </p>
                <div className="mt-6">
                  <Button onClick={() => navigate('/tracking/snapshots')}>
                    Go to Snapshots
                  </Button>
                </div>
              </div>
            ) : finalized.length === 1 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Need More Snapshots</h3>
                <p className="mt-2 text-gray-600">
                  You have 1 finalized snapshot. Create and finalize at least one more to compare.
                </p>
                <div className="mt-6">
                  <Button onClick={() => navigate('/tracking/snapshots')}>
                    Create Another Snapshot
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {finalized.map(snapshot => {
                  const isSelected = selectedIds.includes(snapshot.id);
                  return (
                    <div
                      key={snapshot.id}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'ring-4 ring-green-500 ring-opacity-50'
                          : 'hover:ring-2 hover:ring-gray-300'
                      }`}
                      onClick={() => handleToggleSnapshot(snapshot.id)}
                    >
                      <SnapshotCard
                        snapshot={snapshot}
                        compact
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-2">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-purple-800">
                About Year-Over-Year Comparisons
              </h3>
              <div className="text-sm text-purple-700 mt-2 space-y-2">
                <p>
                  Comparing snapshots helps you understand how your wealth and Zakat obligations have changed over time:
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li><strong>Wealth Growth</strong>: See how your zakatable wealth increased or decreased</li>
                  <li><strong>Zakat Trends</strong>: Identify patterns in your Zakat obligations</li>
                  <li><strong>Asset Changes</strong>: Track how your asset composition evolved</li>
                  <li><strong>Liability Management</strong>: Monitor changes in your debts and obligations</li>
                </ul>
                <p className="mt-2">
                  <strong>Tip:</strong> Compare snapshots from the same time of year for the most accurate year-over-year analysis.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};