/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { usePayments, useCreatePayment } from '../../hooks/usePayments';
import { Button, LoadingSpinner } from '../ui';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * PaymentImportExport component for importing and exporting payment data
 */
export const PaymentImportExport: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { data: paymentsData } = usePayments();
  const createPaymentMutation = useCreatePayment();

  const payments = paymentsData?.payments || [];

  // Export payments to CSV
  const handleExportCSV = () => {
    if (payments.length === 0) {
      toast.error('No payments to export');
      return;
    }

    setExporting(true);

    try {
      const headers = [
        'Payment Date',
        'Amount',
        'Currency',
        'Snapshot ID',
        'Calculation ID',
        'Recipient Name',
        'Recipient Type',
        'Recipient Category',
        'Payment Method',
        'Receipt Reference',
        'Notes',
        'Status'
      ];

      const rows = payments.map((p: any) => [
        p.paymentDate ? new Date(p.paymentDate).toISOString() : '',
        (p.amount || 0).toString(),
        p.currency || '',
        p.snapshotId || p.snapshot || '',
        p.calculationId || '',
        `"${p.recipientName || ''}"`,
        p.recipientType || '',
        p.recipientCategory || '',
        p.paymentMethod || '',
        p.receiptReference || p.receiptNumber || '',
        `"${p.notes || ''}"`,
        p.status || ''
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `zakapp-payments-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast.error('Failed to export payments. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Export payments to JSON
  const handleExportJSON = () => {
    if (payments.length === 0) {
      toast.error('No payments to export');
      return;
    }

    setExporting(true);

    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        totalPayments: payments.length,
        payments: payments.map((p: any) => ({
          id: p.id,
          paymentDate: p.paymentDate,
          amount: p.amount,
          currency: p.currency,
          snapshotId: p.snapshotId || p.snapshot || null,
          calculationId: p.calculationId || null,
          recipientName: p.recipientName,
          recipientType: p.recipientType,
          recipientCategory: p.recipientCategory,
          paymentMethod: p.paymentMethod,
          receiptReference: p.receiptReference || p.receiptNumber,
          notes: p.notes,
          status: p.status
        }))
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `zakapp-payments-${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast.error('Failed to export payments. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Basic CSV parser for payments
  const parseCSV = (content: string): any[] => {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());

    return lines.slice(1).map((line, index) => {
      const values = line.split(',');
      const payment: any = {};

      headers.forEach((header, i) => {
        const value = values[i]?.replace(/"/g, '').trim();

        switch (header) {
          case 'payment date':
            payment.paymentDate = value;
            break;
          case 'amount':
            payment.amount = parseFloat(value) || 0;
            break;
          case 'currency':
            payment.currency = value || 'USD';
            break;
          case 'snapshot id':
            payment.snapshotId = value;
            break;
          case 'calculation id':
            payment.calculationId = value;
            break;
          case 'recipient name':
            payment.recipientName = value;
            break;
          case 'recipient type':
            payment.recipientType = value;
            break;
          case 'recipient category':
            payment.recipientCategory = value;
            break;
          case 'payment method':
            payment.paymentMethod = value;
            break;
          case 'receipt reference':
            payment.receiptReference = value;
            break;
          case 'notes':
            payment.notes = value;
            break;
          case 'status':
            payment.status = value;
            break;
        }
      });

      // Validate required fields
      if (!payment.paymentDate || !payment.amount || !payment.recipientName) {
        throw new Error(`Invalid data in row ${index + 2}: Missing required fields (paymentDate, amount, recipientName)`);
      }

      // Default snapshotId to empty string if missing - use caller to provide mapping
      payment.snapshotId = payment.snapshotId || '';

      return payment;
    });
  };

  // Import payments from file
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let paymentsToImport: any[] = [];

        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const jsonData = JSON.parse(e.target?.result as string);
          paymentsToImport = jsonData.payments || [jsonData];
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          paymentsToImport = parseCSV(e.target?.result as string);
        } else {
          throw new Error('Unsupported file format. Please use CSV or JSON files.');
        }

        let successful = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const p of paymentsToImport) {
          try {
            // Ensure snapshotId is provided; if not, we skip and report error
            if (!p.snapshotId) {
              throw new Error('Missing required snapshot ID for payment');
            }

            await new Promise((resolve, reject) => {
              createPaymentMutation.mutate({
                snapshotId: p.snapshotId,
                amount: p.amount,
                paymentDate: p.paymentDate,
                recipientName: p.recipientName,
                recipientType: p.recipientType || 'individual',
                recipientCategory: p.recipientCategory || 'fakir',
                paymentMethod: p.paymentMethod || 'cash',
                receiptReference: p.receiptReference,
                notes: p.notes,
                status: p.status || 'recorded',
                currency: p.currency || 'USD',
                calculationId: p.calculationId
              }, {
                onSuccess: resolve,
                onError: reject
              });
            });

            successful++;
          } catch (error: any) {
            failed++;
            errors.push(`${p.recipientName || 'unknown'}: ${error?.message || 'Unknown error'}`);
          }
        }

        setImportResult({ success: successful, failed, errors });
      } catch (error: any) {
        toast.error('Import failed');
        setImportResult({ success: 0, failed: 1, errors: [error?.message || 'Failed to parse file'] });
      } finally {
        setImporting(false);
        if (event.target) {
          event.target.value = '';
        }
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Import & Export Payments</h1>
        <p className="text-lg text-gray-600">Backup or import Zakat payment records for tracking and reporting.</p>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Payments</h2>
        <p className="text-gray-600 mb-6">Download your payments in CSV or JSON format. Currently you have <strong>{payments.length}</strong> payments.</p>

        <div className="flex flex-wrap gap-4">
          <Button variant="default" onClick={handleExportCSV} disabled={exporting || payments.length === 0} isLoading={exporting}>📊 Export as CSV</Button>
          <Button variant="secondary" onClick={handleExportJSON} disabled={exporting || payments.length === 0} isLoading={exporting}>📋 Export as JSON</Button>
        </div>

        {payments.length === 0 && (
          <div className="mt-4 text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">No payments to export.</div>
        )}
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Payments</h2>
        <p className="text-gray-600 mb-6">Upload a CSV or JSON file to import multiple payments at once. Each payment must include a `snapshotId` (Nisab Year Record).</p>

        <div className="mb-6">
          <label className="block">
            <input type="file" accept=".csv,.json" onChange={handleImport} disabled={importing} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50" />
          </label>
          <p className="mt-1 text-xs text-gray-500">Supported formats: CSV, JSON (max 10MB). CSV requires headers: Payment Date,Amount,Currency,Snapshot ID,Recipient Name</p>
        </div>

        {importing && (
          <div className="flex items-center space-x-2 text-blue-600"><LoadingSpinner size="sm" /><span>Importing payments...</span></div>
        )}

        {importResult && (
          <div className={`rounded-lg p-4 ${importResult.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
            <h3 className={`font-semibold ${importResult.failed === 0 ? 'text-green-900' : 'text-yellow-900'}`}>Import Results</h3>
            <div className="mt-2 text-sm">
              <p className="text-green-700">✅ Successfully imported: {importResult.success} payments</p>
              {importResult.failed > 0 && (<p className="text-red-700">❌ Failed to import: {importResult.failed} payments</p>)}
            </div>

            {importResult.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {importResult.errors.slice(0,5).map((error, index) => (<li key={index} className="break-all">• {error}</li>))}
                  {importResult.errors.length > 5 && (<li className="text-red-600">...and {importResult.errors.length - 5} more errors</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentImportExport;
