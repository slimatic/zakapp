import React, { useState } from 'react';
import { ZAKAT_METHODS } from '@zakapp/shared';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface MethodologySelectorProps {
  selectedMethod?: string;
  onMethodSelect: (methodId: string) => void;
  className?: string;
}

interface MethodologyCardProps {
  method: typeof ZAKAT_METHODS[keyof typeof ZAKAT_METHODS];
  selected: boolean;
  onSelect: (methodId: string) => void;
}

const MethodologyCard: React.FC<MethodologyCardProps> = ({
  method,
  selected,
  onSelect,
}) => {
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        selected 
          ? 'ring-2 ring-primary-500 bg-primary-50' 
          : 'hover:bg-neutral-50'
      }`}
      onClick={() => onSelect(method.id)}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{method.name}</span>
          {selected && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              Selected
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-neutral-600 mb-3">
          {method.description}
        </p>
        
        <div className="space-y-2">
          <div className="text-xs text-neutral-500">
            <strong>Nisab Basis:</strong> {method.nisabBasis.replace('_', ' ')}
          </div>
          <div className="text-xs text-neutral-500">
            <strong>Regions:</strong> {method.regions.slice(0, 2).join(', ')}
            {method.regions.length > 2 && ` +${method.regions.length - 2} more`}
          </div>
          <div className="text-xs text-neutral-500">
            <strong>Zakat Rate:</strong> {method.zakatRate}%
          </div>
        </div>

        <div className="mt-3">
          <details className="text-xs">
            <summary className="cursor-pointer text-primary-600 hover:text-primary-700">
              Learn more
            </summary>
            <div className="mt-2 space-y-2">
              <div>
                <strong>Suitable for:</strong>
                <ul className="list-disc list-inside ml-2">
                  {method.suitableFor.slice(0, 2).map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong>Key advantages:</strong>
                <ul className="list-disc list-inside ml-2">
                  {method.pros.slice(0, 2).map((pro, index) => (
                    <li key={index}>{pro}</li>
                  ))}
                </ul>
              </div>
            </div>
          </details>
        </div>
      </CardContent>
    </Card>
  );
};

export const MethodologySelector: React.FC<MethodologySelectorProps> = ({
  selectedMethod = 'standard',
  onMethodSelect,
  className = '',
}) => {
  const [showComparison, setShowComparison] = useState(false);

  const methods = Object.values(ZAKAT_METHODS);

  return (
    <div className={`methodology-selector ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Select Calculation Method
        </h3>
        <p className="text-sm text-neutral-600">
          Choose the zakat calculation methodology that best suits your needs and regional practices.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {methods.map((method) => (
          <MethodologyCard
            key={method.id}
            method={method}
            selected={selectedMethod === method.id}
            onSelect={onMethodSelect}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => setShowComparison(true)}
          variant="outline"
          size="md"
        >
          Compare Methods
        </Button>
        
        {selectedMethod && (
          <div className="flex-1 text-sm text-neutral-600">
            <span className="font-medium">Selected:</span>{' '}
            {ZAKAT_METHODS[selectedMethod.toUpperCase() as keyof typeof ZAKAT_METHODS]?.name || 'Unknown method'}
          </div>
        )}
      </div>

      {showComparison && (
        <div className="mt-6 p-4 border rounded-lg bg-neutral-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold">Method Comparison</h4>
            <Button
              onClick={() => setShowComparison(false)}
              variant="ghost"
              size="sm"
            >
              Close
            </Button>
          </div>
          <div className="text-sm text-neutral-600">
            <p className="mb-2">
              Compare different zakat calculation methodologies to understand their differences:
            </p>
            <ul className="space-y-1">
              <li>• <strong>Standard Method:</strong> Modern international consensus approach</li>
              <li>• <strong>Hanafi Method:</strong> Silver-based nisab with comprehensive inclusion</li>
              <li>• <strong>Shafi&apos;i Method:</strong> Detailed categorization with dual nisab</li>
              <li>• <strong>Maliki Method:</strong> Community-focused with regional adaptation</li>
              <li>• <strong>Hanbali Method:</strong> Conservative gold-based approach</li>
              <li>• <strong>Custom Method:</strong> User-defined parameters</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};