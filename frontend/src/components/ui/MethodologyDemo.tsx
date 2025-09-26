import React, { useState } from 'react';
import { MethodologySelector } from '../MethodologySelector';
import { CalculationBreakdownDisplay } from './CalculationBreakdownDisplay';
import { CalculationBreakdown } from '@zakapp/shared';

export const MethodologyDemo: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState('standard');

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    console.log('Selected methodology:', methodId);
  };

  // Sample calculation breakdown data to demonstrate the component
  const sampleBreakdown: CalculationBreakdown = {
    method: selectedMethod,
    nisabCalculation: {
      goldNisab: 5248.80,
      silverNisab: 489.89,
      effectiveNisab: 489.89,
      basis: selectedMethod === 'hanafi' ? 'silver' : 'dual_minimum'
    },
    assetCalculations: [
      {
        assetId: '1',
        name: 'Savings Account',
        category: 'cash',
        value: 15000,
        zakatableAmount: 15000,
        zakatDue: 375,
        methodSpecificRules: []
      },
      {
        assetId: '2', 
        name: 'Gold Jewelry',
        category: 'gold',
        value: 8000,
        zakatableAmount: 8000,
        zakatDue: 200,
        methodSpecificRules: []
      },
      {
        assetId: '3',
        name: 'Investment Portfolio',
        category: 'investments',
        value: 25000,
        zakatableAmount: 25000,
        zakatDue: 625,
        methodSpecificRules: []
      }
    ],
    finalCalculation: {
      totalAssets: 48000,
      totalDeductions: 1000,
      zakatableAmount: 47000,
      zakatDue: 1175
    },
    sources: [
      'Quran 2:43, 2:110, 2:177, 9:103',
      'Sahih al-Bukhari, Book of Zakat',
      'AAOIFI Sharia Standard No. 35',
      selectedMethod === 'hanafi' ? 'Al-Hidayah by Al-Marghinani' : 'Al-Majmu by An-Nawawi'
    ],
    steps: [
      {
        step: '1. Nisab Calculation',
        description: `${selectedMethod === 'hanafi' ? 'Hanafi method uses silver nisab' : 'Standard method uses minimum of gold/silver nisab'}`,
        value: 489.89
      },
      {
        step: '2. Total Asset Value',
        description: 'Sum of all eligible assets',
        value: 48000
      },
      {
        step: '3. Apply Deductions',
        description: 'Subtract immediate debts and expenses',
        value: 1000
      },
      {
        step: '4. Zakatable Amount',
        description: 'Assets after deductions that exceed nisab',
        value: 47000
      },
      {
        step: '5. Calculate Zakat (2.5%)',
        description: 'Apply standard zakat rate',
        value: 1175
      }
    ],
    methodology: {
      name: selectedMethod === 'hanafi' ? 'Hanafi School Method' : 
            selectedMethod === 'shafii' ? 'Shafi\'i School Method' : 
            'Standard Method (AAOIFI)',
      description: selectedMethod === 'hanafi' ? 'Silver-based nisab with comprehensive business inclusion' :
                   selectedMethod === 'shafii' ? 'Detailed categorization with dual nisab' :
                   'Internationally recognized dual nisab method',
      nisabBasis: selectedMethod === 'hanafi' ? 'silver' : 'dual_minimum'
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          Zakat Methodology Selection
        </h1>
        <p className="text-lg text-neutral-600">
          Choose the calculation method that best suits your circumstances and regional practices.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
        <MethodologySelector
          selectedMethod={selectedMethod}
          onMethodSelect={handleMethodSelect}
        />
      </div>

      {/* Calculation Breakdown Display */}
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900 mb-4">
          Calculation Transparency Demo
        </h2>
        <p className="text-neutral-600 mb-6">
          This demonstrates how the calculation breakdown is displayed to users, 
          showing step-by-step transparency for the selected methodology.
        </p>
        <CalculationBreakdownDisplay 
          breakdown={sampleBreakdown}
          currency="USD"
          showDetails={true}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">
          Integration Note
        </h2>
        <p className="text-blue-800 text-sm">
          This component is ready for integration with the zakat calculation engine. 
          The selected methodology ({selectedMethod}) can be passed to the calculation 
          system to determine the appropriate nisab thresholds, business asset treatment, 
          and debt deduction rules.
        </p>
        
        <div className="mt-4 p-3 bg-blue-100 rounded text-xs text-blue-700">
          <strong>Current Selection:</strong> {selectedMethod}
        </div>
      </div>
    </div>
  );
};