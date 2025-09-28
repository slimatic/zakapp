import React, { useState, useEffect } from 'react';
import { Asset, AssetType, ZakatCalculation, ZakatMethodology, NisabInfo, ZakatCalculationRequest, ZakatPayment } from '../../types';
import { apiService } from '../../services/api';
import { PaymentModal } from '../../components/zakat/PaymentModal';

/**
 * Enhanced Zakat Calculator Page - T136
 * 
 * A comprehensive Islamic Zakat calculator that provides:
 * - Multiple Islamic methodology support
 * - Real-time nisab threshold calculations
 * - Asset selection and validation
 * - Detailed calculation breakdown
 * - Payment tracking integration
 * - Educational content and transparency
 * 
 * This page serves as the main interface for zakat calculations,
 * integrating with the backend calculation engine and following
 * Islamic jurisprudence principles.
 */
export const Calculator: React.FC = () => {
  // State Management
  const [assets, setAssets] = useState<Asset[]>([]);
  const [methodologies, setMethodologies] = useState<ZakatMethodology[]>([]);
  const [nisabInfo, setNisabInfo] = useState<NisabInfo | null>(null);
  const [selectedMethodology, setSelectedMethodology] = useState<string>('standard');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [calculation, setCalculation] = useState<ZakatCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load initial data on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [assetsResponse, methodologiesResponse, nisabResponse] = await Promise.all([
          apiService.getAssets(),
          apiService.getMethodologies(),
          apiService.getNisab()
        ]);

        if (assetsResponse.success && assetsResponse.data) {
          setAssets(assetsResponse.data);
          // Auto-select all zakatable assets by default
          const zakatableAssets = assetsResponse.data
            .filter((asset: Asset) => isZakatableAssetType(asset.type))
            .map((asset: Asset) => asset.id);
          setSelectedAssets(zakatableAssets);
        }

        if (methodologiesResponse.success && methodologiesResponse.data) {
          setMethodologies(methodologiesResponse.data);
        }

        if (nisabResponse.success && nisabResponse.data) {
          setNisabInfo(nisabResponse.data);
        }
      } catch (err) {
        setError('Failed to load calculation data. Please try again.');
        console.error('Error loading initial data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  /**
   * Determine if an asset type is generally zakatable
   */
  const isZakatableAssetType = (assetType: AssetType): boolean => {
    const zakatableTypes = [
      AssetType.CASH,
      AssetType.BANK_ACCOUNT,
      AssetType.GOLD,
      AssetType.SILVER,
      AssetType.CRYPTOCURRENCY,
      AssetType.BUSINESS_ASSETS,
      AssetType.INVESTMENT_ACCOUNT,
      AssetType.DEBTS_OWED_TO_YOU
    ];
    return zakatableTypes.includes(assetType);
  };

  /**
   * Handle asset selection changes
   */
  const handleAssetSelection = (assetId: string, isSelected: boolean) => {
    setSelectedAssets(prev => 
      isSelected 
        ? [...prev, assetId]
        : prev.filter(id => id !== assetId)
    );
    // Clear previous calculation when selection changes
    setCalculation(null);
    setSuccessMessage(null);
  };

  /**
   * Handle methodology selection
   */
  const handleMethodologyChange = (methodologyId: string) => {
    setSelectedMethodology(methodologyId);
    // Clear previous calculation when methodology changes
    setCalculation(null);
    setSuccessMessage(null);
  };

  /**
   * Perform Zakat calculation with selected assets and methodology
   */
  const calculateZakat = async () => {
    if (selectedAssets.length === 0) {
      setError('Please select at least one asset for calculation.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const calculationRequest: ZakatCalculationRequest = {
        methodologyId: selectedMethodology,
        assets: assets.filter(asset => selectedAssets.includes(asset.id))
      };

      const response = await apiService.calculateZakat(calculationRequest);

      if (response.success && response.data) {
        setCalculation(response.data);
        setSuccessMessage('Zakat calculation completed successfully!');
        
        // Create snapshot for history
        try {
          await apiService.createSnapshot({
            calculation: response.data,
            methodology: selectedMethodology,
            assetsIncluded: selectedAssets
          });
        } catch (snapshotError) {
          console.warn('Failed to save calculation snapshot:', snapshotError);
        }
      } else {
        setError(response.message || 'Failed to calculate Zakat. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during calculation. Please check your connection and try again.');
      console.error('Calculation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle payment recording
   */
  const handlePaymentRecorded = async (payment: ZakatPayment) => {
    setShowPaymentModal(false);
    setSuccessMessage('Payment recorded successfully!');
  };

  /**
   * Format currency values for display
   */
  const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  /**
   * Get methodology display information
   */
  const getMethodologyInfo = () => {
    return methodologies.find(m => m.id === selectedMethodology);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Zakat Calculator
        </h1>
        <p className="text-lg text-gray-600">
          Calculate your Islamic obligation with precision and transparency
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Methodology Selection */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Calculation Methodology
            </h3>
            <div className="space-y-3">
              {methodologies.map((methodology) => (
                <label key={methodology.id} className="flex items-start">
                  <input
                    type="radio"
                    name="methodology"
                    value={methodology.id}
                    checked={selectedMethodology === methodology.id}
                    onChange={(e) => handleMethodologyChange(e.target.value)}
                    className="mt-1 focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-700">
                      {methodology.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {methodology.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            
            {/* Methodology Info */}
            {getMethodologyInfo() && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Selected Methodology Details
                </h4>
                <p className="text-sm text-blue-700">
                  Rate: {getMethodologyInfo()!.zakatRate * 100}% • 
                  Nisab: {getMethodologyInfo()!.nisabMethod} based
                </p>
              </div>
            )}
          </div>

          {/* Asset Selection */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Select Assets for Calculation
            </h3>
            
            {assets.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No assets found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Please add some assets before calculating Zakat.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assets.map((asset) => (
                  <label key={asset.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAssets.includes(asset.id)}
                        onChange={(e) => handleAssetSelection(asset.id, e.target.checked)}
                        className="focus:ring-green-500 h-4 w-4 text-green-600 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-700">
                          {asset.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {asset.type} • {formatCurrency(asset.value, asset.currency)}
                        </div>
                      </div>
                    </div>
                    
                    {isZakatableAssetType(asset.type) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Zakatable
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Calculate Button */}
          <div className="flex justify-center">
            <button
              onClick={calculateZakat}
              disabled={isLoading || selectedAssets.length === 0}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Calculating...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Calculate Zakat
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="space-y-6">
          {/* Current Nisab Info */}
          {nisabInfo && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Current Nisab</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Gold Nisab:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(nisabInfo.goldNisab, nisabInfo.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Silver Nisab:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(nisabInfo.silverNisab, nisabInfo.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Effective:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(nisabInfo.effectiveNisab, nisabInfo.currency)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Last updated: {new Date(nisabInfo.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {/* Calculation Results */}
          {calculation && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Calculation Results</h3>
              
              {/* Main Result */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-green-600">Zakat Due</p>
                  <p className="text-3xl font-bold text-green-800">
                    {formatCurrency(calculation.zakatDue, calculation.currency)}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {calculation.zakatRate * 100}% of zakatable wealth
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Assets:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(calculation.totalAssets, calculation.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Nisab Threshold:</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(calculation.nisabThreshold, calculation.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Above Nisab:</span>
                  <span className={`text-sm font-medium ${calculation.isAboveNisab ? 'text-green-600' : 'text-red-600'}`}>
                    {calculation.isAboveNisab ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>

              {/* Asset Breakdown */}
              {calculation.assetBreakdown && calculation.assetBreakdown.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Asset Breakdown</h4>
                  <div className="space-y-2">
                    {calculation.assetBreakdown.map((breakdown, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {breakdown.type} ({breakdown.count})
                        </span>
                        <span className="font-medium">
                          {formatCurrency(breakdown.totalValue, calculation.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {calculation.zakatDue > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Record Payment
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && calculation && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          zakatAmount={calculation.zakatDue}
          currency={calculation.currency}
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}
    </div>
  );
};