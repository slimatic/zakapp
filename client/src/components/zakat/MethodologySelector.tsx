/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { apiService } from '../../services/api';
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

    // Persist through the api service, which attaches the auth header from the
    // key the session actually writes (`accessToken`). This previously read
    // `localStorage.getItem('token')` — a key nothing writes — so it sent
    // `Authorization: Bearer null` and the server answered 401, which surfaced
    // as "Failed to save methodology preference" on every selection.
    try {
      const result = await apiService.updateSettings({
        preferredMethodology: methodologyId,
      });

      if (!result?.success) {
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
        <div className="bg-warn-soft border border-warn/30 rounded-lg p-4">
          <p className="text-sm text-warn-strong whitespace-pre-line">
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
          <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                        <h2 className="text-2xl font-bold text-foreground">{methodology.name}</h2>
                        <p className="text-muted-foreground">{methodology.shortDescription}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowInfoModal(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="text-2xl">×</span>
                    </button>
                  </div>

                  {/* Content Sections */}
                  <div className="space-y-6">
                    {/* Overview */}
                    <section>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Overview</h3>
                      <p className="text-foreground/80">{methodology.overview}</p>
                    </section>

                    {/* Historical Context */}
                    <section>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Historical Context</h3>
                      <p className="text-foreground/80">{methodology.historicalContext}</p>
                    </section>

                    {/* Nisab Calculation */}
                    <section className="bg-accent rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-foreground mb-2">Nisab Calculation</h3>
                      <p className="text-foreground/80 mb-2"><strong>Method:</strong> {methodology.nisabCalculation.method}</p>
                      <p className="text-foreground/80 mb-2"><strong>Threshold:</strong> {methodology.nisabCalculation.threshold}</p>
                      <p className="text-foreground/80">{methodology.nisabCalculation.description}</p>
                    </section>

                    {/* Asset Treatment */}
                    <section>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Asset Treatment</h3>
                      <p className="text-foreground/80 mb-3">{methodology.assetTreatment.description}</p>
                      <ul className="space-y-2">
                        {methodology.assetTreatment.rules.map((rule, index) => (
                          <li key={index} className="flex items-start space-x-2 text-foreground/80">
                            <span className="text-success mt-1">✓</span>
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    {/* When to Use */}
                    <section className="bg-success-soft rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-foreground mb-2">When to Use This Methodology</h3>
                      <ul className="space-y-2">
                        {methodology.whenToUse.map((reason, index) => (
                          <li key={index} className="flex items-start space-x-2 text-foreground/80">
                            <span className="text-success mt-1">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    {/* Practical Example */}
                    <section className="bg-muted rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-foreground mb-2">Practical Example</h3>
                      <p className="text-xs text-muted-foreground italic mb-3">
                        Illustrative figures only — the nisab amounts shown here are hypothetical.
                        Your live nisab thresholds (in your currency) are shown in the cards above.
                      </p>
                      <div className="space-y-3">
                        <div>
                          <p className="font-medium text-foreground/80">Scenario:</p>
                          <p className="text-muted-foreground">{methodology.practicalExample.scenario}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground/80">Calculation:</p>
                          <p className="text-muted-foreground whitespace-pre-line font-mono text-sm">
                            {methodology.practicalExample.calculation}
                          </p>
                        </div>
                        <div className="bg-card rounded p-3 border-s-4 border-primary">
                          <p className="font-bold text-secondary">Result: {methodology.practicalExample.result}</p>
                        </div>
                      </div>
                    </section>

                    {/* Scholarly Sources */}
                    <section>
                      <h3 className="text-lg font-semibold text-foreground mb-2">Scholarly Sources</h3>
                      <ul className="space-y-1">
                        {methodology.sources.map((source, index) => (
                          <li key={index} className="flex items-start space-x-2 text-foreground/80">
                            <span className="text-muted-foreground">•</span>
                            <span>{source}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    {/* Regional Information */}
                    {methodology.commonRegions && (
                      <section>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Common in Regions</h3>
                        <p className="text-foreground/80">{methodology.commonRegions.join(', ')}</p>
                      </section>
                    )}

                    {/* Scholarly Basis */}
                    {methodology.scholarlyBasis && (
                      <section className="bg-accent rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-foreground mb-2">Scholarly Basis</h3>
                        <p className="text-foreground/80">{methodology.scholarlyBasis}</p>
                      </section>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="mt-6 pt-6 border-t border-border flex justify-end">
                    <Button
                      onClick={() => {
                        setShowInfoModal(null);
                        handleMethodologySelect(methodology.id);
                      }}
                      className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-6 py-2 rounded-lg"
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
        <div className="bg-accent border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-secondary mb-4">
            ❓ Frequently Asked Questions
          </h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-secondary">Which methodology should I choose?</p>
              <p className="text-secondary mt-1">
                The Standard (AAOIFI) methodology is widely accepted for modern financial situations. 
                If you follow a specific school of thought (Hanafi, Shafi'i, etc.), choose accordingly. 
                When in doubt, consult local Islamic scholars for guidance.
              </p>
            </div>
            
            <div>
              <p className="font-medium text-secondary">What's the difference between gold and silver nisab?</p>
              <p className="text-secondary mt-1">
                Gold nisab (~87g) results in a higher threshold because gold is more valuable per gram, while silver nisab (~612g) 
                is lower in monetary terms. The live thresholds in your currency are shown above. The Hanafi school uses the lower (silver) threshold to maximize benefit to those in need.
              </p>
            </div>
            
            <div>
              <p className="font-medium text-secondary">How do I know which methodology is right for me?</p>
              <p className="text-secondary mt-1">
                Click "Learn More" on each methodology card to see detailed information including when to use it, 
                practical examples, and scholarly sources. Consider your regional traditions and consult with scholars.
              </p>
            </div>

            <div>
              <p className="font-medium text-secondary">Can I use the Custom methodology?</p>
              <p className="text-secondary mt-1">
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