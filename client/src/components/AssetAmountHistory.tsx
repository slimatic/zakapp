/**
 * Asset Amount History Component
 * Displays the history of amount changes for an asset
 */

import React, { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../config';
import { formatCurrency } from '../utils/formatters';

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
      <div className="asset-history p-4 border rounded-lg bg-surface-2">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-tertiary"></div>
          <span className="ml-2 text-muted-foreground">Loading history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="asset-history p-4 border rounded-lg bg-danger-soft">
        <p className="text-danger text-sm">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="asset-history p-6 border rounded-lg bg-surface-2">
        <h3 className="text-lg font-semibold mb-2">Amount History</h3>
        <p className="text-muted-foreground text-sm">
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


  const getEventTypeBadgeClass = (eventType: string) => {
    switch (eventType) {
      case 'CREATED':
        return 'bg-success-soft text-success';
      case 'UPDATED':
        return 'bg-accent text-secondary';
      case 'CORRECTION':
        return 'bg-warn-soft text-warn-strong';
      case 'BACKPORT':
        return 'bg-accent text-secondary';
      default:
        return 'bg-muted text-foreground';
    }
  };

  return (
    <div className="asset-history p-6 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold mb-4">Amount History</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface-2">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {history.map((event) => (
              <tr key={event.id} className="hover:bg-surface-2">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                  {formatDate(event.effectiveDate)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">
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
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {event.description || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Total changes recorded: {history.length}
      </p>
    </div>
  );
}

export default AssetAmountHistory;
