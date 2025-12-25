import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAssetRepository } from '../../hooks/useAssetRepository';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Wallet, Calculator, TrendingUp, History, ArrowRight } from 'lucide-react';
import { Asset } from '../../types';
import { isAssetZakatable } from '../../core/calculations/zakat';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // Use Local-First hook instead of API
  const { assets, isLoading } = useAssetRepository();

  // Simple metrics calculation from local data
  const dashboardMetrics = useMemo(() => {
    const totalAssetValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
    const zakatableAssets = assets.filter(a => isAssetZakatable(a, 'STANDARD')).length;
    return { totalAssetValue, zakatableAssets };
  }, [assets]);

  const { totalAssetValue, zakatableAssets } = dashboardMetrics;

  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="mt-1 text-slate-500">
            Welcome to your secure, local-first Zakat vault.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/assets/new')} variant="outline">
            <Wallet className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
          <Button onClick={() => navigate('/calculate')} variant="default" className="shadow-lg shadow-emerald-600/20">
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Zakat
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Assets */}
        <Card className="hover:shadow-md transition-shadow duration-300 border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Total Assets Value
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(totalAssetValue)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Across {assets.length} tracked assets
            </p>
          </CardContent>
        </Card>

        {/* Zakatable Assets */}
        <Card className="hover:shadow-md transition-shadow duration-300 border-l-4 border-l-amber-400">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Zakatable Assets
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {zakatableAssets}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Assets eligible for Zakat
            </p>
          </CardContent>
        </Card>

        {/* Zakat Due (Placeholder/Estimated) */}
        <Card className="hover:shadow-md transition-shadow duration-300 border-l-4 border-l-slate-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Last Calculation
            </CardTitle>
            <History className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              --
            </div>
            <p className="text-xs text-slate-500 mt-1">
              <Link to="/history" className="text-emerald-600 hover:underline">View History</Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Assets Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Assets */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Assets</CardTitle>
          </CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Wallet className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p>No assets tracked yet.</p>
                <Button variant="link" onClick={() => navigate('/assets/new')}>Add your first asset</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {assets.slice(0, 3).map((asset) => (
                  <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group hover:bg-emerald-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg shadow-sm">
                        {asset.type === 'CASH' ? '💵' : asset.type === 'GOLD' ? '🪙' : '📦'}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 group-hover:text-emerald-900">{asset.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{asset.type.toLowerCase().replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(asset.value, asset.currency)}</p>
                      {isAssetZakatable(asset, 'STANDARD') && <Badge variant="secondary" className="text-[10px] h-5">Zakatable</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          {assets.length > 0 && (
            <CardFooter className="bg-slate-50/50 border-t border-slate-100 p-3">
              <Link to="/assets" className="w-full text-center text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center justify-center gap-1">
                View All Assets <ArrowRight className="h-3 w-3" />
              </Link>
            </CardFooter>
          )}
        </Card>

        {/* Quick Guide / Help */}
        <Card className="col-span-1 bg-gradient-to-br from-emerald-900 to-slate-900 text-white border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-white">Why Local-First?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-emerald-100/90 leading-relaxed">
              To protect your financial privacy, ZakApp calculates everything
              <strong> on your device</strong>. Your asset data never leaves your browser unencrypted.
            </p>
            <ul className="space-y-2 text-sm text-emerald-50/80">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                Zero-Knowledge Architecture
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                Offline Capability
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                Client-Side Encryption (AES-GCM)
              </li>
            </ul>
            <Button
              variant="secondary"
              className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
              onClick={() => window.open('https://github.com/zakapp/project-ikhlas', '_blank')}
            >
              Learn More on GitHub
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};