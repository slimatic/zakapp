import React, { useState, useEffect } from 'react';
import { ZAKAT_METHODS } from '@zakapp/shared';
import { methodologyService, MethodologyEducationData } from '../services';
import { Card, CardContent } from './ui/card';

interface MethodologyEducationProps {
  method: string;
  className?: string;
}

export const MethodologyEducation: React.FC<MethodologyEducationProps> = ({ 
  method,
  className = ''
}) => {
  const [methodInfo, setMethodInfo] = useState<MethodologyEducationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEducationalContent = async () => {
      if (!method) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await methodologyService.getMethodologyEducation(method);
        if (response.success && response.data) {
          setMethodInfo(response.data.education);
        } else {
          setError('Failed to load educational content');
        }
      } catch (err) {
        console.error('Error fetching methodology education:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchEducationalContent();
  }, [method]);

  if (loading) {
    return (
      <Card className={`methodology-education ${className}`}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-neutral-200 rounded"></div>
            <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`methodology-education ${className}`}>
        <CardContent className="p-6">
          <div className="text-red-600 text-sm">
            <p className="font-medium">Error loading educational content:</p>
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!methodInfo) {
    return (
      <Card className={`methodology-education ${className}`}>
        <CardContent className="p-6">
          <p className="text-neutral-600">No educational content available for this methodology.</p>
        </CardContent>
      </Card>
    );
  }

  const methodName = ZAKAT_METHODS[method.toUpperCase() as keyof typeof ZAKAT_METHODS]?.name || method;

  return (
    <div className={`methodology-education ${className}`}>
      <h4 className="text-lg font-semibold text-neutral-900 mb-4">
        {methodName} - Educational Overview
      </h4>
      
      <div className="space-y-6">
        <section>
          <h5 className="text-base font-medium text-neutral-800 mb-2">Historical Background</h5>
          <p className="text-sm text-neutral-700 leading-relaxed">{methodInfo.historicalBackground}</p>
        </section>
        
        <section>
          <h5 className="text-base font-medium text-neutral-800 mb-2">Scholarly Basis</h5>
          <div className="text-sm text-neutral-700 leading-relaxed">
            <p className="mb-2">{methodInfo.nisabApproach}</p>
            <p className="mb-2">{methodInfo.businessAssetTreatment}</p>
            <p>{methodInfo.debtTreatment}</p>
          </div>
        </section>
        
        <section>
          <h5 className="text-base font-medium text-neutral-800 mb-2">Regional Usage</h5>
          <p className="text-sm text-neutral-700">
            Commonly used in: {ZAKAT_METHODS[method.toUpperCase() as keyof typeof ZAKAT_METHODS]?.regions?.join(', ') || 'Various regions'}
          </p>
        </section>
        
        <section>
          <h5 className="text-base font-medium text-neutral-800 mb-3">Key Characteristics</h5>
          <div className="pros-cons grid md:grid-cols-2 gap-4">
            <div>
              <h6 className="text-sm font-medium text-green-800 mb-2">Advantages</h6>
              <ul className="space-y-1">
                {methodInfo.pros.map((pro, index) => (
                  <li key={index} className="text-xs text-neutral-700 flex items-start">
                    <span className="text-green-600 mr-2 mt-1">•</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h6 className="text-sm font-medium text-amber-800 mb-2">Considerations</h6>
              <ul className="space-y-1">
                {methodInfo.considerations.map((con, index) => (
                  <li key={index} className="text-xs text-neutral-700 flex items-start">
                    <span className="text-amber-600 mr-2 mt-1">•</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};