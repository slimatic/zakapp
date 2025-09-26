import React from 'react';
import { ZAKAT_METHODS, NISAB_THRESHOLDS } from '@zakapp/shared';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface MethodologyComparisonProps {
  onClose: () => void;
  className?: string;
}

interface ComparisonRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

const ComparisonRow: React.FC<ComparisonRowProps> = ({ label, children, className = '' }) => (
  <div className={`border-b border-neutral-100 py-4 ${className}`}>
    <div className="font-medium text-sm text-neutral-700 mb-2">{label}</div>
    <div className="space-y-2">{children}</div>
  </div>
);

interface MethodColumnProps {
  method: typeof ZAKAT_METHODS[keyof typeof ZAKAT_METHODS];
  children: React.ReactNode;
  isHighlighted?: boolean;
}

const MethodColumn: React.FC<MethodColumnProps> = ({ method, children, isHighlighted }) => (
  <div className={`flex-1 min-w-0 p-3 ${isHighlighted ? 'bg-primary-50 rounded-lg' : ''}`}>
    <div className="flex items-center gap-2 mb-2">
      <h4 className="font-semibold text-sm text-neutral-900 truncate">
        {method.name}
      </h4>
      {isHighlighted && (
        <Badge variant="secondary" className="text-xs">
          Popular
        </Badge>
      )}
    </div>
    <div className="text-sm text-neutral-600 space-y-2">{children}</div>
  </div>
);

export const MethodologyComparison: React.FC<MethodologyComparisonProps> = ({
  onClose,
  className = '',
}) => {
  // Get the main methodologies for comparison (as specified in requirements)
  const methodsToCompare = [
    ZAKAT_METHODS.STANDARD,
    ZAKAT_METHODS.HANAFI,
    ZAKAT_METHODS.SHAFII,
    ZAKAT_METHODS.CUSTOM,
  ];

  const formatNisabBasis = (basis: string) => {
    switch (basis) {
      case 'dual_minimum': return 'Lower of gold/silver';
      case 'silver': return 'Silver-based';
      case 'gold': return 'Gold-based';
      case 'dual_flexible': return 'Dual (regional flexibility)';
      case 'configurable': return 'User configurable';
      default: return basis;
    }
  };

  const formatBusinessAssetTreatment = (treatment: string) => {
    switch (treatment) {
      case 'market_value': return 'Market value assessment';
      case 'comprehensive': return 'Comprehensive inclusion';
      case 'categorized': return 'Detailed categorization';
      case 'configurable': return 'User configurable';
      default: return treatment;
    }
  };

  const formatDebtDeduction = (deduction: string) => {
    switch (deduction) {
      case 'immediate': return 'Immediate debts only';
      case 'comprehensive': return 'All debts included';
      case 'conservative': return 'Conservative approach';
      case 'community_based': return 'Community standards';
      case 'configurable': return 'User configurable';
      default: return deduction;
    }
  };

  return (
    <div className={`methodology-comparison ${className}`}>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Methodology Comparison</CardTitle>
            <Button onClick={onClose} variant="ghost" size="sm">
              Close
            </Button>
          </div>
          <p className="text-sm text-neutral-600">
            Compare different zakat calculation methodologies to understand their key differences and choose the most suitable approach for your needs.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              
              {/* Method Headers */}
              <div className="flex gap-3 mb-4">
                <div className="w-32 flex-shrink-0"></div>
                {methodsToCompare.map((method) => (
                  <MethodColumn 
                    key={method.id} 
                    method={method}
                    isHighlighted={method.id === 'standard'}
                  >
                    <div className="text-xs text-neutral-500">
                      {method.description}
                    </div>
                  </MethodColumn>
                ))}
              </div>

              {/* Nisab Basis Comparison */}
              <ComparisonRow label="Nisab Calculation">
                <div className="flex gap-3">
                  <div className="w-32 flex-shrink-0 text-xs text-neutral-500 pt-1">
                    How the minimum threshold is determined
                  </div>
                  {methodsToCompare.map((method) => (
                    <div key={method.id} className="flex-1 min-w-0 text-sm">
                      <div className="font-medium text-neutral-700">
                        {formatNisabBasis(method.nisabBasis)}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {(() => {
                          const basis = method.nisabBasis;
                          if (basis === 'silver') return `Silver: ${NISAB_THRESHOLDS.SILVER_GRAMS}g`;
                          if (basis === 'dual_minimum') return 'Uses lower threshold';
                          if (basis === 'configurable') return 'User defined';
                          return '';
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </ComparisonRow>

              {/* Business Asset Treatment */}
              <ComparisonRow label="Business Asset Treatment">
                <div className="flex gap-3">
                  <div className="w-32 flex-shrink-0 text-xs text-neutral-500 pt-1">
                    How business and trade assets are handled
                  </div>
                  {methodsToCompare.map((method) => (
                    <div key={method.id} className="flex-1 min-w-0 text-sm">
                      <div className="font-medium text-neutral-700">
                        {formatBusinessAssetTreatment(method.businessAssetTreatment)}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {(() => {
                          const treatment = method.businessAssetTreatment;
                          if (treatment === 'market_value') return 'Based on current market value';
                          if (treatment === 'comprehensive') return 'Includes all business assets';
                          if (treatment === 'categorized') return 'Different rules by asset type';
                          if (treatment === 'configurable') return 'User defined approach';
                          return '';
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </ComparisonRow>

              {/* Debt Deduction */}
              <ComparisonRow label="Debt Deduction">
                <div className="flex gap-3">
                  <div className="w-32 flex-shrink-0 text-xs text-neutral-500 pt-1">
                    How debts and liabilities are handled
                  </div>
                  {methodsToCompare.map((method) => (
                    <div key={method.id} className="flex-1 min-w-0 text-sm">
                      <div className="font-medium text-neutral-700">
                        {formatDebtDeduction(method.debtDeduction)}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {(() => {
                          const deduction = method.debtDeduction;
                          if (deduction === 'immediate') return 'Only debts due within the year';
                          if (deduction === 'comprehensive') return 'All legitimate debts included';
                          if (deduction === 'conservative') return 'Cautious debt assessment';
                          if (deduction === 'configurable') return 'User defined criteria';
                          return '';
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </ComparisonRow>

              {/* Scholarly Basis */}
              <ComparisonRow label="Scholarly Foundation">
                <div className="flex gap-3">
                  <div className="w-32 flex-shrink-0 text-xs text-neutral-500 pt-1">
                    Islamic jurisprudential sources and references
                  </div>
                  {methodsToCompare.map((method) => (
                    <div key={method.id} className="flex-1 min-w-0 text-sm">
                      <div className="space-y-1">
                        {method.scholarlyBasis.map((source, index) => (
                          <div key={index} className="text-xs bg-neutral-100 px-2 py-1 rounded">
                            {source}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ComparisonRow>

              {/* Regional Usage */}
              <ComparisonRow label="Regional Usage">
                <div className="flex gap-3">
                  <div className="w-32 flex-shrink-0 text-xs text-neutral-500 pt-1">
                    Common geographic regions where methodology is used
                  </div>
                  {methodsToCompare.map((method) => (
                    <div key={method.id} className="flex-1 min-w-0 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {method.regions.slice(0, 3).map((region, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {region}
                          </Badge>
                        ))}
                        {method.regions.length > 3 && (
                          <span className="text-xs text-neutral-500">
                            +{method.regions.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ComparisonRow>

              {/* Best Suited For */}
              <ComparisonRow label="Best Suited For" className="border-b-0">
                <div className="flex gap-3">
                  <div className="w-32 flex-shrink-0 text-xs text-neutral-500 pt-1">
                    Recommended user profiles and circumstances
                  </div>
                  {methodsToCompare.map((method) => (
                    <div key={method.id} className="flex-1 min-w-0 text-sm">
                      <ul className="space-y-1 text-xs text-neutral-600">
                        {method.suitableFor.slice(0, 3).map((item, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-primary-500 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </ComparisonRow>

            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div>
                <h5 className="font-medium text-blue-900 mb-1">Need Help Choosing?</h5>
                <p className="text-sm text-blue-800">
                  If you're unsure which methodology to choose, the <strong>Standard Method (AAOIFI)</strong> is 
                  recommended for most users as it represents modern Islamic consensus. For specific regional 
                  practices or complex business situations, consult with a qualified Islamic scholar.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};