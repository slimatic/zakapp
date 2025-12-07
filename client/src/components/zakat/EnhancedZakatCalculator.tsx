/**
 * EnhancedZakatCalculator Component
 * 
 * Enhanced Zakat calculator with visual breakdown, animations,
 * and step-by-step educational display.
 */

import React, { useState, useEffect } from 'react';
import { CalculationBreakdown, AssetBreakdown } from './CalculationBreakdown';
import { NisabIndicator } from './NisabIndicator';
import { CalculationExplanation } from './CalculationExplanation';
import { MethodologySelector } from './MethodologySelector';

export interface EnhancedZakatCalculatorProps {
  initialMethodology?: 'standard' | 'hanafi' | 'shafi' | 'custom';
  showAnimations?: boolean;
  className?: string;
}

interface CalculationStep {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
  isActive: boolean;
}

export const EnhancedZakatCalculator: React.FC<EnhancedZakatCalculatorProps> = ({
  initialMethodology = 'standard',
  showAnimations = true,
  className = ''
}) => {
  // State management
  const [methodology, setMethodology] = useState<'standard' | 'hanafi' | 'shafi' | 'custom'>(initialMethodology);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationComplete, setCalculationComplete] = useState(false);
  const [enableAnimations, setEnableAnimations] = useState(showAnimations);

  // Asset amounts
  const [assets, setAssets] = useState({
    cash: 0,
    gold: 0,
    silver: 0,
    crypto: 0,
    business: 0,
    investments: 0,
    realEstate: 0
  });

  // Calculation results
  const [nisabThreshold, setNisabThreshold] = useState(5500); // Example: $5,500 for gold-based
  const [totalWealth, setTotalWealth] = useState(0);
  const [totalZakat, setTotalZakat] = useState(0);
  const [assetCategories, setAssetCategories] = useState<AssetBreakdown[]>([]);

  // Calculation steps
  const steps: CalculationStep[] = [
    {
      id: 'methodology',
      title: 'Choose Methodology',
      description: 'Select the Islamic methodology for your calculation',
      isComplete: false,
      isActive: currentStep === 0
    },
    {
      id: 'assets',
      title: 'Enter Assets',
      description: 'Input your zakatable wealth by category',
      isComplete: false,
      isActive: currentStep === 1
    },
    {
      id: 'calculate',
      title: 'Calculate Zakat',
      description: 'Review nisab threshold and calculate',
      isComplete: false,
      isActive: currentStep === 2
    },
    {
      id: 'results',
      title: 'View Results',
      description: 'See detailed breakdown and explanation',
      isComplete: false,
      isActive: currentStep === 3
    }
  ];

  // Update total wealth when assets change
  useEffect(() => {
    const total = Object.values(assets).reduce((sum, amount) => sum + amount, 0);
    setTotalWealth(total);
  }, [assets]);

  // Update nisab threshold based on methodology
  useEffect(() => {
    switch (methodology) {
      case 'hanafi':
        setNisabThreshold(3000); // Lower threshold (silver-based)
        break;
      case 'shafi':
        setNisabThreshold(5500); // Gold-based
        break;
      case 'standard':
        setNisabThreshold(5500); // Gold-based
        break;
      case 'custom':
        setNisabThreshold(4500); // Custom threshold
        break;
    }
  }, [methodology]);

  // Handle asset input change
  const handleAssetChange = (assetType: keyof typeof assets, value: string) => {
    const numValue = parseFloat(value) || 0;
    setAssets(prev => ({ ...prev, [assetType]: numValue }));
  };

  // Calculate Zakat
  const handleCalculate = () => {
    setIsCalculating(true);
    setCalculationComplete(false);

    // Simulate calculation process with animation
    setTimeout(() => {
      const zakatRate = 0.025; // 2.5%
      
      // Build asset breakdowns matching CalculationBreakdown interface
      const breakdowns = [
        {
          type: 'cash',
          category: 'Cash & Savings',
          totalValue: assets.cash,
          zakatableAmount: assets.cash,
          zakatDue: assets.cash * zakatRate,
          percentage: (assets.cash / totalWealth) * 100,
          count: assets.cash > 0 ? 1 : 0
        },
        {
          type: 'gold',
          category: 'Gold',
          totalValue: assets.gold,
          zakatableAmount: assets.gold,
          zakatDue: assets.gold * zakatRate,
          percentage: (assets.gold / totalWealth) * 100,
          count: assets.gold > 0 ? 1 : 0
        },
        {
          type: 'silver',
          category: 'Silver',
          totalValue: assets.silver,
          zakatableAmount: assets.silver,
          zakatDue: assets.silver * zakatRate,
          percentage: (assets.silver / totalWealth) * 100,
          count: assets.silver > 0 ? 1 : 0
        },
        {
          type: 'crypto',
          category: 'Cryptocurrency',
          totalValue: assets.crypto,
          zakatableAmount: assets.crypto,
          zakatDue: assets.crypto * zakatRate,
          percentage: (assets.crypto / totalWealth) * 100,
          count: assets.crypto > 0 ? 1 : 0
        },
        {
          type: 'business',
          category: 'Business Assets',
          totalValue: assets.business,
          zakatableAmount: assets.business,
          zakatDue: assets.business * zakatRate,
          percentage: (assets.business / totalWealth) * 100,
          count: assets.business > 0 ? 1 : 0
        },
        {
          type: 'investments',
          category: 'Investments',
          totalValue: assets.investments,
          zakatableAmount: assets.investments,
          zakatDue: assets.investments * zakatRate,
          percentage: (assets.investments / totalWealth) * 100,
          count: assets.investments > 0 ? 1 : 0
        },
        {
          type: 'realEstate',
          category: 'Investment Property',
          totalValue: assets.realEstate,
          zakatableAmount: 0, // Typically not zakatable (only rental income)
          zakatDue: 0,
          percentage: (assets.realEstate / totalWealth) * 100,
          count: assets.realEstate > 0 ? 1 : 0
        }
      ].filter(cat => cat.totalValue > 0);

      const total = breakdowns.reduce((sum, cat) => sum + cat.zakatDue, 0);
      
      setAssetCategories(breakdowns);
      setTotalZakat(total);
      setIsCalculating(false);
      setCalculationComplete(true);
      setCurrentStep(3);
    }, enableAnimations ? 1500 : 100);
  };

  // Navigation
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Enhanced Zakat Calculator
        </h1>
        <p className="text-gray-600">
          Calculate your Zakat with step-by-step guidance and detailed explanations
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    currentStep >= index
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {currentStep > index ? '✓' : index + 1}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-sm font-medium ${currentStep >= index ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-all duration-300 ${
                    currentStep > index ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  style={{ maxWidth: '100px' }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Animation Toggle */}
      <div className="mb-6 flex items-center justify-end">
        <label className="flex items-center space-x-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={enableAnimations}
            onChange={(e) => setEnableAnimations(e.target.checked)}
            className="rounded"
          />
          <span>Enable animations</span>
        </label>
      </div>

      {/* Step Content */}
      <div className={`transition-all duration-500 ${enableAnimations ? 'opacity-100' : ''}`}>
        {/* Step 1: Methodology Selection */}
        {currentStep === 0 && (
          <div className="space-y-6 animate-fadeIn">
            <MethodologySelector
              selectedMethodology={methodology}
              onMethodologyChange={(value) => setMethodology(value as typeof methodology)}
              showEducationalContent={true}
            />
            <div className="flex justify-end">
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Continue to Assets →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Asset Entry */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Enter Your Assets
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries({
                  cash: { label: 'Cash & Savings', icon: '💰' },
                  gold: { label: 'Gold', icon: '🪙' },
                  silver: { label: 'Silver', icon: '🪙' },
                  crypto: { label: 'Cryptocurrency', icon: '₿' },
                  business: { label: 'Business Assets', icon: '💼' },
                  investments: { label: 'Investments', icon: '📈' },
                  realEstate: { label: 'Investment Property', icon: '🏢' }
                }).map(([key, { label, icon }]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {icon} {label}
                    </label>
                    <input
                      type="number"
                      value={assets[key as keyof typeof assets] || ''}
                      onChange={(e) => handleAssetChange(key as keyof typeof assets, e.target.value)}
                      onFocus={(e) => e.target.select()}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Current Total:</strong> ${totalWealth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                ← Back to Methodology
              </button>
              <button
                onClick={nextStep}
                disabled={totalWealth === 0}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Calculate →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Nisab Check & Calculate */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <NisabIndicator
              totalWealth={totalWealth}
              nisabThreshold={nisabThreshold}
              currency="USD"
              nisabType={methodology === 'hanafi' ? 'silver' : 'gold'}
              showDetails={true}
            />
            
            {totalWealth >= nisabThreshold && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                <p className="text-lg text-gray-700 mb-4">
                  Your wealth is above the nisab threshold. Click below to calculate your Zakat:
                </p>
                <button
                  onClick={handleCalculate}
                  disabled={isCalculating}
                  className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCalculating ? (
                    <span className="flex items-center space-x-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Calculating...</span>
                    </span>
                  ) : (
                    '⚡ Calculate My Zakat'
                  )}
                </button>
              </div>
            )}
            
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                ← Back to Assets
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Results & Breakdown */}
        {currentStep === 3 && calculationComplete && (
          <div className="space-y-6 animate-fadeIn">
            {/* Total Zakat Due */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-8 text-white text-center">
              <p className="text-lg mb-2">Your Zakat Due</p>
              <p className="text-5xl font-bold mb-2">
                ${totalZakat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm opacity-90">Based on {methodology} methodology</p>
            </div>

            {/* Calculation Breakdown */}
            <CalculationBreakdown
              breakdown={assetCategories}
              totalAssets={totalWealth}
              totalZakat={totalZakat}
              currency="USD"
              methodology={methodology}
              showPrintView={false}
            />

            {/* Methodology Explanation */}
            <CalculationExplanation
              methodology={methodology}
              nisabAmount={nisabThreshold}
              currency="USD"
              showSources={true}
            />

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setCurrentStep(0);
                  setCalculationComplete(false);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                ← Start New Calculation
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                🖨️ Print Results
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EnhancedZakatCalculator;
