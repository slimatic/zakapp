import React, { useState, useEffect } from 'react';
import { useAssets, useZakatCalculation, useZakatMethodologies, useCompareMethodologies } from '../../services/apiHooks';
import { Asset, ZakatMethodology } from '@zakapp/shared';
import { Button, LoadingSpinner, ErrorMessage } from '../../components/ui';
import { ZakatResults, MethodologySelector } from '../../components/zakat';

interface CalculationParams {
  methodology: 'STANDARD' | 'HANAFI' | 'SHAFII' | 'CUSTOM';
  calendarType: 'GREGORIAN' | 'HIJRI';
  calculationDate: string;
  includeAssets: string[];
  includeLiabilities: string[];
  customRules?: {
    zakatRate?: number;
    nisabSource?: 'gold' | 'silver';
    regionalAdjustments?: any;
  };
}

/**
 * Enhanced Zakat Calculator Main Page
 * Provides comprehensive Zakat calculation with multiple methodologies,
 * real-time asset selection, Islamic compliance validation, and educational content
 */
export const Calculator: React.FC = () => {
  // State management
  const [calculationParams, setCalculationParams] = useState<CalculationParams>({
    methodology: 'STANDARD',
    calendarType: 'HIJRI',
    calculationDate: new Date().toISOString().split('T')[0],
    includeAssets: [],
    includeLiabilities: []
  });
  
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [showMethodologyComparison, setShowMethodologyComparison] = useState(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [saveCalculationName, setSaveCalculationName] = useState('');
  const [comparisonResults, setComparisonResults] = useState<any>(null);

  // API hooks
  const { data: assets, isLoading: assetsLoading, error: assetsError } = useAssets();
  const { data: methodologies, isLoading: methodologiesLoading } = useZakatMethodologies();
  const zakatCalculation = useZakatCalculation();
  const compareMethodologies = useCompareMethodologies();

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/user/settings', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.settings?.preferredMethodology) {
            setCalculationParams(prev => ({
              ...prev,
              methodology: (data.settings.preferredMethodology.toUpperCase() as 'STANDARD' | 'HANAFI' | 'SHAFII' | 'CUSTOM') || 'STANDARD',
              calendarType: data.settings.preferredCalendar === 'hijri' ? 'HIJRI' : 'GREGORIAN'
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };
    
    loadPreferences();
  }, []);

  // Initialize selected assets when assets load
  useEffect(() => {
    if (assets?.data && selectedAssets.length === 0) {
      // Select all Zakat-eligible assets by default
      const eligibleAssets = assets.data
        .filter((asset: Asset) => asset.zakatEligible)
        .map((asset: Asset) => asset.assetId);
      setSelectedAssets(eligibleAssets);
      setCalculationParams(prev => ({ ...prev, includeAssets: eligibleAssets }));
    }
  }, [assets, selectedAssets.length]);

  // Handlers
  const handleAssetSelectionChange = (assetId: string, isSelected: boolean) => {
    const updatedSelection = isSelected 
      ? [...selectedAssets, assetId]
      : selectedAssets.filter(id => id !== assetId);
    
    setSelectedAssets(updatedSelection);
    setCalculationParams(prev => ({ ...prev, includeAssets: updatedSelection }));
  };

  const handleCalculateZakat = async () => {
    try {
      console.log('🔍 Calculation Request:', {
        method: calculationParams.methodology.toLowerCase(),
        calendarType: calculationParams.calendarType === 'HIJRI' ? 'lunar' : 'solar',
        calculationDate: calculationParams.calculationDate,
        includeAssets: calculationParams.includeAssets
      });
      
      const result = await zakatCalculation.mutateAsync({
        method: calculationParams.methodology.toLowerCase() as 'standard' | 'hanafi' | 'shafii' | 'maliki' | 'hanbali' | 'custom',
        calendarType: calculationParams.calendarType === 'HIJRI' ? 'lunar' : 'solar',
        calculationDate: calculationParams.calculationDate,
        includeAssets: calculationParams.includeAssets,
        includeLiabilities: calculationParams.includeLiabilities
      });
      
      console.log('📥 API Response:', {
        resultData: result.data,
        success: result.success
      });
      
      if (!result.success || !result.data?.calculation) {
        throw new Error(result.message || 'Calculation failed');
      }

      // Transform API response to match ZakatCalculation interface
      const calcResult = result.data.calculation;
      const transformedResult: any = {
        id: calcResult.id,
        calculationDate: calcResult.calculationDate,
        methodology: calcResult.methodology,
        calendarType: calcResult.calendarType,
        summary: {
          totalAssets: calcResult.totalWealth,
          totalLiabilities: 0, // TODO: Implement liabilities
          netWorth: calcResult.totalWealth,
          nisabThreshold: calcResult.nisabThreshold,
          nisabSource: 'gold', // TODO: Get from API
          isZakatObligatory: calcResult.isAboveNisab,
          zakatAmount: calcResult.zakatDue,
          zakatRate: calcResult.zakatRate
        },
        breakdown: {
          assetsByCategory: calcResult.assetBreakdown || [],
          liabilities: []
        },
        educationalContent: {
          methodologyExplanation: 'Calculation completed using selected methodology',
          scholarlyReferences: [],
          nisabExplanation: `Nisab threshold: ${calcResult.nisabThreshold}`
        }
      };
      
      console.log('✅ Transformed Result:', {
        methodology: transformedResult.methodology,
        totalWealth: transformedResult.summary.totalAssets,
        zakatDue: transformedResult.summary.zakatAmount
      });
      
      setCalculationResult(transformedResult);
    } catch (error) {
      console.error('Zakat calculation failed:', error);
      // Error is already handled by the mutation
    }
  };

  const handleSaveCalculation = async () => {
    if (!calculationResult) {
      alert('Please calculate Zakat first');
      return;
    }
    
    try {
      const response = await fetch('/api/calculations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          methodology: calculationParams.methodology,
          calendarType: calculationParams.calendarType,
          totalWealth: calculationResult.summary.totalAssets,
          nisabThreshold: calculationResult.summary.nisabThreshold,
          zakatDue: calculationResult.summary.zakatAmount,
          zakatRate: calculationResult.summary.zakatRate,
          assetBreakdown: calculationResult.breakdown.assetsByCategory,
          notes: saveCalculationName || 'Zakat Calculation',
          zakatYearStart: new Date(), // TODO: Calculate proper year start
          zakatYearEnd: new Date() // TODO: Calculate proper year end
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save calculation');
      }
      
      await response.json(); // Consume response
      alert('✅ Calculation saved successfully!');
      setSaveCalculationName('');
      
      // Navigate to history
      window.location.href = '/history';
    } catch (error) {
      console.error('Save calculation error:', error);
      alert(`❌ Failed to save calculation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExportResults = (format: 'pdf' | 'json') => {
    if (!calculationResult) return;
    
    if (format === 'json') {
      const exportData = {
        exportDate: new Date().toISOString(),
        methodology: calculationParams.methodology,
        calendarType: calculationParams.calendarType,
        calculationDate: calculationParams.calculationDate,
        ...calculationResult
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zakat-calculation-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (format === 'pdf') {
      // Use browser print functionality for PDF
      window.print();
    }
  };

  const getNisabInfo = () => {
    // TODO: Get current nisab threshold from API
    return {
      goldNisab: 85, // grams
      silverNisab: 595, // grams
      currentGoldPrice: 65.50, // USD per gram
      currentSilverPrice: 0.85, // USD per gram
      goldNisabUSD: 85 * 65.50,
      silverNisabUSD: 595 * 0.85
    };
  };

  const getTotalAssetValue = () => {
    if (!assets?.data) return 0;
    return assets.data
      .filter((asset: Asset) => selectedAssets.includes(asset.assetId))
      .reduce((sum: number, asset: Asset) => sum + asset.value, 0);
  };

  const getCurrentMethodology = (): ZakatMethodology | undefined => {
    return methodologies?.data?.find((m: ZakatMethodology) => m.id === calculationParams.methodology);
  };

  const handleCompareMethodologies = async () => {
    try {
      const result = await compareMethodologies.mutateAsync({
        methodologies: ['STANDARD', 'HANAFI', 'SHAFII'],
        referenceDate: calculationParams.calculationDate
      });
      
      if (result.success && result.data?.comparison) {
        setComparisonResults(result.data.comparison);
        setShowMethodologyComparison(true);
      }
    } catch (error) {
      console.error('Methodology comparison failed:', error);
    }
  };

  // Loading states
  if (assetsLoading || methodologiesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Error states
  if (assetsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorMessage error={assetsError} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  const nisabInfo = getNisabInfo();
  const totalAssetValue = getTotalAssetValue();
  const isAboveNisab = totalAssetValue > Math.min(nisabInfo.goldNisabUSD, nisabInfo.silverNisabUSD);
  const currentMethodology = getCurrentMethodology();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Zakat Calculator</h1>
              <p className="mt-2 text-lg text-gray-600">
                Calculate your Zakat obligation with Islamic compliance and scholarly guidance
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                onClick={() => setShowMethodologyComparison(!showMethodologyComparison)}
              >
                Compare Methodologies
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Calculation Parameters */}
          <div className="lg:col-span-2 space-y-6">
            {/* Methodology Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Calculation Methodology
              </h2>
              <MethodologySelector
                selectedMethodology={calculationParams.methodology}
                onMethodologyChange={(methodologyId) => {
                  setCalculationParams(prev => ({ 
                    ...prev, 
                    methodology: methodologyId as 'STANDARD' | 'HANAFI' | 'SHAFII' | 'CUSTOM'
                  }));
                }}
                showEducationalContent={true}
              />
            </div>

            {/* Asset Selection */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Asset Selection
                </h2>
                <div className="text-sm text-gray-500">
                  {selectedAssets.length} of {assets?.data?.length || 0} assets selected
                </div>
              </div>

              {/* Asset Categories */}
              <div className="space-y-4">
                {assets?.data && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {assets.data.map((asset: Asset) => (
                      <div
                        key={asset.assetId}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedAssets.includes(asset.assetId)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => 
                          handleAssetSelectionChange(
                            asset.assetId, 
                            !selectedAssets.includes(asset.assetId)
                          )
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedAssets.includes(asset.assetId)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleAssetSelectionChange(asset.assetId, e.target.checked);
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <h3 className="text-sm font-medium text-gray-900">
                                {asset.name}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {asset.category}
                              {asset.subCategory && ` • ${asset.subCategory}`}
                            </p>
                            <p className="text-lg font-semibold text-gray-900 mt-2">
                              ${asset.value.toLocaleString()} {asset.currency}
                            </p>
                          </div>
                          {asset.zakatEligible && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Zakat Eligible
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Calculation Date and Calendar Type */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="calculationDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Calculation Date
                  </label>
                  <input
                    type="date"
                    id="calculationDate"
                    value={calculationParams.calculationDate}
                    onChange={(e) => setCalculationParams(prev => ({ 
                      ...prev, 
                      calculationDate: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="calendarType" className="block text-sm font-medium text-gray-700 mb-2">
                    Calendar Type
                  </label>
                  <select
                    id="calendarType"
                    value={calculationParams.calendarType}
                    onChange={(e) => setCalculationParams(prev => ({ 
                      ...prev, 
                      calendarType: e.target.value as 'GREGORIAN' | 'HIJRI' 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="GREGORIAN">Gregorian (Solar Calendar)</option>
                    <option value="HIJRI">Hijri (Lunar Calendar)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex space-x-4">
                <Button
                  onClick={handleCalculateZakat}
                  disabled={selectedAssets.length === 0 || zakatCalculation.isPending}
                  size="lg"
                  className="flex-1"
                >
                  {zakatCalculation.isPending ? 'Calculating...' : 'Calculate Zakat'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleCompareMethodologies}
                  disabled={selectedAssets.length === 0 || compareMethodologies.isPending}
                  size="lg"
                >
                  {compareMethodologies.isPending ? 'Comparing...' : 'Compare Methods'}
                </Button>
              </div>
              
              {zakatCalculation.error && (
                <ErrorMessage 
                  error={zakatCalculation.error} 
                  className="mt-4"
                />
              )}
              
              {compareMethodologies.error && (
                <ErrorMessage 
                  error={compareMethodologies.error} 
                  className="mt-4"
                />
              )}
            </div>
          </div>

          {/* Right Column: Summary and Information */}
          <div className="space-y-6">
            {/* Quick Summary */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Assets:</span>
                  <span className="text-sm font-medium">${totalAssetValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Selected Assets:</span>
                  <span className="text-sm font-medium">{selectedAssets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Methodology:</span>
                  <span className="text-sm font-medium">{currentMethodology?.name || calculationParams.methodology}</span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${
                      isAboveNisab ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className="text-sm font-medium">
                      {isAboveNisab ? 'Above Nisab Threshold' : 'Below Nisab Threshold'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Nisab Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Current Nisab Thresholds
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Gold Nisab:</span>
                    <span className="text-sm font-medium">${nisabInfo.goldNisabUSD.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {nisabInfo.goldNisab}g × ${nisabInfo.currentGoldPrice}/g
                  </p>
                </div>
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Silver Nisab:</span>
                    <span className="text-sm font-medium">${nisabInfo.silverNisabUSD.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {nisabInfo.silverNisab}g × ${nisabInfo.currentSilverPrice}/g
                  </p>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Nisab thresholds are updated daily based on current gold and silver market prices.
                    The lower threshold is typically used for Zakat calculations.
                  </p>
                </div>
              </div>
            </div>

            {/* Educational Content */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                📚 Islamic Guidance
              </h3>
              <div className="space-y-3 text-sm text-blue-800">
                <p>
                  <strong>Zakat</strong> is the third pillar of Islam and a mandatory act of worship 
                  for eligible Muslims.
                </p>
                <p>
                  <strong>Nisab</strong> is the minimum amount of wealth required before Zakat becomes obligatory.
                  It is based on the value of gold (85g) or silver (595g).
                </p>
                <p>
                  <strong>Hawl</strong> is the completion of one lunar year of ownership. 
                  Assets must be held for a full lunar year to be subject to Zakat.
                </p>
                <p>
                  The standard Zakat rate is <strong>2.5% (1/40)</strong> of eligible wealth.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {calculationResult && (
          <div className="mt-8">
            <ZakatResults
              calculation={calculationResult}
              onExport={handleExportResults}
              onSave={handleSaveCalculation}
              saveCalculationName={saveCalculationName}
              onSaveNameChange={setSaveCalculationName}
            />
          </div>
        )}

        {/* Methodology Comparison Section */}
        {showMethodologyComparison && comparisonResults && (
          <div className="mt-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Methodology Comparison
                </h2>
                <Button
                  variant="secondary"
                  onClick={() => setShowMethodologyComparison(false)}
                >
                  Close Comparison
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {comparisonResults.map((result: any, index: number) => (
                  <div
                    key={result.methodology}
                    className={`border rounded-lg p-4 ${
                      index === 0 ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {result.methodology}
                      </h3>
                      {index === 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Primary
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Wealth:</span>
                        <span className="font-medium">${result.totalWealth.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nisab Threshold:</span>
                        <span className="font-medium">${result.nisabThreshold.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Zakat Due:</span>
                        <span className="font-medium text-green-600">${result.zakatDue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Above Nisab:</span>
                        <span className={`font-medium ${result.isAboveNisab ? 'text-green-600' : 'text-red-600'}`}>
                          {result.isAboveNisab ? 'Yes' : 'No'}
                        </span>
                      </div>
                      
                      {index > 0 && result.difference && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500 mb-1">Difference from Primary:</div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Absolute:</span>
                            <span className={`font-medium ${result.difference.absolute >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              ${result.difference.absolute >= 0 ? '+' : ''}{result.difference.absolute.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Percentage:</span>
                            <span className={`font-medium ${result.difference.percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {result.difference.percentage >= 0 ? '+' : ''}{result.difference.percentage.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Understanding the Comparison
                </h4>
                <p className="text-sm text-gray-600">
                  This comparison shows how different Islamic methodologies calculate Zakat based on the same asset data.
                  The primary methodology (first column) is used as the baseline for difference calculations.
                  Differences may arise due to varying interpretations of what constitutes zakatable wealth.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};