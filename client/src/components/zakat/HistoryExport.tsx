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
import { format } from 'date-fns';

interface Calculation {
  id: string;
  methodology: string;
  calendarType: string;
  calculationDate: string;
  totalWealth: number;
  nisabThreshold: number;
  zakatDue: number;
  zakatRate: number;
  assetBreakdown: Record<string, any>;
  notes?: string;
}

interface HistoryExportProps {
  calculations: Calculation[];
  onExport?: () => void;
}

export const HistoryExport: React.FC<HistoryExportProps> = ({ calculations, onExport }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');

  const exportAsJSON = () => {
    const data = {
      exportDate: new Date().toISOString(),
      calculationCount: calculations.length,
      calculations: calculations.map(calc => ({
        id: calc.id,
        date: calc.calculationDate,
        methodology: calc.methodology,
        calendarType: calc.calendarType,
        totalWealth: calc.totalWealth,
        nisabThreshold: calc.nisabThreshold,
        zakatDue: calc.zakatDue,
        zakatRate: calc.zakatRate,
        assetBreakdown: calc.assetBreakdown,
        notes: calc.notes
      }))
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zakat-history-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsCSV = () => {
    const headers = [
      'Date',
      'Methodology',
      'Calendar Type',
      'Total Wealth',
      'Nisab Threshold',
      'Zakat Due',
      'Zakat Rate',
      'Notes'
    ];

    const rows = calculations.map(calc => [
      format(new Date(calc.calculationDate), 'yyyy-MM-dd'),
      calc.methodology,
      calc.calendarType,
      calc.totalWealth.toFixed(2),
      calc.nisabThreshold.toFixed(2),
      calc.zakatDue.toFixed(2),
      calc.zakatRate.toFixed(2),
      calc.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zakat-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = () => {
    // Generate HTML for print
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Zakat Calculation History</title>
        <style>
          @media print {
            @page { 
              size: A4; 
              margin: 2cm; 
            }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 12px;
              color: #000;
            }
          }
          body {
            font-family: Arial, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            color: #059669;
            border-bottom: 2px solid #059669;
            padding-bottom: 10px;
            margin-bottom: 20px;
          }
          .summary {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          th {
            background-color: #f9fafb;
            font-weight: 600;
            color: #374151;
          }
          tr:hover {
            background-color: #f9fafb;
          }
          .methodology {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
          }
          .methodology-standard { background: #dbeafe; color: #1e40af; }
          .methodology-hanafi { background: #d1fae5; color: #065f46; }
          .methodology-shafi { background: #e9d5ff; color: #6b21a8; }
          .methodology-custom { background: #e5e7eb; color: #374151; }
          .amount {
            font-weight: 600;
            color: #059669;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 10px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <h1>Zakat Calculation History</h1>
        
        <div class="summary">
          <h2 style="margin-top: 0;">Summary</h2>
          <p><strong>Total Calculations:</strong> ${calculations.length}</p>
          <p><strong>Export Date:</strong> ${format(new Date(), 'PPPP')}</p>
          <p><strong>Total Zakat:</strong> $${calculations.reduce((sum, c) => sum + c.zakatDue, 0).toFixed(2)}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Methodology</th>
              <th>Wealth</th>
              <th>Nisab</th>
              <th>Zakat Due</th>
            </tr>
          </thead>
          <tbody>
            ${calculations.map(calc => `
              <tr>
                <td>${format(new Date(calc.calculationDate), 'MMM dd, yyyy')}</td>
                <td>
                  <span class="methodology methodology-${calc.methodology}">
                    ${calc.methodology.charAt(0).toUpperCase() + calc.methodology.slice(1)}
                  </span>
                </td>
                <td>$${calc.totalWealth.toFixed(2)}</td>
                <td>$${calc.nisabThreshold.toFixed(2)}</td>
                <td class="amount">$${calc.zakatDue.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>Generated by ZakApp - Secure Wealth & Zakat Portfolio</p>
          <p>"And establish prayer and give zakah and bow with those who bow." - Quran 2:43</p>
        </div>
      </body>
      </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleExport = async () => {
    if (calculations.length === 0) {
      toast.error('No calculations to export');
      return;
    }

    setIsExporting(true);

    try {
      switch (exportFormat) {
        case 'json':
          exportAsJSON();
          break;
        case 'csv':
          exportAsCSV();
          break;
        case 'pdf':
          exportAsPDF();
          break;
      }

      if (onExport) {
        onExport();
      }
    } catch (error) {
      toast.error('Failed to export calculations');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Export Calculation History
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Export Format
          </label>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="json">JSON (Complete Data)</option>
            <option value="csv">CSV (Spreadsheet)</option>
            <option value="pdf">PDF (Print-Friendly)</option>
          </select>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Export Summary
          </h4>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <p>• Calculations to export: <strong>{calculations.length}</strong></p>
            <p>• Format: <strong className="uppercase">{exportFormat}</strong></p>
            {exportFormat === 'json' && (
              <p className="text-xs mt-2 text-gray-500 dark:text-gray-500">
                JSON format includes complete calculation details and asset breakdowns
              </p>
            )}
            {exportFormat === 'csv' && (
              <p className="text-xs mt-2 text-gray-500 dark:text-gray-500">
                CSV format is compatible with Excel and Google Sheets
              </p>
            )}
            {exportFormat === 'pdf' && (
              <p className="text-xs mt-2 text-gray-500 dark:text-gray-500">
                PDF export opens a print dialog for saving or printing
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={isExporting || calculations.length === 0}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isExporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
        </button>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex">
            <svg
              className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Privacy Note:</strong> All exported data remains on your device. We recommend storing exported files securely and avoiding sharing sensitive financial information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryExport;
