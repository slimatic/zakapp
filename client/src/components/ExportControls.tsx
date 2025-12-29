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
import { Button } from './ui';

interface ExportControlsProps {
  onExport: (format: 'csv' | 'json' | 'pdf') => void;
  isExporting?: boolean;
  availableFormats?: ('csv' | 'json' | 'pdf')[];
}

/**
 * ExportControls Component
 * Provides export functionality for data in various formats
 */
export const ExportControls: React.FC<ExportControlsProps> = ({
  onExport,
  isExporting = false,
  availableFormats = ['csv', 'json', 'pdf']
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'json' | 'pdf'>('csv');

  const handleExport = () => {
    onExport(selectedFormat);
  };

  const formatLabels = {
    csv: 'CSV (Spreadsheet)',
    json: 'JSON (Data)',
    pdf: 'PDF (Report)'
  };

  const formatDescriptions = {
    csv: 'Compatible with Excel and other spreadsheet applications',
    json: 'Raw data format for developers and data analysis',
    pdf: 'Formatted report suitable for official records'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>

      <div className="space-y-4">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <div className="space-y-2">
            {availableFormats.map((format) => (
              <label key={format} className="flex items-center">
                <input
                  type="radio"
                  name="exportFormat"
                  value={format}
                  checked={selectedFormat === format}
                  onChange={(e) => setSelectedFormat(e.target.value as 'csv' | 'json' | 'pdf')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    {formatLabels[format]}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDescriptions[format]}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : `Export as ${selectedFormat.toUpperCase()}`}
          </Button>
        </div>

        {/* Additional Info */}
        <div className="text-sm text-gray-500 border-t pt-4">
          <p className="mb-2">
            <strong>Note:</strong> Exported data includes all your Zakat calculations and payment records.
          </p>
          <p>
            For privacy and security, exports are generated on-demand and not stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
};