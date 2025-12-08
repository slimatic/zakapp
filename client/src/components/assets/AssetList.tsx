import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAssets } from '../../services/apiHooks';
import { Asset, AssetCategoryType } from '@zakapp/shared';
import { LoadingSpinner, ErrorMessage, Button } from '../ui';
import { AssetForm } from './AssetForm';

export const AssetList: React.FC = React.memo(() => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  
  const { data: assetsData, isLoading, error } = useAssets();
  const assets = React.useMemo(() => assetsData?.data?.assets || [], [assetsData]);

  const getCategoryIcon = useCallback((category: AssetCategoryType): string => {
    const icons: Record<AssetCategoryType, string> = {
      cash: '💵',
      gold: '🪙',
      silver: '🥈',
      business: '🏢',
      property: '🏠',
      stocks: '📈',
      crypto: '₿',
      debts: '📋',
      expenses: '🧾'
    };
    return icons[category] || '📦';
  }, []);

  const formatCurrency = useCallback((amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  }, []);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="space-y-6" id="main-content">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Your Assets</h1>
          <p className="text-gray-600 mt-1">
            Manage your assets for accurate Zakat calculation
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link
            to="/assets/import-export"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            📊 Import/Export
          </Link>
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
          >
            ➕ Add Asset
          </Button>
        </div>
      </div>

      {/* Summary Stats - Compact Design */}
      {assets.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 divide-x divide-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Total Assets</p>
              <p className="text-lg font-bold text-gray-900">{assets.length}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Zakat Eligible</p>
              <p className="text-lg font-bold text-green-600">
                {assets.filter((asset: Asset) => asset.zakatEligible).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Total Value</p>
              <p className="text-lg font-bold text-gray-900">
                ${assets.reduce((sum: number, asset: Asset) => sum + asset.value, 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Asset Grid */}
      {assets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assets yet</h3>
          <p className="text-gray-500 mb-6">
            Start by adding your first asset to begin calculating your Zakat
          </p>
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
          >
            ➕ Add Your First Asset
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset: Asset) => (
            <div key={asset.assetId} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="text-xl flex-shrink-0">
                      {getCategoryIcon(asset.category)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {asset.name}
                      </h3>
                      <p className="text-xs text-gray-500 capitalize truncate">
                        {asset.category} {asset.subCategory && `• ${asset.subCategory}`}
                      </p>
                    </div>
                  </div>
                  {asset.zakatEligible && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0 ml-2">
                      Eligible
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-500">Value:</span>
                    <span className="text-base font-semibold text-gray-900">
                      {formatCurrency(asset.value, asset.currency)}
                    </span>
                  </div>

                  {asset.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {asset.description}
                    </p>
                  )}

                  <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span>Added {new Date(asset.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-4 flex justify-end space-x-3 pt-3 border-t border-gray-100">
                  <Link
                    to={`/assets/${asset.assetId}`}
                    className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => setEditingAsset(asset)}
                    className="text-gray-600 hover:text-gray-900 text-xs font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowAddModal(false)}
            />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Add New Asset
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  This is a placeholder. The full AssetForm component will be integrated here.
                </p>
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Link
                    to="/assets/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go to Add Asset Page
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setEditingAsset(null)}
            />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Edit Asset: {editingAsset.name}
                </h3>
                <AssetForm
                  asset={editingAsset}
                  onSuccess={() => setEditingAsset(null)}
                  onCancel={() => setEditingAsset(null)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
