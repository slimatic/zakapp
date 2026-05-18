/**
 * BackportData Component
 * Allows importing historical asset data from CSV
 */

import React, { useState, useRef } from 'react';
import { BackportEntry } from '@zakapp/shared/types/assetAmountEvent';

interface BackportDataProps {
  assetId: string;
  assetName?: string;
  apiBaseUrl?: string;
  onSuccess?: (count: number) => void;
}

export function BackportData({
  assetId,
  assetName,
  apiBaseUrl = '/api',
  onSuccess
}: BackportDataProps) {
  const [entries, setEntries] = useState<BackportEntry[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (content: string): BackportEntry[] => {
    const lines = content.trim().split('\n');
    const result: BackportEntry[] = [];

    // Skip header if present
    const startIndex = lines[0]?.toLowerCase().includes('date') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle both comma and tab separators
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');

      if (parts.length >= 2) {
        const dateStr = parts[0].trim();
        const amountStr = parts[1].trim().replace(/[$,]/g, '');
        const description = parts[2]?.trim();

        const amount = parseFloat(amountStr);
        const effectiveDate = new Date(dateStr);

        if (!isNaN(amount) && !isNaN(effectiveDate.getTime())) {
          result.push({
            amount,
            effectiveDate: effectiveDate.toISOString(),
            description: description || `Imported from CSV (row ${i + 1})`
          });
        }
      }
    }

    return result;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCSV(content);
      setEntries(parsed);
      setError(null);
      setSuccess(null);
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (entries.length === 0) return;

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const token =
        typeof window !== 'undefined'
          ? window.localStorage.getItem('accessToken') || window.localStorage.getItem('token')
          : null;

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${apiBaseUrl}/assets/${assetId}/backport`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ entries })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Successfully imported ${data.data.count} historical entries`);
        setEntries([]);
        onSuccess?.(data.data.count);
      } else {
        setError(data.error?.message || 'Import failed');
      }
    } catch (err) {
      setError('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleClear = () => {
    setEntries([]);
    setError(null);
    setSuccess(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="backport-data p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">
        Backport Historical Data
        {assetName && <span className="text-gray-500 font-normal"> - {assetName}</span>}
      </h3>

      {/* CSV Template Info */}
      <div className="mb-4 p-3 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>CSV Format:</strong> date, amount, description (optional)
          <br />
          <strong>Example:</strong> 2023-01-15, 10000, Initial investment
        </p>
      </div>

      {/* File Upload */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          onChange={handleFileUpload}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {/* Preview */}
      {entries.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">
            Preview ({entries.length} entries)
          </h4>
          <div className="overflow-x-auto max-h-60 border rounded">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.slice(0, 10).map((entry, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2 text-sm">{formatDate(entry.effectiveDate)}</td>
                    <td className="px-3 py-2 text-sm font-medium">
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-500">
                      {entry.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {entries.length > 10 && (
              <p className="p-2 text-sm text-gray-500 text-center">
                ...and {entries.length - 10} more entries
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleImport}
          disabled={entries.length === 0 || importing}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {importing ? 'Importing...' : `Import ${entries.length} Entries`}
        </button>
        <button
          onClick={handleClear}
          disabled={entries.length === 0 || importing}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

export default BackportData;
