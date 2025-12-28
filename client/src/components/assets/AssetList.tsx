import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, List as ListIcon } from 'lucide-react';
import { AssetCard } from './AssetCard';
import { AssetsBreakdownChart } from '../dashboard/AssetsBreakdownChart';
import { useAssetRepository } from '../../hooks/useAssetRepository';
import { Asset } from '../../types';
import { Button, Card } from '../ui';
import { usePrivacy } from '../../contexts/PrivacyContext';

export const AssetList: React.FC = () => {
  const navigate = useNavigate();
  const { assets, removeAsset } = useAssetRepository();
  const { privacyMode } = usePrivacy();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      await removeAsset(id);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/assets/${id}/edit`);
  };

  const totalAssets = useMemo(() => {
    return assets.reduce((sum, asset) => sum + asset.value, 0);
  }, [assets]);

  const formatCurrency = (value: number, currency = 'USD') => {
    if (privacyMode) return '****';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">My Assets</h1>
        <div className="flex items-center space-x-3">
          <div className="bg-white border border-slate-200 rounded-lg p-1 flex shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              aria-label="Grid View"
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
              aria-label="List View"
              title="List View"
            >
              <ListIcon size={18} />
            </button>
          </div>
          <Button onClick={() => navigate('/assets/new')}>
            <Plus className="h-4 w-4 mr-2" /> Add Asset
          </Button>
        </div>
      </div>

      {/* Visualization Section - Only show if assets exist */}
      {assets.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <div className="h-full">
              <AssetsBreakdownChart assets={assets} />
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 flex flex-col justify-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-slate-600">Total Assets</span>
                <span className="font-bold text-lg text-slate-900">
                  {formatCurrency(totalAssets)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Asset Count</span>
                <span className="font-medium text-slate-900">{assets.length} items</span>
              </div>
              <div className="pt-4 mt-2">
                <div className="bg-green-100 text-green-800 text-xs px-3 py-2 rounded-md">
                  {privacyMode
                    ? "Privacy Mode Enabled: Values are hidden."
                    : "All values are legally owned by you and calculated locally."
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assets List/Grid */}
      {assets.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No assets yet</h3>
          <p className="text-slate-500 mb-6">Add your first asset to start tracking your wealth.</p>
          <Button onClick={() => navigate('/assets/new')}>
            Add Your First Asset
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onClick={() => navigate(`/assets/${asset.id}`)}
              onEdit={() => handleEdit(asset.id)}
              onDelete={() => handleDelete(asset.id, asset.name)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-slate-200 animate-slide-up">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Asset Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Value</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Zakatable</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {assets.map((asset) => {
                  const isEligible = asset.zakatEligible !== false;
                  const modifier = isEligible ? ((asset as any)?.calculationModifier || 1.0) : 0;
                  const zakatableAmount = asset.value * modifier;

                  return (
                    <tr
                      key={asset.id}
                      onClick={() => navigate(`/assets/${asset.id}`)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-slate-900">{asset.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 uppercase tracking-wide">
                          {asset.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                        {formatCurrency(asset.value, asset.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                        {formatCurrency(zakatableAmount, asset.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(asset.id); }}
                          className="text-indigo-600 hover:text-indigo-900 mr-4 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(asset.id, asset.name); }}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
