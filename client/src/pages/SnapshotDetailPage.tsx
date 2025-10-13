/**
 * SnapshotDetailPage - T069
 * Individual snapshot view/edit page with comprehensive actions
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnapshots } from '../hooks/useSnapshots';
import { useUpdateSnapshot } from '../hooks/useUpdateSnapshot';
import { useFinalizeSnapshot } from '../hooks/useFinalizeSnapshot';
import { useDeleteSnapshot } from '../hooks/useDeleteSnapshot';
import { AnnualSummaryCard } from '../components/tracking/AnnualSummaryCard';
import { SnapshotForm } from '../components/tracking/SnapshotForm';
import { PaymentList } from '../components/tracking/PaymentList';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { gregorianToHijri } from '../utils/calendarConverter';
import type { YearlySnapshot } from '../../../shared/types/tracking';

export const SnapshotDetailPage: React.FC = () => {
  const { snapshotId } = useParams<{ snapshotId: string }>();
  const navigate = useNavigate();
  // Check if URL ends with /edit to automatically enable edit mode
  const isEditRoute = window.location.pathname.endsWith('/edit');
  const [isEditMode, setIsEditMode] = useState(isEditRoute);

  const { data: snapshotsData, isLoading } = useSnapshots({
    page: 1,
    limit: 100, // Load all to find specific snapshot
  });

  const updateMutation = useUpdateSnapshot();
  const finalizeMutation = useFinalizeSnapshot();
  const deleteMutation = useDeleteSnapshot();

  // Find the specific snapshot
  const snapshot = snapshotsData?.snapshots.find((s) => s.id === snapshotId);

  const handleUpdateSnapshot = async (snapshotData: Partial<YearlySnapshot>) => {
    if (!snapshotId) return;

    try {
      await updateMutation.mutateAsync({
        id: snapshotId,
        data: snapshotData as any,
      });
      setIsEditMode(false);
      alert('Snapshot updated successfully!');
    } catch (error) {
      console.error('Failed to update snapshot:', error);
      alert('Failed to update snapshot. Please try again.');
    }
  };

  const handleFinalizeSnapshot = async () => {
    if (!snapshotId) return;

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

  const handleDeleteSnapshot = async () => {
    if (!snapshotId) return;

    if (!window.confirm('Are you sure you want to delete this snapshot? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(snapshotId);
      alert('Snapshot deleted successfully!');
      navigate('/tracking/snapshots');
    } catch (error) {
      console.error('Failed to delete snapshot:', error);
      alert('Failed to delete snapshot. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Snapshot Not Found</h2>
          <p className="text-gray-600 mb-6">The snapshot you're looking for doesn't exist or has been deleted.</p>
          <Button onClick={() => navigate('/tracking/snapshots')}>
            ← Back to Snapshots
          </Button>
        </div>
      </div>
    );
  }

  const hijriDate = gregorianToHijri(snapshot.calculationDate);
  const isFinalized = snapshot.status === 'finalized';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">
                  {snapshot.hijriYear} H / {snapshot.gregorianYear}
                </h1>
                {isFinalized && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Finalized
                  </span>
                )}
                {snapshot.isPrimary && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Primary
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-2">
                Created on {new Date(snapshot.createdAt).toLocaleDateString()} • 
                Last updated {new Date(snapshot.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="secondary" onClick={() => navigate('/tracking/snapshots')}>
                ← Back to List
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex items-center space-x-3">
          {!isFinalized && !isEditMode && (
            <>
              <Button onClick={() => setIsEditMode(true)}>
                Edit Snapshot
              </Button>
              <Button variant="secondary" onClick={handleFinalizeSnapshot}>
                Finalize Snapshot
              </Button>
            </>
          )}
          {isEditMode && (
            <Button variant="secondary" onClick={() => setIsEditMode(false)}>
              Cancel Editing
            </Button>
          )}
          <Button variant="danger" onClick={handleDeleteSnapshot}>
            Delete Snapshot
          </Button>
        </div>

        {/* Edit Mode */}
        {isEditMode && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Edit Snapshot</h2>
            <SnapshotForm
              snapshot={snapshot}
              onSubmit={handleUpdateSnapshot}
              onCancel={() => setIsEditMode(false)}
            />
          </div>
        )}

        {/* View Mode */}
        {!isEditMode && (
          <div className="space-y-8">
            {/* Annual Summary Card */}
            <AnnualSummaryCard snapshot={snapshot} />

            {/* Detailed Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Financial Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dates Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Dates
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gregorian Date:</span>
                      <span className="font-medium">{new Date(snapshot.calculationDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hijri Date:</span>
                      <span className="font-medium">
                        {hijriDate.hd}/{hijriDate.hm}/{hijriDate.hy} H
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gregorian Year:</span>
                      <span className="font-medium">{snapshot.gregorianYear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hijri Year:</span>
                      <span className="font-medium">{snapshot.hijriYear} H</span>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Financial Summary
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Wealth:</span>
                      <span className="font-medium">{snapshot.totalWealth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Liabilities:</span>
                      <span className="font-medium">{snapshot.totalLiabilities}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Zakatable Wealth:</span>
                      <span className="font-medium">{snapshot.zakatableWealth}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-900 font-semibold">Zakat Due:</span>
                      <span className="font-bold text-green-600">{snapshot.zakatAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Methodology */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Calculation Method
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Methodology:</span>
                      <span className="font-medium capitalize">{snapshot.methodologyUsed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nisab Threshold:</span>
                      <span className="font-medium">{snapshot.nisabThreshold}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Above Nisab:</span>
                      <span className={`font-medium ${snapshot.zakatableWealth > snapshot.nisabThreshold ? 'text-green-600' : 'text-red-600'}`}>
                        {snapshot.zakatableWealth > snapshot.nisabThreshold ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Payment Status
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-medium">{/* Implement payment aggregation if needed */}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining:</span>
                      <span className="font-medium">{/* Implement remaining calculation if needed */}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Progress:</span>
                      <span className="font-medium">{/* Implement progress calculation if needed */}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {snapshot.userNotes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                    Notes
                  </h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{snapshot.userNotes}</p>
                </div>
              )}
            </div>

            {/* Related Payments */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Related Payments</h2>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/tracking/payments?snapshot=${snapshotId}`)}
                >
                  View All Payments
                </Button>
              </div>
              <PaymentList
                snapshotId={snapshotId || ''}
                compact
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};