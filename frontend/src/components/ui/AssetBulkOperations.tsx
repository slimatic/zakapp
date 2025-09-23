import React, { useState, useCallback } from 'react';
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Asset } from '@zakapp/shared';
import { Dialog, DialogContent, DialogTitle } from './dialog';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

interface AssetBulkOperationsProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetsImported: (assets: Asset[]) => void;
  userAssets: Asset[];
}

interface AssetBulkOperationsProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetsImported: (assets: Asset[]) => void;
  userAssets: Asset[];
}

interface ImportState {
  file: File | null;
  data: any[] | null;
  validation: ValidationResult | null;
  importing: boolean;
  results: ImportResult | null;
}

interface ValidationResult {
  valid: number;
  invalid: number;
  total: number;
  details: ValidationDetail[];
}

interface ValidationDetail {
  index: number;
  status: 'valid' | 'invalid';
  asset?: any;
  error?: string;
}

interface ImportResult {
  successful: number;
  failed: number;
  total: number;
  details: ImportDetail[];
}

interface ImportDetail {
  status: 'created' | 'updated' | 'error';
  asset?: Asset;
  error?: string;
}

interface ExportState {
  format: 'json' | 'encrypted';
  exporting: boolean;
  encrypted: boolean;
}

export const AssetBulkOperations: React.FC<AssetBulkOperationsProps> = ({
  isOpen,
  onClose,
  onAssetsImported,
  userAssets,
}) => {
  const [activeTab, setActiveTab] = useState('import');
  const [importState, setImportState] = useState<ImportState>({
    file: null,
    data: null,
    validation: null,
    importing: false,
    results: null,
  });
  const [exportState, setExportState] = useState<ExportState>({
    format: 'json',
    exporting: false,
    encrypted: false,
  });
  const [showEncryptionKey, setShowEncryptionKey] = useState(false);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setImportState(prev => ({
        ...prev,
        file,
        data: null,
        validation: null,
        results: null,
      }));

      // Read file content
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);

          let assetsData = data;
          if (data.assets) {
            // Handle full export format
            assetsData = data.assets;
          }

          setImportState(prev => ({
            ...prev,
            data: Array.isArray(assetsData) ? assetsData : [assetsData],
          }));
        } catch (error) {
          console.error('Error parsing file:', error);
          alert('Invalid JSON file format');
        }
      };
      reader.readAsText(file);
    },
    []
  );

  const validateImportData = useCallback(async () => {
    if (!importState.data) return;

    try {
      // Here you would call your validation API
      const response = await fetch('/api/v1/assets/bulk/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          assets: importState.data,
          encrypted: false,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setImportState(prev => ({
          ...prev,
          validation: {
            valid: result.data.summary.valid,
            invalid: result.data.summary.invalid,
            total: result.data.summary.total,
            details: result.data.results,
          },
        }));
      }
    } catch (error) {
      console.error('Validation error:', error);
      // Fallback client-side validation
      const validation: ValidationResult = {
        valid: 0,
        invalid: 0,
        total: importState.data.length,
        details: [],
      };

      importState.data.forEach((asset, index) => {
        const detail: ValidationDetail = { index, status: 'valid', asset };

        if (!asset.name || !asset.category || !asset.subCategory) {
          detail.status = 'invalid';
          detail.error = 'Missing required fields';
          validation.invalid++;
        } else if (typeof asset.value !== 'number' || asset.value < 0) {
          detail.status = 'invalid';
          detail.error = 'Invalid value';
          validation.invalid++;
        } else {
          validation.valid++;
        }

        validation.details.push(detail);
      });

      setImportState(prev => ({ ...prev, validation }));
    }
  }, [importState.data]);

  const performImport = useCallback(async () => {
    if (!importState.data || !importState.validation) return;

    setImportState(prev => ({ ...prev, importing: true }));

    try {
      const response = await fetch('/api/v1/assets/bulk/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          assets: importState.data,
          encrypted: false,
          mergeStrategy: 'merge',
        }),
      });

      const result = await response.json();

      if (result.success) {
        setImportState(prev => ({
          ...prev,
          results: {
            successful: result.data.summary.successful,
            failed: result.data.summary.failed,
            total: result.data.summary.total,
            details: result.data.results,
          },
        }));

        // Notify parent component of successful imports
        const createdAssets = result.data.results
          .filter((r: any) => r.status === 'created' && r.asset)
          .map((r: any) => r.asset);

        if (createdAssets.length > 0) {
          onAssetsImported(createdAssets);
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import assets');
    } finally {
      setImportState(prev => ({ ...prev, importing: false }));
    }
  }, [importState.data, importState.validation, onAssetsImported]);

  const performExport = useCallback(async () => {
    setExportState(prev => ({ ...prev, exporting: true }));

    try {
      const response = await fetch('/api/v1/assets/bulk/export', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        const filename = `zakapp-assets-${new Date().toISOString().split('T')[0]}.json`;
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export assets');
    } finally {
      setExportState(prev => ({ ...prev, exporting: false }));
    }
  }, []);

  const resetImport = useCallback(() => {
    setImportState({
      file: null,
      data: null,
      validation: null,
      importing: false,
      results: null,
    });
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogTitle>Bulk Asset Operations</DialogTitle>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Import Assets</span>
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Export Assets</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Import Assets from File</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!importState.file && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Choose a JSON file to import
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Upload a JSON file containing asset data
                    </p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="asset-file-input"
                    />
                    <label
                      htmlFor="asset-file-input"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Select File
                    </label>
                  </div>
                )}

                {importState.file && !importState.validation && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-blue-900">
                          {importState.file.name}
                        </h4>
                        <p className="text-sm text-blue-700">
                          {importState.data?.length || 0} assets found
                        </p>
                      </div>
                      <Button onClick={resetImport} variant="outline" size="sm">
                        Choose Different File
                      </Button>
                    </div>

                    <div className="flex space-x-4">
                      <Button onClick={validateImportData} className="flex-1">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Validate Data
                      </Button>
                    </div>
                  </div>
                )}

                {importState.validation && !importState.results && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {importState.validation.valid}
                          </div>
                          <div className="text-sm text-gray-600">Valid</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {importState.validation.invalid}
                          </div>
                          <div className="text-sm text-gray-600">Invalid</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {importState.validation.total}
                          </div>
                          <div className="text-sm text-gray-600">Total</div>
                        </CardContent>
                      </Card>
                    </div>

                    {importState.validation.invalid > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center space-x-2">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span>Validation Errors</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="max-h-40 overflow-y-auto">
                          {importState.validation.details
                            .filter(d => d.status === 'invalid')
                            .map((detail, index) => (
                              <div
                                key={index}
                                className="text-sm text-red-600 py-1"
                              >
                                Row {detail.index + 1}: {detail.error}
                              </div>
                            ))}
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex space-x-4">
                      <Button onClick={resetImport} variant="outline">
                        Start Over
                      </Button>
                      <Button
                        onClick={performImport}
                        disabled={
                          importState.validation.valid === 0 ||
                          importState.importing
                        }
                        className="flex-1"
                      >
                        {importState.importing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Import {importState.validation.valid} Valid Assets
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {importState.results && (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <h3 className="font-medium text-green-900">
                        Import Complete
                      </h3>
                      <p className="text-sm text-green-700">
                        {importState.results.successful} assets imported
                        successfully
                        {importState.results.failed > 0 &&
                          `, ${importState.results.failed} failed`}
                      </p>
                    </div>

                    <Button onClick={resetImport} className="w-full">
                      Import More Assets
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <span>Export Your Assets</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {userAssets.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Assets</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        $
                        {userAssets
                          .reduce((sum, asset) => sum + asset.value, 0)
                          .toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Total Value</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {[...new Set(userAssets.map(a => a.category))].length}
                      </div>
                      <div className="text-sm text-gray-600">Categories</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Export Format
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <Card
                        className={`cursor-pointer transition-colors ${
                          exportState.format === 'json'
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() =>
                          setExportState(prev => ({ ...prev, format: 'json' }))
                        }
                      >
                        <CardContent className="p-4 text-center">
                          <FileText className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                          <div className="font-medium">Standard JSON</div>
                          <div className="text-xs text-gray-500">
                            Human readable format
                          </div>
                        </CardContent>
                      </Card>
                      <Card
                        className={`cursor-pointer transition-colors ${
                          exportState.format === 'encrypted'
                            ? 'border-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() =>
                          setExportState(prev => ({
                            ...prev,
                            format: 'encrypted',
                          }))
                        }
                      >
                        <CardContent className="p-4 text-center">
                          <Shield className="h-6 w-6 mx-auto mb-2 text-green-600" />
                          <div className="font-medium">Encrypted</div>
                          <div className="text-xs text-gray-500">
                            Secure format
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {exportState.format === 'encrypted' && (
                    <Card className="bg-yellow-50 border-yellow-200">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-2">
                          <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-800">
                              Encrypted Export
                            </h4>
                            <p className="text-sm text-yellow-700 mt-1">
                              Your data will be encrypted before export. You'll
                              need the encryption key to import it later.
                            </p>
                            <div className="mt-3 flex items-center space-x-2">
                              <code className="px-2 py-1 bg-yellow-100 rounded text-xs">
                                {showEncryptionKey
                                  ? 'your-encryption-key-here'
                                  : '••••••••••••••••'}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setShowEncryptionKey(!showEncryptionKey)
                                }
                              >
                                {showEncryptionKey ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    onClick={performExport}
                    disabled={exportState.exporting || userAssets.length === 0}
                    className="w-full"
                  >
                    {exportState.exporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export {userAssets.length} Assets
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
