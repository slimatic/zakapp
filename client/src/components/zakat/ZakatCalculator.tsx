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

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AssetType, NisabInfo } from '../../types';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { PaymentModal } from './PaymentModal';
import { MethodologySelector } from './MethodologySelector';
// Local-First Imports
import { useAssetRepository } from '../../hooks/useAssetRepository';
import { calculateZakat } from '../../core/calculations/zakat';
import { calculateNisabThreshold, DEFAULT_NISAB_DATA } from '../../core/calculations/nisab';
import { getAssetRuling, type AssetRuling } from '../../data/rulings';
import { AssetRulingExplanation } from './AssetRulingExplanation';

// Premium UI Imports
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ShieldCheck, ArrowRight, Wallet, TrendingUp, Calculator, Lock } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const ZakatCalculator: React.FC = () => {
  // Local DB Hooks
  const { assets } = useAssetRepository();
  const { user } = useAuth();
  const userCurrency = ((user as any)?.settings?.currency || (user as any)?.preferences?.currency || 'USD').toUpperCase();

  const [nisabInfo, setNisabInfo] = useState<NisabInfo | null>(null);
  const [selectedMethodology, setSelectedMethodology] = useState<string>('standard');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [calculation, setCalculation] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: Intro, 1: Assets, 2: Review

  useEffect(() => {
    loadNisabData();
  }, [userCurrency]);

  // Auto-select new assets when they load
  useEffect(() => {
    if (assets.length > 0) {
      setSelectedAssets(assets.map(a => a.id));
    }
  }, [assets]);

  const loadNisabData = async () => {
    try {
      // Issue #310: pass the user's currency explicitly so the nisab comes
      // back in the currency this page displays.
      const nisabResponse = await apiService.getNisab(userCurrency);
      if (nisabResponse.success && nisabResponse.data) {
        setNisabInfo(nisabResponse.data);
      } else {
        setNisabInfo({ ...DEFAULT_NISAB_DATA, goldNisab: DEFAULT_NISAB_DATA.goldPrice * DEFAULT_NISAB_DATA.goldNisabGrams, silverNisab: DEFAULT_NISAB_DATA.silverPrice * DEFAULT_NISAB_DATA.silverNisabGrams, effectiveNisab: DEFAULT_NISAB_DATA.goldPrice * DEFAULT_NISAB_DATA.goldNisabGrams, currency: 'USD', lastUpdated: new Date().toISOString() });
      }
    } catch (err) {
      setNisabInfo({ ...DEFAULT_NISAB_DATA, goldNisab: DEFAULT_NISAB_DATA.goldPrice * DEFAULT_NISAB_DATA.goldNisabGrams, silverNisab: DEFAULT_NISAB_DATA.silverPrice * DEFAULT_NISAB_DATA.silverNisabGrams, effectiveNisab: DEFAULT_NISAB_DATA.goldPrice * DEFAULT_NISAB_DATA.goldNisabGrams, currency: 'USD', lastUpdated: new Date().toISOString() });
    }
  };

  const handleCalculateZakat = async () => {
    setIsLoading(true);
    try {
      const methodology = (selectedMethodology.toUpperCase() as any) || 'STANDARD';

      const goldPrice = nisabInfo?.goldPrice || DEFAULT_NISAB_DATA.goldPrice;
      const silverPrice = nisabInfo?.silverPrice || DEFAULT_NISAB_DATA.silverPrice;

      let nisabValue = calculateNisabThreshold({
        goldPrice,
        silverPrice,
        goldNisabGrams: 87.48,
        silverNisabGrams: 612.36
      }, methodology);

      const assetsToCalc = assets.filter(a => selectedAssets.includes(a.id));
      const result = calculateZakat(assetsToCalc, [], { gold: goldPrice * 87.48, silver: silverPrice * 612.36 }, methodology);

      // Per-asset madhab ruling explanations (transparency engine)
      const assetRulings: Array<{
        assetId: string;
        name: string;
        type: AssetType;
        value: number;
        ruling: AssetRuling;
      }> = assetsToCalc.map(a => ({
        assetId: a.id,
        name: a.name,
        type: a.type,
        value: a.value,
        ruling: getAssetRuling(a, methodology),
      }));

      setCalculation({
        id: 'local-calc',
        methodology: { name: selectedMethodology },
        totalAssets: result.totalAssets,
        nisabThreshold: nisabValue,
        isAboveNisab: result.isZakatObligatory,
        zakatDue: result.zakatDue,
        zakatRate: 0.025,
        currency: 'USD',
        calculatedAt: new Date().toISOString(),
        assetBreakdown: Object.entries(result.breakdown.assets).map(([type, data]) => ({
          type: type as AssetType,
          totalValue: data.total,
          zakatableAmount: data.zakatable,
          count: 0
        })),
        assetRulings,
        reason: result.isZakatObligatory ? null : 'Net worth is below Nisab threshold.'
      });

      setCurrentStep(2); // Move to Review
    } catch (err) {
      toast.error('Calculation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssetSelection = (assetId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedAssets(prev => [...prev, assetId]);
    } else {
      setSelectedAssets(prev => prev.filter(id => id !== assetId));
    }
  };


  const steps = [
    { id: 0, title: "Methodology" },
    { id: 1, title: "Assets" },
    { id: 2, title: "Review" }
  ];

  /* --- WIZARD STEPS --- */

  const renderIntroStep = () => (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <CardTitle>Calculation Methodology</CardTitle>
          <CardDescription>Select the fiqh opinion you follow.</CardDescription>
        </CardHeader>
        <CardContent>
          <MethodologySelector
            selectedMethodology={selectedMethodology}
            onMethodologyChange={setSelectedMethodology}
            showEducationalContent={true}
          />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={() => setCurrentStep(1)} className="w-full sm:w-auto">
            Next: Select Assets <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  const renderAssetsStep = () => (
    <div className="space-y-6 animate-slide-up">
      <Card>
        <CardHeader>
          <CardTitle>Your Asssets</CardTitle>
          <CardDescription>Select which assets to include in the calculation.</CardDescription>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-12 bg-surface-2 rounded-lg border-dashed border-2 border-border">
              <Wallet className="mx-auto h-12 w-12 text-tertiary" />
              <p className="mt-2 text-muted-foreground text-sm">No assets found in your local vault.</p>
              <Button variant="link" onClick={() => window.location.href = '/assets'}>Add Assets Now</Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {assets.map((asset) => (
                <div key={asset.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${selectedAssets.includes(asset.id) ? 'border-primary bg-accent ring-1 ring-ring' : 'border-border hover:border-border-strong'}`}
                  onClick={() => handleAssetSelection(asset.id, !selectedAssets.includes(asset.id))}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${selectedAssets.includes(asset.id) ? 'bg-accent text-secondary' : 'bg-muted text-muted-foreground'}`}>
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{asset.name}</h4>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{asset.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-end">
                    <p className="font-bold text-foreground">{formatCurrency(asset.value, asset.currency)}</p>
                    {asset.type === 'RETIREMENT' && <Badge variant="secondary" className="mt-1">401k/IRA</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={() => setCurrentStep(0)}>Back</Button>
          <Button onClick={handleCalculateZakat} disabled={assets.length === 0 || isLoading}>
            {isLoading ? 'Calculating...' : 'Calculate Zakat'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );

  const renderReviewStep = () => {
    if (!calculation) return null;
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Highlight Result */}
        <Card className="border-border bg-card overflow-hidden relative">
          <div className="absolute top-0 inline-end-0 p-4 opacity-10">
            <Calculator className="h-48 w-48 text-secondary" />
          </div>
          <CardContent className="pt-8 pb-8 text-center relative z-10">
            <p className="text-sm font-medium text-secondary uppercase tracking-wider mb-2">Zakat Obligation</p>
            <h2 className="text-5xl font-bold text-foreground mb-2">{formatCurrency(calculation.zakatDue)}</h2>
            <p className="text-muted-foreground text-sm">
              {calculation.isAboveNisab
                ? `Nisab Threshold: ${formatCurrency(calculation.nisabThreshold)} (Exceeded)`
                : `Below Nisab Threshold (${formatCurrency(calculation.nisabThreshold)})`}
            </p>
          </CardContent>
        </Card>

        {/* Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Wealth Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-muted-foreground">Total Assets</span>
              <span className="font-semibold">{formatCurrency(calculation.totalAssets)}</span>
            </div>
            {calculation.assetBreakdown.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-2 text-sm">
                <span className="text-muted-foreground ps-4 border-l-2 border-border">{item.type.replace(/_/g, ' ')}</span>
                <span className="font-medium text-foreground">{formatCurrency(item.zakatableAmount)} (Zakatable)</span>
              </div>
            ))}

            {/* Per-asset madhab rulings — why each asset is zakatable/exempt */}
            {calculation.assetRulings && calculation.assetRulings.length > 0 && (
              <div className="pt-3 space-y-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Why each asset counts the way it does
                </p>
                {calculation.assetRulings.map((item: any) => (
                  <AssetRulingExplanation
                    key={item.assetId}
                    ruling={item.ruling}
                    assetName={item.name}
                  />
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="w-full" onClick={() => setCurrentStep(1)}>Edit Assets</Button>
            {calculation.zakatDue > 0 && (
              <Button className="w-full" onClick={() => setShowPaymentModal(true)}>Record Payment</Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header with Privacy Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Zakat Calculator</h1>
          <p className="text-muted-foreground mt-1">Calculate your obligation locally & privately.</p>
        </div>
        <div className="flex items-center space-x-2 bg-card px-3 py-1.5 rounded-full border border-border shadow-sm">
          <ShieldCheck className="h-4 w-4 text-success" />
          <span className="text-xs font-medium text-secondary">Local-First Architecture</span>
          <Badge variant="privacy" className="ml-2">
            <Lock className="h-3 w-3 mr-1" /> Encrypted
          </Badge>
        </div>
      </div>

      {/* Steps Indicator. Wraps and centres: three steps plus two 48px
          connectors exceed a 390px phone, and `space-x-4` does not wrap. */}
      <div className="mb-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 sm:space-x-4">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center">
            <div className={`
                       h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                       ${currentStep === step.id ? 'bg-primary text-primary-foreground shadow-elev-2' :
                currentStep > step.id ? 'bg-accent text-secondary' : 'bg-muted text-tertiary'}
                   `}>
              {currentStep > step.id ? <ShieldCheck className="h-4 w-4" /> : step.id + 1}
            </div>
            <span className={`ml-2 text-sm font-medium ${currentStep === step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
              {step.title}
            </span>
            {/* Connector: decorative, and the first thing to go on a narrow screen */}
            {step.id !== steps.length - 1 && (
              <div className="mx-4 hidden h-px w-12 bg-border-strong sm:block" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 0 && renderIntroStep()}
        {currentStep === 1 && renderAssetsStep()}
        {currentStep === 2 && renderReviewStep()}
      </div>

      {/* Payment Modal */}
      {calculation && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          zakatAmount={calculation.zakatDue || 0}
          currency={userCurrency}
          onPaymentRecorded={() => toast.success("Payment Recorded!")}
        />
      )}
    </div>
  );
};