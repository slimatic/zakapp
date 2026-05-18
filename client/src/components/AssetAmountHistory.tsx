/**
 * Asset Amount History Component
 * Displays the history of amount changes for an asset
 */

import React, { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../config';

interface AssetAmountEvent {
  id: string;
  assetId: string;
  eventType: string;
  amount: number;
  currency: string;
  effectiveDate: string;
  recordedAt: string;
  userId: string;
  description?: string;
  source?: string;
}

interface AssetAmountHistoryProps {
  assetId: string;
  apiBaseUrl?: string;
}

export function AssetAmountHistory({ assetId, apiBaseUrl = getApiBaseUrl() }: AssetAmountHistoryProps) {
  const [history, setHistory] = useState<AssetAmountEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${apiBaseUrl}/assets/${assetId}/history`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        const data = await response.json();

        if (data.success) {
          setHistory(data.data);
        } else {
          setError(data.error?.message || 'Failed to load history');
        }
      } catch (err) {
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    }

    if (assetId) {
      loadHistory();
    }
  }, [assetId, apiBaseUrl]);

  if (loading) {
    return (
      <div className="asset-history p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="asset-history p-4 border rounded-lg bg-red-50">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="asset-history p-6 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">Amount History</h3>
        <p className="text-gray-500 text-sm">
          No history available yet. Changes to this asset's value will be tracked here automatically.
        </p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  const getEventTypeBadgeClass = (eventType: string) => {
    switch (eventType) {
      case 'CREATED':
        return 'bg-green-100 text-green-800';
      case 'UPDATED':
        return 'bg-blue-100 text-blue-800';
      case 'CORRECTION':
        return 'bg-yellow-100 text-yellow-800';
      case 'BACKPORT':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="asset-history p-6 border rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-4">Amount History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(event.effectiveDate)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(event.amount, event.currency)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEventTypeBadgeClass(
                      event.eventType
                    )}`}
                  >
                    {event.eventType}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {event.description || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-4">
        Total changes recorded: {history.length}
      </p>
    </div>
  );
}

export default AssetAmountHistory;
