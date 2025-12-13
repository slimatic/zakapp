import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../ui';
import { MethodologyCard } from './MethodologyCard';
import { getAllMethodologies, getMethodology, DISCLAIMER } from '../../data/methodologies';

interface MethodologySelectorProps {
  selectedMethodology: string;
  onMethodologyChange: (methodology: string) => void;
  showEducationalContent?: boolean;
}

/**
 * MethodologySelector Component
 * Enhanced methodology selection with educational content using MethodologyCard components
 */
export const MethodologySelector: React.FC<MethodologySelectorProps> = ({
  selectedMethodology,
  onMethodologyChange,
  showEducationalContent = true
}) => {
  const [showInfoModal, setShowInfoModal] = useState<string | null>(null);

  // Get all methodologies from our data file
  const methodologies = getAllMethodologies();

  const handleMethodologySelect = async (methodologyId: string) => {
    onMethodologyChange(methodologyId);
    
    // Save preference to backend
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preferredMethodology: methodologyId
        })
      });
      
      if (!response.ok) {
        toast.error('Failed to save methodology preference');
      }
    } catch (error) {
      toast.error('Error saving methodology preference');
    }
  };

  const handleLearnMore = (methodologyId: string) => {
    setShowInfoModal(methodologyId);
  };

  const getRecommendedMethodology = (): string => {
    // Standard (AAOIFI) is recommended for most users
    return 'standard';
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      {showEducationalContent && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 whitespace-pre-line">
            {DISCLAIMER}
          </p>
        </div>
      )}

      {/* Methodology Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methodologies.map((methodology) => (
          <MethodologyCard
            key={methodology.id}
            id={methodology.id}
            name={methodology.name}
            description={methodology.shortDescription}
            characteristics={methodology.characteristics}
            icon={methodology.icon}
            isSelected={selectedMethodology === methodology.id}
            isRecommended={methodology.id === getRecommendedMethodology()}
            onClick={() => handleMethodologySelect(methodology.id)}
            onLearnMore={() => handleLearnMore(methodology.id)}
          />
        ))}
      </div>

      {/* Detailed Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {(() => {
              const methodology = getMethodology(showInfoModal);
              if (!methodology) return null;

              return (
                <div className="p-6">
                  {/* Modal Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <span className="text-4xl">{methodology.icon}</span>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{methodology.name}</h2>
                        <p className="text-gray-600">{methodology.shortDescription}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowInfoModal(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <span className="text-2xl">×</span>
                    </button>
                  </div>

                  {/* Content Sections */}
                  <div className="space-y-6">
                    {/* Overview */}
                    <section>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Overview</h3>
                      <p className="text-gray-700">{methodology.overview}</p>
                    </section>

                    {/* Historical Context */}
                    <section>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Historical Context</h3>
                      <p className="text-gray-700">{methodology.historicalContext}</p>
                    </section>

                    {/* Nisab Calculation */}
                    <section className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Nisab Calculation</h3>
                      <p className="text-gray-700 mb-2"><strong>Method:</strong> {methodology.nisabCalculation.method}</p>
                      <p className="text-gray-700 mb-2"><strong>Threshold:</strong> {methodology.nisabCalculation.threshold}</p>
                      <p className="text-gray-700">{methodology.nisabCalculation.description}</p>
                    </section>

                    {/* Asset Treatment */}
                    <section>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Asset Treatment</h3>
                      <p className="text-gray-700 mb-3">{methodology.assetTreatment.description}</p>
                      <ul className="space-y-2">
                        {methodology.assetTreatment.rules.map((rule, index) => (
                          <li key={index} className="flex items-start space-x-2 text-gray-700">
                            <span className="text-green-600 mt-1">✓</span>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    {/* When to Use */}
                    <section className="bg-green-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">When to Use This Methodology</h3>
                      <ul className="space-y-2">
                        {methodology.whenToUse.map((reason, index) => (
                          <li key={index} className="flex items-start space-x-2 text-gray-700">
                            <span className="text-green-600 mt-1">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    {/* Practical Example */}
                    <section className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Practical Example</h3>
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-gray-700">Scenario:</p>
                          <p className="text-gray-600">{methodology.practicalExample.scenario}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Calculation:</p>
                          <p className="text-gray-600 whitespace-pre-line font-mono text-sm">
                            {methodology.practicalExample.calculation}
                          </p>
                        </div>
                        <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                          <p className="font-bold text-blue-900">Result: {methodology.practicalExample.result}</p>
                        </div>
                      </div>
                    </section>

                    {/* Scholarly Sources */}
                    <section>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Scholarly Sources</h3>
                      <ul className="space-y-1">
                        {methodology.sources.map((source, index) => (
                          <li key={index} className="flex items-start space-x-2 text-gray-700">
                            <span className="text-gray-400">•</span>
                            <span>{source}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    {/* Regional Information */}
                    {methodology.commonRegions && (
                      <section>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Common in Regions</h3>
                        <p className="text-gray-700">{methodology.commonRegions.join(', ')}</p>
                      </section>
                    )}

                    {/* Scholarly Basis */}
                    {methodology.scholarlyBasis && (
                      <section className="bg-purple-50 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Scholarly Basis</h3>
                        <p className="text-gray-700">{methodology.scholarlyBasis}</p>
                      </section>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                    <Button
                      onClick={() => {
                        setShowInfoModal(null);
                        handleMethodologySelect(methodology.id);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                    >
                      Select {methodology.name}
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* FAQ Section */}
      {showEducationalContent && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            ❓ Frequently Asked Questions
          </h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-blue-900">Which methodology should I choose?</p>
              <p className="text-blue-800 mt-1">
                The Standard (AAOIFI) methodology is widely accepted for modern financial situations. 
                If you follow a specific school of thought (Hanafi, Shafi'i, etc.), choose accordingly. 
                When in doubt, consult local Islamic scholars for guidance.
              </p>
            </div>
            
            <div>
              <p className="font-medium text-blue-900">What's the difference between gold and silver nisab?</p>
              <p className="text-blue-800 mt-1">
                Gold nisab (85g) typically results in a higher threshold (~$5,500), while silver nisab (595g) 
                is lower (~$400). The Hanafi school uses the lower threshold to maximize benefit to those in need.
              </p>
            </div>
            
            <div>
              <p className="font-medium text-blue-900">How do I know which methodology is right for me?</p>
              <p className="text-blue-800 mt-1">
                Click "Learn More" on each methodology card to see detailed information including when to use it, 
                practical examples, and scholarly sources. Consider your regional traditions and consult with scholars.
              </p>
            </div>

            <div>
              <p className="font-medium text-blue-900">Can I use the Custom methodology?</p>
              <p className="text-blue-800 mt-1">
                The Custom methodology is for special circumstances where you have specific guidance from a qualified 
                Islamic scholar. It should not be used without proper scholarly consultation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};