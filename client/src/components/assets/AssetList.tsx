import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { List } from 'react-window';
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
    <div className="space-y-6">
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

      {/* Summary Cards */}
      {assets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">#</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Assets</dt>
                    <dd className="text-lg font-medium text-gray-900">{assets.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold text-sm">✓</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Zakat Eligible</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {assets.filter((asset: Asset) => asset.zakatEligible).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 font-semibold text-sm">$</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(
                        assets.reduce((sum: number, asset: Asset) => sum + asset.value, 0),
                        'USD'
                      )}
                    </dd>
                  </dl>
                </div>
              </div>
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
        <div className="relative">
          <List
            height={600} // Container height
            width="100%" // Container width
            itemCount={assets.length} // Number of items
            itemSize={280} // Height of each item (approximate card height)
          >
            {({ index, style }) => {
              const asset = assets[index];
              
              // Safety check - asset might be undefined during initial render
              if (!asset) {
                return null;
              }
              
              return (
                <div style={style} className="p-3">
                  <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 hover:shadow-lg transition-shadow duration-200">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {getCategoryIcon(asset.category)}
                          </span>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {asset.name}
                            </h3>
                            <p className="text-sm text-gray-500 capitalize">
                              {asset.category} {asset.subCategory && `• ${asset.subCategory}`}
                            </p>
                          </div>
                        </div>
                        {asset.zakatEligible && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Zakat Eligible
                          </span>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-500">Value:</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatCurrency(asset.value, asset.currency)}
                          </span>
                        </div>

                        {asset.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {asset.description}
                          </p>
                        )}

                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>Added {new Date(asset.createdAt).toLocaleDateString()}</span>
                          {asset.updatedAt !== asset.createdAt && (
                            <span>Updated {new Date(asset.updatedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingAsset(asset)}
                          className="flex-1"
                        >
                          ✏️ Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          as={Link}
                          to={`/assets/${asset.assetId}`}
                          className="flex-1"
                        >
                          👁️ View
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }}
          </List>
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
