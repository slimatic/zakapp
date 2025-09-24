import React from 'react';
import { Coins, TrendingUp, Info } from 'lucide-react';
import { NISAB_THRESHOLDS } from '@zakapp/shared';

interface NisabDisplayProps {
  goldPricePerGram?: number;
  silverPricePerGram?: number;
  currency?: string;
  showDetails?: boolean;
  className?: string;
}

export const NisabDisplay: React.FC<NisabDisplayProps> = ({
  goldPricePerGram = 65, // Default USD per gram
  silverPricePerGram = 0.8, // Default USD per gram
  currency = 'USD',
  showDetails = true,
  className = '',
}) => {
  // Calculate nisab thresholds
  const goldNisab = NISAB_THRESHOLDS.GOLD_GRAMS * goldPricePerGram;
  const silverNisab = NISAB_THRESHOLDS.SILVER_GRAMS * silverPricePerGram;
  const effectiveNisab = Math.min(goldNisab, silverNisab);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={`bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="p-3 bg-yellow-100 rounded-full">
          <Coins className="h-6 w-6 text-yellow-600" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-yellow-900">
              Current Nisab Threshold
            </h3>
            <div className="group relative">
              <Info className="h-4 w-4 text-yellow-600 cursor-help" />
              <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-10">
                Minimum wealth required for Zakat obligation
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-3xl font-bold text-yellow-800">
              {formatCurrency(effectiveNisab)}
            </p>
            <p className="text-sm text-yellow-700">
              Your total zakatable assets must exceed this amount
            </p>
          </div>

          {showDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-yellow-200">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-800">Gold Nisab</span>
                </div>
                <div className="ml-5">
                  <p className="text-lg font-semibold text-yellow-900">
                    {formatCurrency(goldNisab)}
                  </p>
                  <p className="text-xs text-yellow-600">
                    {NISAB_THRESHOLDS.GOLD_GRAMS}g × {formatCurrency(goldPricePerGram)}/g
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-800">Silver Nisab</span>
                </div>
                <div className="ml-5">
                  <p className="text-lg font-semibold text-yellow-900">
                    {formatCurrency(silverNisab)}
                  </p>
                  <p className="text-xs text-yellow-600">
                    {NISAB_THRESHOLDS.SILVER_GRAMS}g × {formatCurrency(silverPricePerGram)}/g
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Using Lower Threshold: {effectiveNisab === goldNisab ? 'Gold' : 'Silver'} Nisab
              </span>
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Standard method uses the lower of gold or silver nisab for more inclusive zakat calculation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};