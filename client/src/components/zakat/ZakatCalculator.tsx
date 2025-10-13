import React, { useState, useEffect } from 'react';
import { Asset, AssetType, ZakatCalculation, NisabInfo, ZakatPayment } from '../../types';
import { apiService } from '../../services/api';
import { PaymentModal } from './PaymentModal';
import { MethodologySelector } from './MethodologySelector';

export const ZakatCalculator: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [nisabInfo, setNisabInfo] = useState<NisabInfo | null>(null);
  const [selectedMethodology, setSelectedMethodology] = useState<string>('standard');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [calculation, setCalculation] = useState<ZakatCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [assetsResponse, nisabResponse] = await Promise.all([
        apiService.getAssets(),
        apiService.getNisab()
      ]);

      if (assetsResponse.success && assetsResponse.data) {
        setAssets(assetsResponse.data.assets || []);
        // Select all assets by default - use assetId since that's what the backend API returns
        setSelectedAssets((assetsResponse.data.assets || []).map((asset: any) => asset.assetId || asset.id));
      }

      if (nisabResponse.success && nisabResponse.data) {
        setNisabInfo(nisabResponse.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load initial data');
    }
  };

  const handleCalculateZakat = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepare request payload to match new API contract
      const calculationRequest = {
        methodologyId: selectedMethodology || 'standard', // Backend expects methodologyId
        calendarType: 'lunar',
        calculationDate: new Date().toISOString().split('T')[0],
        includeAssets: selectedAssets, // Send array of asset IDs
        includeLiabilities: [], // Optional but provide empty array
        customRules: {
          nisabSource: 'gold' // Default value
        }
      };

      console.log('Sending calculation request:', calculationRequest);

      const response = await apiService.calculateZakat(calculationRequest);
      
      console.log('API Response:', response);
      
      // Handle response based on actual structure returned from backend
      if (response.success) {
        // Backend returns calculation directly in response.calculation
        const calculationData = (response as any).calculation || response.data;
        if (calculationData) {
          setCalculation(calculationData);
          setSuccessMessage('Zakat calculation completed successfully!');
        } else {
          setError('No calculation data received');
        }
      } else {
        // Handle error response
        const errorMessage = typeof response.error === 'string' 
          ? response.error 
          : (response as any).error?.message || response.message || 'Calculation failed';
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Calculation error:', err);
      setError(err instanceof Error ? err.message : 'Calculation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssetSelection = (assetId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedAssets(prev => [...prev, assetId]);
    } else {
      setSelectedAssets(prev => prev.filter(id => id !== assetId));
    }
  };

  const handleSelectAll = () => {
    setSelectedAssets(assets.map(asset => asset.id));
  };

  const handleSelectNone = () => {
    setSelectedAssets([]);
  };

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getAssetTypeLabel = (type: AssetType): string => {
    const labels: Record<AssetType, string> = {
      [AssetType.CASH]: 'Cash',
      [AssetType.BANK_ACCOUNT]: 'Bank Account',
      [AssetType.GOLD]: 'Gold',
      [AssetType.SILVER]: 'Silver',
      [AssetType.CRYPTOCURRENCY]: 'Cryptocurrency',
      [AssetType.BUSINESS_ASSETS]: 'Business Assets',
      [AssetType.INVESTMENT_ACCOUNT]: 'Investment Account',
      [AssetType.REAL_ESTATE]: 'Real Estate',
      [AssetType.DEBTS_OWED_TO_YOU]: 'Debts Owed to You',
      [AssetType.OTHER]: 'Other'
    };
    return labels[type] || type;
  };

  const handlePaymentRecorded = (payment: ZakatPayment) => {
    setSuccessMessage(`Payment of ${formatCurrency(payment.amount)} recorded successfully!`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleSaveCalculation = async () => {
    if (!calculation) return;
    
    try {
      const response = await apiService.createSnapshot({
        year: new Date().getFullYear(),
        notes: `Zakat calculation using ${calculation.methodology.name} methodology`
      });
      
      if (response.success) {
        setSuccessMessage('Calculation saved successfully!');
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save calculation');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Zakat Calculator</h1>
        <p className="mt-2 text-gray-600">
          Calculate your Zakat obligation according to Islamic principles
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Nisab Information */}
          {nisabInfo && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Current Nisab Thresholds</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-green-600">Gold Nisab</p>
                  <p className="text-xl font-bold text-green-800">
                    {formatCurrency(nisabInfo.goldNisab, nisabInfo.currency)}
                  </p>
                  <p className="text-xs text-green-600">~85g @ {formatCurrency(nisabInfo.goldPrice)}/g</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-green-600">Silver Nisab</p>
                  <p className="text-xl font-bold text-green-800">
                    {formatCurrency(nisabInfo.silverNisab, nisabInfo.currency)}
                  </p>
                  <p className="text-xs text-green-600">~595g @ {formatCurrency(nisabInfo.silverPrice)}/g</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-green-600">Effective Nisab</p>
                  <p className="text-xl font-bold text-green-800">
                    {formatCurrency(nisabInfo.effectiveNisab, nisabInfo.currency)}
                  </p>
                  <p className="text-xs text-green-600">Lower of the two</p>
                </div>
              </div>
              <p className="text-xs text-green-600 text-center mt-3">
                Last updated: {new Date(nisabInfo.lastUpdated).toLocaleString()}
              </p>
            </div>
          )}

          {/* Methodology Selection */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Calculation Methodology</h3>
            <MethodologySelector 
              selectedMethodology={selectedMethodology}
              onMethodologyChange={setSelectedMethodology}
              showEducationalContent={true}
            />
          </div>

          {/* Asset Selection */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Select Assets for Calculation</h3>
              <div className="space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Select All
                </button>
                <span className="text-gray-300">•</span>
                <button
                  onClick={handleSelectNone}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  Select None
                </button>
              </div>
            </div>

            {assets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No assets found. Please add assets first.</p>
                <a href="/assets" className="text-green-600 hover:text-green-700 font-medium">
                  Add Assets →
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                {assets.map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                    <div className="flex items-center">
                      <input
                        id={asset.id}
                        type="checkbox"
                        checked={selectedAssets.includes(asset.id)}
                        onChange={(e) => handleAssetSelection(asset.id, e.target.checked)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <label htmlFor={asset.id} className="text-sm font-medium text-gray-900">
                          {asset.name}
                        </label>
                        <p className="text-sm text-gray-500">{getAssetTypeLabel(asset.type)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(asset.value, asset.currency)}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Selected Assets:</span>
                    <span className="font-medium">{selectedAssets.length} of {assets.length}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Total Value:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        assets
                          .filter(asset => selectedAssets.includes(asset.id))
                          .reduce((sum, asset) => sum + asset.value, 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Calculate Button */}
          <div className="flex justify-center">
            <button
              onClick={handleCalculateZakat}
              disabled={isLoading || selectedAssets.length === 0}
              className="px-8 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Calculating...
                </div>
              ) : (
                'Calculate Zakat'
              )}
            </button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {calculation && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Calculation Results</h3>
              
              {/* Main Result */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-green-600">Zakat Due</p>
                  <p className="text-3xl font-bold text-green-800">
                    {formatCurrency((calculation as any).summary?.zakatAmount || (calculation as any).zakatOwed || calculation.zakatDue || 0, 'USD')}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {(calculation as any).summary?.zakatRate ? `${((calculation as any).summary.zakatRate * 100).toFixed(1)}%` : `${calculation.zakatRate || 2.5}%`} of zakatable wealth
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Assets:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency((calculation as any).summary?.totalAssets || (calculation as any).totalAssetValue || calculation.totalAssets || 0, 'USD')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Nisab Threshold:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency((calculation as any).summary?.nisabThreshold || calculation.nisabThreshold || 0, 'USD')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Above Nisab:</span>
                  <span className={`text-sm font-medium ${(calculation as any).summary?.isZakatObligatory || calculation.isAboveNisab ? 'text-green-600' : 'text-red-600'}`}>
                    {(calculation as any).summary?.isZakatObligatory || calculation.isAboveNisab ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Methodology:</span>
                  <span className="text-sm font-medium">{calculation.methodology?.name || 'Standard'}</span>
                </div>
              </div>

              {/* Asset Breakdown */}
              {calculation.assetBreakdown && calculation.assetBreakdown.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Asset Breakdown</h4>
                  <div className="space-y-2">
                    {calculation.assetBreakdown.map((breakdown, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">{getAssetTypeLabel(breakdown.type)}:</span>
                        <span className="font-medium">
                          {formatCurrency(breakdown.zakatableAmount, calculation.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reason for no Zakat */}
              {!calculation.isAboveNisab && calculation.reason && (
                <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">{calculation.reason}</p>
                </div>
              )}

              {/* Actions */}
              {calculation.isAboveNisab && calculation.zakatDue > 0 && (
                <div className="mt-6 space-y-3">
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Record Payment
                  </button>
                  <button 
                    onClick={handleSaveCalculation}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Save Calculation
                  </button>
                </div>
              )}

              <div className="mt-4 text-xs text-gray-500 text-center">
                Calculated on {new Date(calculation.calculatedAt).toLocaleString()}
              </div>
            </div>
          )}

          {/* Islamic Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-sm font-medium text-blue-900 mb-3">Islamic Guidelines</h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• Zakat is due when wealth exceeds the nisab threshold</p>
              <p>• Assets must be owned for one full lunar year (hawl)</p>
              <p>• Rate is typically 2.5% of zakatable wealth</p>
              <p>• Debts can be deducted from total wealth</p>
              <p>• Consult a scholar for complex situations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {calculation && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          zakatAmount={(calculation as any).summary?.zakatAmount || (calculation as any).zakatOwed || calculation.zakatDue || 0}
          currency="USD" // Default to USD since backend doesn't return currency yet
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}
    </div>
  );
};