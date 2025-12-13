import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAssets, useCreateAsset } from '../../services/apiHooks';
import { Asset, AssetCategoryType } from '@zakapp/shared';
import { Button, LoadingSpinner } from '../ui';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * AssetImportExport component for importing and exporting asset data
 */
export const AssetImportExport: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { data: assetsData } = useAssets();
  const createAssetMutation = useCreateAsset();

  const assets = assetsData?.data?.assets || [];

  // Export assets to CSV
  const handleExport = () => {
    if (assets.length === 0) {
      toast.error('No assets to export');
      return;
    }

    setExporting(true);

    try {
      // Define CSV headers
      const headers = [
        'Name',
        'Category',
        'Sub Category',
        'Value',
        'Currency',
        'Description',
        'Zakat Eligible',
        'Created Date',
        'Updated Date'
      ];

      // Convert assets to CSV rows
      const rows = assets.map((asset: Asset) => [
        `"${asset.name}"`,
        asset.category,
        asset.subCategory || '',
        asset.value.toString(),
        asset.currency,
        `"${asset.description || ''}"`,
        asset.zakatEligible ? 'Yes' : 'No',
        new Date(asset.createdAt).toLocaleDateString(),
        new Date(asset.updatedAt).toLocaleDateString()
      ]);

      // Combine headers and rows
      const csvContent = [headers.join(','), ...rows.map((row: string[]) => row.join(','))].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `zakapp-assets-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast.error('Failed to export assets. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Export assets to JSON
  const handleExportJSON = () => {
    if (assets.length === 0) {
      toast.error('No assets to export');
      return;
    }

    setExporting(true);

    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        totalAssets: assets.length,
        assets: assets.map((asset: Asset) => ({
          name: asset.name,
          category: asset.category,
          subCategory: asset.subCategory,
          value: asset.value,
          currency: asset.currency,
          description: asset.description,
          zakatEligible: asset.zakatEligible,
          createdAt: asset.createdAt,
          updatedAt: asset.updatedAt
        }))
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `zakapp-assets-${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      toast.error('Failed to export assets. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Parse CSV content
  const parseCSV = (content: string): any[] => {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',');
      const asset: any = {};
      
      headers.forEach((header, i) => {
        const value = values[i]?.replace(/"/g, '').trim();
        
        switch (header) {
          case 'name':
            asset.name = value;
            break;
          case 'category':
            asset.category = value as AssetCategoryType;
            break;
          case 'sub category':
          case 'subcategory':
            asset.subCategory = value;
            break;
          case 'value':
            asset.value = parseFloat(value) || 0;
            break;
          case 'currency':
            asset.currency = value || 'USD';
            break;
          case 'description':
            asset.description = value;
            break;
          case 'zakat eligible':
            asset.zakatEligible = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true';
            break;
        }
      });

      // Validate required fields
      if (!asset.name || !asset.category || asset.value === undefined) {
        throw new Error(`Invalid data in row ${index + 2}: Missing required fields`);
      }

      return asset;
    });
  };

  // Import assets from file
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        let assetsToImport: any[] = [];

        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const jsonData = JSON.parse(e.target?.result as string);
          assetsToImport = jsonData.assets || [jsonData]; // Support both array and single object
        } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          assetsToImport = parseCSV(e.target?.result as string);
        } else {
          throw new Error('Unsupported file format. Please use CSV or JSON files.');
        }

        // Import assets one by one
        let successful = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const asset of assetsToImport) {
          try {
            await new Promise((resolve, reject) => {
              createAssetMutation.mutate(asset, {
                onSuccess: resolve,
                onError: reject
              });
            });
            successful++;
          } catch (error: any) {
            failed++;
            errors.push(`${asset.name}: ${error?.message || 'Unknown error'}`);
          }
        }

        setImportResult({
          success: successful,
          failed: failed,
          errors: errors
        });

      } catch (error: any) {
        toast.error('Import failed');
        setImportResult({
          success: 0,
          failed: 1,
          errors: [error?.message || 'Failed to parse file']
        });
      } finally {
        setImporting(false);
        // Reset file input
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
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Import & Export Assets</h1>
        <p className="text-lg text-gray-600">
          Backup your assets or import data from external sources
        </p>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Assets</h2>
        <p className="text-gray-600 mb-6">
          Download your assets in CSV or JSON format for backup or external use.
          Currently you have <strong>{assets.length}</strong> assets.
        </p>

        <div className="flex flex-wrap gap-4">
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={exporting || assets.length === 0}
            isLoading={exporting}
          >
            📊 Export as CSV
          </Button>
          <Button
            variant="secondary"
            onClick={handleExportJSON}
            disabled={exporting || assets.length === 0}
            isLoading={exporting}
          >
            📋 Export as JSON
          </Button>
        </div>

        {assets.length === 0 && (
          <div className="mt-4 text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            No assets to export. Add some assets first.
          </div>
        )}
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Assets</h2>
        <p className="text-gray-600 mb-6">
          Upload a CSV or JSON file to import multiple assets at once.
        </p>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block">
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleImport}
              disabled={importing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
          </label>
          <p className="mt-1 text-xs text-gray-500">
            Supported formats: CSV, JSON (max 10MB)
          </p>
        </div>

        {/* Loading State */}
        {importing && (
          <div className="flex items-center space-x-2 text-blue-600">
            <LoadingSpinner size="sm" />
            <span>Importing assets...</span>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className={`rounded-lg p-4 ${
            importResult.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <h3 className={`font-semibold ${
              importResult.failed === 0 ? 'text-green-900' : 'text-yellow-900'
            }`}>
              Import Results
            </h3>
            <div className="mt-2 text-sm">
              <p className="text-green-700">✅ Successfully imported: {importResult.success} assets</p>
              {importResult.failed > 0 && (
                <p className="text-red-700">❌ Failed to import: {importResult.failed} assets</p>
              )}
            </div>

            {importResult.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-red-900 mb-2">Errors:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {importResult.errors.slice(0, 5).map((error, index) => (
                    <li key={index} className="break-all">• {error}</li>
                  ))}
                  {importResult.errors.length > 5 && (
                    <li className="text-red-600">...and {importResult.errors.length - 5} more errors</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* File Format Examples */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">File Format Examples</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CSV Example */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">CSV Format</h3>
            <pre className="bg-white border border-gray-200 rounded-lg p-3 text-xs overflow-x-auto">
{`Name,Category,Sub Category,Value,Currency,Description,Zakat Eligible
"Chase Savings",cash,savings,5000,USD,"Emergency fund",Yes
"Gold Jewelry",gold,jewelry,3000,USD,"Wedding jewelry",Yes
"Rental Property",property,residential_investment,150000,USD,"Investment property",No`}
            </pre>
          </div>

          {/* JSON Example */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">JSON Format</h3>
            <pre className="bg-white border border-gray-200 rounded-lg p-3 text-xs overflow-x-auto">
{`{
  "assets": [
    {
      "name": "Chase Savings",
      "category": "cash",
      "subCategory": "savings",
      "value": 5000,
      "currency": "USD",
      "description": "Emergency fund",
      "zakatEligible": true
    }
  ]
}`}
            </pre>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">📝 Important Notes</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li><strong>Required fields:</strong> Name, Category, Value</li>
            <li><strong>Valid categories:</strong> cash, gold, silver, business, property, stocks, crypto, debts, expenses</li>
            <li><strong>Currency format:</strong> Use 3-letter ISO codes (USD, EUR, GBP, etc.)</li>
            <li><strong>Zakat Eligible:</strong> Use "Yes/No" for CSV, true/false for JSON</li>
            <li><strong>Duplicates:</strong> Assets with identical names will be treated as separate entries</li>
            <li><strong>Validation:</strong> Invalid entries will be skipped with error messages</li>
          </ul>
        </div>
      </div>
    </div>
  );
};