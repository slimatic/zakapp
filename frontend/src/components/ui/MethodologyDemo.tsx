import React, { useState } from 'react';
import { MethodologySelector } from '../MethodologySelector';

export const MethodologyDemo: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState('standard');

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    console.log('Selected methodology:', methodId);
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