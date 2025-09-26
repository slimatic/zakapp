import React from 'react';
import { ChevronDown, ChevronRight, Info, Calculator, DollarSign, TrendingUp } from 'lucide-react';
import { CalculationBreakdown } from '@zakapp/shared';

interface CalculationBreakdownDisplayProps {
  breakdown: CalculationBreakdown;
  currency?: string;
  showDetails?: boolean;
  className?: string;
}

export const CalculationBreakdownDisplay: React.FC<CalculationBreakdownDisplayProps> = ({
  breakdown,
  currency = 'USD',
  showDetails = true,
  className = '',
}) => {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set(['overview']));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const getSectionIcon = (section: string) => {
    const iconProps = { className: "w-4 h-4 text-primary-600" };
    switch (section) {
      case 'nisab': return <Calculator {...iconProps} />;
      case 'assets': return <TrendingUp {...iconProps} />;
      case 'deductions': return <DollarSign {...iconProps} />;
      case 'final': return <Calculator {...iconProps} />;
      default: return <Info {...iconProps} />;
    }
  };

  return (
    <div className={`bg-white border border-neutral-200 rounded-lg shadow-sm ${className}`}>
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center space-x-3">
          <Calculator className="w-6 h-6 text-primary-600" />
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">
              Calculation Breakdown
            </h3>
            <p className="text-sm text-neutral-600">
              {breakdown.methodology?.name || 'Step-by-step calculation details'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Overview Section - Always Expanded */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Final Calculation</h4>
            </div>
          </div>
          
          {breakdown.finalCalculation && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3">
                <div className="text-sm text-neutral-600 mb-1">Total Assets</div>
                <div className="text-lg font-semibold text-neutral-900">
                  {formatCurrency(breakdown.finalCalculation.totalAssets)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-sm text-neutral-600 mb-1">Total Deductions</div>
                <div className="text-lg font-semibold text-neutral-900">
                  {formatCurrency(breakdown.finalCalculation.totalDeductions)}
                </div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="text-sm text-neutral-600 mb-1">Zakatable Amount</div>
                <div className="text-lg font-semibold text-green-600">
                  {formatCurrency(breakdown.finalCalculation.zakatableAmount)}
                </div>
              </div>
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-3 text-white">
                <div className="text-sm text-primary-100 mb-1">Zakat Due</div>
                <div className="text-xl font-bold">
                  {formatCurrency(breakdown.finalCalculation.zakatDue)}
                </div>
              </div>
            </div>
          )}
        </div>

        {showDetails && (
          <>
            {/* Nisab Calculation Section */}
            {breakdown.nisabCalculation && (
              <div className="border border-neutral-200 rounded-lg">
                <button
                  onClick={() => toggleSection('nisab')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {getSectionIcon('nisab')}
                    <div>
                      <h4 className="font-semibold text-neutral-900">Nisab Calculation</h4>
                      <p className="text-sm text-neutral-600">
                        Threshold determination using {breakdown.nisabCalculation.basis} basis
                      </p>
                    </div>
                  </div>
                  {expandedSections.has('nisab') ? 
                    <ChevronDown className="w-5 h-5 text-neutral-400" /> : 
                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                  }
                </button>
                
                {expandedSections.has('nisab') && (
                  <div className="px-4 pb-4 border-t border-neutral-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="text-sm text-yellow-700 mb-1">Gold Nisab</div>
                        <div className="font-semibold text-yellow-900">
                          {formatCurrency(breakdown.nisabCalculation.goldNisab)}
                        </div>
                        <div className="text-xs text-yellow-600 mt-1">87.48g gold equivalent</div>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <div className="text-sm text-gray-700 mb-1">Silver Nisab</div>
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(breakdown.nisabCalculation.silverNisab)}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">612.36g silver equivalent</div>
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-sm text-green-700 mb-1">Effective Nisab</div>
                        <div className="font-semibold text-green-900">
                          {formatCurrency(breakdown.nisabCalculation.effectiveNisab)}
                        </div>
                        <div className="text-xs text-green-600 mt-1">Applied threshold</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Asset Calculations Section */}
            {breakdown.assetCalculations && breakdown.assetCalculations.length > 0 && (
              <div className="border border-neutral-200 rounded-lg">
                <button
                  onClick={() => toggleSection('assets')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {getSectionIcon('assets')}
                    <div>
                      <h4 className="font-semibold text-neutral-900">Asset Details</h4>
                      <p className="text-sm text-neutral-600">
                        {breakdown.assetCalculations.length} assets included in calculation
                      </p>
                    </div>
                  </div>
                  {expandedSections.has('assets') ? 
                    <ChevronDown className="w-5 h-5 text-neutral-400" /> : 
                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                  }
                </button>
                
                {expandedSections.has('assets') && (
                  <div className="px-4 pb-4 border-t border-neutral-100">
                    <div className="space-y-3 mt-4">
                      {breakdown.assetCalculations.map((asset: any, index) => (
                        <div key={asset.assetId || index} className="bg-neutral-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-neutral-900">{asset.name}</div>
                              <div className="text-sm text-neutral-600 capitalize">{asset.category}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-neutral-900">
                                {formatCurrency(asset.value)}
                              </div>
                              {asset.zakatDue > 0 && (
                                <div className="text-sm text-primary-600">
                                  Zakat: {formatCurrency(asset.zakatDue)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Deduction Rules Section */}
            {breakdown.deductionRules && breakdown.deductionRules.length > 0 && (
              <div className="border border-neutral-200 rounded-lg">
                <button
                  onClick={() => toggleSection('deductions')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {getSectionIcon('deductions')}
                    <div>
                      <h4 className="font-semibold text-neutral-900">Deduction Rules</h4>
                      <p className="text-sm text-neutral-600">
                        Applied deductions and adjustments
                      </p>
                    </div>
                  </div>
                  {expandedSections.has('deductions') ? 
                    <ChevronDown className="w-5 h-5 text-neutral-400" /> : 
                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                  }
                </button>
                
                {expandedSections.has('deductions') && (
                  <div className="px-4 pb-4 border-t border-neutral-100">
                    <div className="space-y-2 mt-4">
                      {breakdown.deductionRules.map((rule: any, index) => (
                        <div key={index} className="flex items-center justify-between py-2">
                          <div className="text-sm text-neutral-700">{rule.description}</div>
                          <div className="text-sm font-semibold text-neutral-900">
                            -{formatCurrency(rule.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step-by-step breakdown (legacy support) */}
            {breakdown.steps && breakdown.steps.length > 0 && (
              <div className="border border-neutral-200 rounded-lg">
                <button
                  onClick={() => toggleSection('steps')}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Info className="w-4 h-4 text-primary-600" />
                    <div>
                      <h4 className="font-semibold text-neutral-900">Calculation Steps</h4>
                      <p className="text-sm text-neutral-600">
                        Step-by-step methodology breakdown
                      </p>
                    </div>
                  </div>
                  {expandedSections.has('steps') ? 
                    <ChevronDown className="w-5 h-5 text-neutral-400" /> : 
                    <ChevronRight className="w-5 h-5 text-neutral-400" />
                  }
                </button>
                
                {expandedSections.has('steps') && (
                  <div className="px-4 pb-4 border-t border-neutral-100">
                    <div className="space-y-4 mt-4">
                      {breakdown.steps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-neutral-900">{step.step}</div>
                            <div className="text-sm text-neutral-600 mt-1">{step.description}</div>
                            <div className="text-sm font-semibold text-primary-600 mt-2">
                              {formatCurrency(step.value)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Educational Sources */}
            {breakdown.sources && breakdown.sources.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-2">Scholarly Sources</h4>
                    <ul className="text-sm text-amber-700 space-y-1">
                      {breakdown.sources.map((source, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{source}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};