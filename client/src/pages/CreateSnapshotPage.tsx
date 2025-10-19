/**
 * CreateSnapshotPage - T111
 * Page for creating a new yearly snapshot
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SnapshotForm } from '../components/tracking/SnapshotForm';
import { Button } from '../components/ui/Button';
import type { YearlySnapshot } from '@zakapp/shared/types/tracking';

import { API_BASE_URL } from '../api'; // Adjust path as needed to where API_BASE_URL is exported

export const CreateSnapshotPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateSnapshot = async (snapshotData: Partial<YearlySnapshot>) => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Use form data directly - it already includes calculationDate from SnapshotForm
      const payload = {
        calculationDate: snapshotData.calculationDate,
        gregorianYear: snapshotData.gregorianYear,
        gregorianMonth: snapshotData.gregorianMonth,
        gregorianDay: snapshotData.gregorianDay,
        hijriYear: snapshotData.hijriYear,
        hijriMonth: snapshotData.hijriMonth,
        hijriDay: snapshotData.hijriDay,
        totalWealth: snapshotData.totalWealth,
        totalLiabilities: snapshotData.totalLiabilities,
        zakatableWealth: snapshotData.zakatableWealth,
        zakatAmount: snapshotData.zakatAmount,
        methodologyUsed: snapshotData.methodologyUsed,
        nisabThreshold: snapshotData.nisabThreshold,
        nisabType: snapshotData.nisabType,
        status: snapshotData.status || 'draft',
        assetBreakdown: snapshotData.assetBreakdown || {},
        calculationDetails: snapshotData.calculationDetails || {},
        userNotes: snapshotData.userNotes || '',
        isPrimary: snapshotData.isPrimary || false
      };

      console.log('Creating snapshot with payload:', payload);

      const response = await fetch(`${API_BASE_URL}/tracking/snapshots`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to create snapshot' }));
        console.error('Backend error:', error);
        throw new Error(error.error?.message || error.message || 'Failed to create snapshot');
      }

      const result = await response.json();
      const createdSnapshot = result.data?.snapshot || result.snapshot;

      alert('Snapshot created successfully!');
      navigate(`/tracking/snapshots/${createdSnapshot.id}`);
    } catch (error: any) {
      console.error('Failed to create snapshot:', error);
      alert(`Failed to create snapshot: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Snapshot</h1>
              <p className="text-gray-600 mt-2">
                Record your current Zakat calculation as a yearly snapshot
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/tracking')}
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-900">
                About Snapshots
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  A snapshot captures your financial state and Zakat calculation at a specific point in time.
                  You can create multiple snapshots throughout the year as your financial situation changes.
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Start with a <strong>draft</strong> to refine your calculation</li>
                  <li><strong>Finalize</strong> when you're ready to lock it in</li>
                  <li>Finalized snapshots cannot be edited (but you can create a new one)</li>
                  <li>Track payments against finalized snapshots</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Snapshot Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <SnapshotForm
            onSubmit={handleCreateSnapshot}
            isLoading={isSubmitting}
            submitButtonText="Create Snapshot"
          />
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Need help? Visit the{' '}
            <button
              onClick={() => navigate('/help')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Getting Started Guide
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
