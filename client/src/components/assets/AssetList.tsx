import React from 'react';
import { useAssetRepository } from '../../hooks/useAssetRepository';
import { Asset, AssetType } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Plus, Wallet, TrendingUp } from 'lucide-react';

export const AssetList: React.FC = () => {
  const { assets, isLoading, error } = useAssetRepository();

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getAssetTypeLabel = (type: AssetType): string => {
    return type.replace(/_/g, ' ');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        <span>{`Error loading assets: ${error}`}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Your Assets</h2>
        <Button onClick={() => window.location.href = '/assets/new'}>
          <Plus className="h-4 w-4 mr-2" /> Add Asset
        </Button>
      </div>

      {assets.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Wallet className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900">No assets tracked yet</h3>
            <p className="text-slate-500 max-w-sm mt-2 mb-6">
              Start adding your assets to the local vault to calculate your Zakat obligation.
            </p>
            <Button onClick={() => window.location.href = '/assets/new'}>
              Add Your First Asset
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <Card key={asset.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-500">
                  {getAssetTypeLabel(asset.type)}
                </CardTitle>
                <div className={`p-2 rounded-full ${asset.type === 'RETIREMENT' ? 'bg-secondary-100 text-secondary-600' : 'bg-primary-100 text-primary-600'}`}>
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {formatCurrency(asset.value, asset.currency)}
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                  {asset.name}
                </p>
                {asset.type === 'RETIREMENT' && (
                  <Badge variant="secondary" className="mt-3">
                    401k/IRA
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
