import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Asset, AssetType, ZakatCalculation, NisabInfo, ZakatPayment, ZakatMethodology } from '../../types';
import { apiService } from '../../services/api';
import { PaymentModal } from './PaymentModal';
import { MethodologySelector } from './MethodologySelector';
// Local-First Imports
import { useAssetRepository } from '../../hooks/useAssetRepository';
import { calculateZakat } from '../../core/calculations/zakat';
import { calculateNisabThreshold, DEFAULT_NISAB_DATA } from '../../core/calculations/nisab';
import { useDb } from '../../db';

// Premium UI Imports
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { ShieldCheck, ArrowRight, Wallet, TrendingUp, DollarSign, Calculator, Lock } from 'lucide-react';

export const ZakatCalculator: React.FC = () => {
  // Local DB Hooks
  const { assets, isLoading: isLoadingAssets, error: assetsError } = useAssetRepository();

  const [nisabInfo, setNisabInfo] = useState<NisabInfo | null>(null);
  const [selectedMethodology, setSelectedMethodology] = useState<string>('standard');
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [calculation, setCalculation] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: Intro, 1: Assets, 2: Review

  useEffect(() => {
    loadNisabData();
  }, []);

  // Auto-select new assets when they load
  useEffect(() => {
    if (assets.length > 0) {
      setSelectedAssets(assets.map(a => a.id));
    }
  }, [assets]);

  const loadNisabData = async () => {
    try {
      const nisabResponse = await apiService.getNisab();
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

      let nisabValue = calculateNisabThreshold({
        goldPrice: nisabInfo?.goldPrice || DEFAULT_NISAB_DATA.goldPrice,
        silverPrice: nisabInfo?.silverPrice || DEFAULT_NISAB_DATA.silverPrice,
        goldNisabGrams: 87.48,
        silverNisabGrams: 612.36
      }, methodology);

      const assetsToCalc = assets.filter(a => selectedAssets.includes(a.id));
      const result = calculateZakat(assetsToCalc, [], nisabValue, methodology);

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

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
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
            <div className="text-center py-12 bg-slate-50 rounded-lg border-dashed border-2 border-slate-200">
              <Wallet className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2 text-slate-500 text-sm">No assets found in your local vault.</p>
              <Button variant="link" onClick={() => window.location.href = '/assets'}>Add Assets Now</Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {assets.map((asset) => (
                <div key={asset.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${selectedAssets.includes(asset.id) ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-slate-200 hover:border-slate-300'}`}
                  onClick={() => handleAssetSelection(asset.id, !selectedAssets.includes(asset.id))}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${selectedAssets.includes(asset.id) ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500'}`}>
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{asset.name}</h4>
                      <p className="text-xs text-slate-500 uppercase tracking-wide">{asset.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatCurrency(asset.value, asset.currency)}</p>
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
        <Card className="border-primary-100 bg-gradient-to-br from-white to-primary-50/30 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Calculator className="h-48 w-48 text-primary-900" />
          </div>
          <CardContent className="pt-8 pb-8 text-center relative z-10">
            <p className="text-sm font-medium text-primary-600 uppercase tracking-wider mb-2">Zakat Obligation</p>
            <h2 className="text-5xl font-bold text-slate-900 mb-2">{formatCurrency(calculation.zakatDue)}</h2>
            <p className="text-slate-500 text-sm">
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
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Total Assets</span>
              <span className="font-semibold">{formatCurrency(calculation.totalAssets)}</span>
            </div>
            {calculation.assetBreakdown.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-2 text-sm">
                <span className="text-slate-500 pl-4 border-l-2 border-slate-200">{item.type.replace(/_/g, ' ')}</span>
                <span className="font-medium text-slate-700">{formatCurrency(item.zakatableAmount)} (Zakatable)</span>
              </div>
            ))}
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
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Zakat Calculator</h1>
          <p className="text-slate-500 mt-1">Calculate your obligation locally & privately.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-medium text-emerald-700">Local-First Architecture</span>
          <Badge variant="privacy" className="ml-2">
            <Lock className="h-3 w-3 mr-1" /> Encrypted
          </Badge>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center">
            <div className={`
                       h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                       ${currentStep === step.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' :
                currentStep > step.id ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-400'}
                   `}>
              {currentStep > step.id ? <ShieldCheck className="h-4 w-4" /> : step.id + 1}
            </div>
            <span className={`ml-2 text-sm font-medium ${currentStep === step.id ? 'text-slate-900' : 'text-slate-500'}`}>
              {step.title}
            </span>
            {step.id !== steps.length - 1 && <div className="w-12 h-px bg-slate-200 mx-4" />}
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
          currency="USD"
          onPaymentRecorded={() => toast.success("Payment Recorded!")}
        />
      )}
    </div>
  );
};