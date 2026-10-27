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
import { useAuth } from '../../contexts/AuthContext';
import { PaymentModal } from './PaymentModal';
import { MethodologySelector } from './MethodologySelector';
// Local-First Imports
import { useAssetRepository } from '../../hooks/useAssetRepository';
import { useLiabilityRepository } from '../../hooks/useLiabilityRepository';
import { calculateZakat } from '../../core/calculations/zakat';
import { getNisabSource } from '../../core/calculations/nisab';
import { useNisabThreshold } from '../../hooks/useNisabThreshold';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';
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
  const { liabilities } = useLiabilityRepository();
  const { user } = useAuth();
  const userCurrency = ((user as any)?.settings?.currency || (user as any)?.preferences?.currency || 'USD').toUpperCase();
  // The gram convention the user picked, from the same single reader
  // (useDisplayCurrency) the Dashboard and the threshold chip use — the
  // Calculator never resolves it separately.
  const { nisabStandard: userNisabStandard } = useDisplayCurrency();

  const [selectedMethodology, setSelectedMethodology] = useState<string>('standard');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [calculation, setCalculation] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: Intro, 1: Assets, 2: Review

  // The threshold is owned by one hook for the whole app: it caches, retries, and
  // substitutes bundled prices when the feed is unreachable. This screen used to
  // fetch its own copy and fall back silently, which printed a stale bundled price
  // exactly like a live one. The basis follows the selected school (each school's
  // nisabSource), so the figure and the rule-set applied are the same choice.
  const nisabBasis = getNisabSource(selectedMethodology);
  const {
    nisabAmount,
    nisabPair,
    isFallback,
    isStale,
    daysSinceUpdate,
    isLoading: isNisabLoading,
    refetch: refetchPrices,
  } = useNisabThreshold(userCurrency, nisabBasis, userNisabStandard);

  // Stated wherever the figure appears. An estimate must not be presented as a
  // current rate: the bundled prices are stale by construction, so a threshold
  // computed from them carries a real uncertainty about who is liable.
  const priceNotice = isFallback
    ? 'Live prices are unavailable — this threshold is calculated from the bundled fallback prices, so it is an estimate rather than a current rate.'
    : !nisabPair && !isNisabLoading
      ? 'Nisab prices are unavailable. Retry prices and try again.'
      : isStale && daysSinceUpdate !== undefined
        ? `Pricing data is ${daysSinceUpdate} days old.`
        : null;

  // Auto-select new assets when they load
  useEffect(() => {
    if (assets.length > 0) {
      setSelectedAssets(assets.map(a => a.id));
    }
  }, [assets]);

  const handleCalculateZakat = async () => {
    // Without both per-gram prices there is no honest threshold to compare against.
    // The hook provides a pair only when it has real numbers for both metals.
    if (!nisabPair) {
      toast.error('Nisab prices are unavailable. Retry prices and try again.');
      return;
    }
    setIsLoading(true);
    try {
      const methodology = (selectedMethodology.toUpperCase() as any) || 'STANDARD';

      const assetsToCalc = assets.filter(a => selectedAssets.includes(a.id));
      // The user's real liabilities pass through; the shared rule
      // (./liabilityRules) deducts a debt the user confirmed or one due within
      // the year, so this screen states the same set the record flow does.
      // The nisab pair already carries the user's gram convention on both metals.
      const result = calculateZakat(assetsToCalc, liabilities, nisabPair, methodology);

      // The threshold shown is the hook's own figure for this basis — not a
      // second multiplication here, which could drift from it.
      const nisabThreshold = nisabAmount ?? (nisabBasis === 'GOLD' ? nisabPair.gold : nisabPair.silver);

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
        deductibleLiabilities: result.deductibleLiabilities,
        nisabThreshold,
        isAboveNisab: result.isZakatObligatory,
        zakatDue: result.zakatDue,
        zakatRate: 0.025,
        currency: userCurrency,
        // Stamped with the calculation, so the review states the provenance of
        // the figure it shows even if prices are refetched afterwards.
        priceNotice,
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
            Next: Select Assets <ArrowRight className="ms-2 h-4 w-4" />
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
          {priceNotice && (
            <div
              role="status"
              data-testid="nisab-price-notice"
              className="mt-4 rounded-lg border border-border bg-warn-soft p-3 text-sm text-warn-strong"
            >
              <p>{priceNotice}</p>
              <Button
                variant="link"
                className="mt-1 h-auto p-0 text-sm"
                onClick={() => refetchPrices()}
              >
                Retry prices
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" onClick={() => setCurrentStep(0)}>Back</Button>
          <Button
            onClick={handleCalculateZakat}
            disabled={assets.length === 0 || isLoading || isNisabLoading || !nisabPair}
          >
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
          <div className="absolute top-0 end-0 p-4 opacity-10">
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
            {calculation.priceNotice && (
              <p className="mt-1 text-xs text-warn-strong" data-testid="nisab-price-used">
                {calculation.priceNotice}
              </p>
            )}
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
            {/* The restored liability deduction is stated where the figure is
                shown, so a changed obligation is never silent. */}
            {calculation.deductibleLiabilities > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Liabilities Deducted</span>
                <span className="font-semibold">{formatCurrency(calculation.deductibleLiabilities)}</span>
              </div>
            )}
            {calculation.assetBreakdown.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-2 text-sm">
                <span className="text-muted-foreground ps-4 border-s-2 border-border">{item.type.replace(/_/g, ' ')}</span>
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
          <Badge variant="privacy" className="ms-2">
            <Lock className="h-3 w-3 me-1" /> Encrypted
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
            <span className={`ms-2 text-sm font-medium ${currentStep === step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
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