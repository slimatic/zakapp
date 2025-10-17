/**
 * SnapshotsPage - T068
 * List view with create functionality for yearly snapshots
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SnapshotList } from '../components/tracking/SnapshotList';
import { SnapshotForm } from '../components/tracking/SnapshotForm';
import { useCreateSnapshot } from '../hooks/useCreateSnapshot';
import { useFinalizeSnapshot } from '../hooks/useFinalizeSnapshot';
import { useDeleteSnapshot } from '../hooks/useDeleteSnapshot';
import { Button } from '../components/ui/Button';
import type { YearlySnapshot } from '@zakapp/shared/types/tracking';

export const SnapshotsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const createMutation = useCreateSnapshot();
  const finalizeMutation = useFinalizeSnapshot();
  const deleteMutation = useDeleteSnapshot();

  const handleCreateSnapshot = async (snapshotData: Partial<YearlySnapshot>) => {
    try {
      const newSnapshot = await createMutation.mutateAsync(snapshotData as any);
      setShowCreateForm(false);
      navigate(`/tracking/snapshots/${newSnapshot.snapshot.id}`);
    } catch (error) {
      console.error('Failed to create snapshot:', error);
    }
  };

  const handleViewSnapshot = (snapshotId: string) => {
    navigate(`/tracking/snapshots/${snapshotId}`);
  };

  const handleEditSnapshot = (snapshotId: string) => {
    navigate(`/tracking/snapshots/${snapshotId}/edit`);
  };

  const handleFinalizeSnapshot = async (snapshotId: string) => {
    if (!window.confirm('Are you sure you want to finalize this snapshot? It cannot be edited after finalization.')) {
      return;
    }

    try {
      await finalizeMutation.mutateAsync(snapshotId);
      alert('Snapshot finalized successfully!');
    } catch (error) {
      console.error('Failed to finalize snapshot:', error);
      alert('Failed to finalize snapshot. Please try again.');
    }
  };

  const handleDeleteSnapshot = async (snapshotId: string) => {
    if (!window.confirm('Are you sure you want to delete this snapshot? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(snapshotId);
      alert('Snapshot deleted successfully!');
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
      alert('Failed to delete snapshot. Please try again.');
    }
  };

  const handleCompareSelected = (snapshotIds: string[]) => {
    const ids = snapshotIds.join(',');
    navigate(`/tracking/comparison?snapshots=${ids}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Yearly Snapshots</h1>
              <p className="text-gray-600 mt-2">
                Track and manage your Zakat calculations over time
              </p>
            </div>
            <Button onClick={() => navigate('/tracking')}>
              ← Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create New Snapshot</h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <SnapshotForm
                  onSubmit={handleCreateSnapshot}
                  onCancel={() => setShowCreateForm(false)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Snapshot List */}
        <SnapshotList
          onCreateNew={() => setShowCreateForm(true)}
          onViewSnapshot={handleViewSnapshot}
          onEditSnapshot={handleEditSnapshot}
          onFinalizeSnapshot={handleFinalizeSnapshot}
          onDeleteSnapshot={handleDeleteSnapshot}
          onCompareSelected={handleCompareSelected}
          selectable
        />

        {/* Help Section */}
        <div className="mt-12 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                About Yearly Snapshots
              </h3>
              <div className="text-sm text-green-700 mt-2 space-y-2">
                <p>
                  <strong>Yearly snapshots</strong> are historical records of your Zakat calculations. 
                  Each snapshot captures your financial state at a specific point in time.
                </p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li><strong>Draft mode</strong>: Edit and refine your calculation</li>
                  <li><strong>Finalized mode</strong>: Lock the snapshot for historical accuracy</li>
                  <li><strong>Comparison</strong>: Select multiple snapshots to compare trends</li>
                  <li><strong>Primary snapshot</strong>: Mark your official annual record</li>
                </ul>
                <p className="mt-2">
                  <strong>Islamic Guidance:</strong> It's recommended to calculate Zakat annually on the same date 
                  (your Zakat anniversary) based on the Hijri or Gregorian calendar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};