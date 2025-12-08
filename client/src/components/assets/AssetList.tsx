import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAssets } from '../../services/apiHooks';
import { Asset, AssetCategoryType } from '@zakapp/shared';
import { LoadingSpinner, ErrorMessage, Button } from '../ui';
import { AssetForm } from './AssetForm';
import { usePrivacy, useMaskedCurrency } from '../../contexts/PrivacyContext';

export const AssetList: React.FC = React.memo(() => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');
  
  const { data: assetsData, isLoading, error } = useAssets();
  const assets = React.useMemo(() => assetsData?.data?.assets || [], [assetsData]);
  const { privacyMode, togglePrivacyMode } = usePrivacy();
  const maskedCurrency = useMaskedCurrency();

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
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
    return maskedCurrency(formatted);
  }, [maskedCurrency]);

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
          {/* View Toggle */}
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium border ${viewMode === 'list' ? 'bg-blue-50 text-blue-700 border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} rounded-l-md focus:z-10 focus:ring-2 focus:ring-blue-500`}
              aria-label="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2 text-sm font-medium border-t border-b border-r ${viewMode === 'cards' ? 'bg-blue-50 text-blue-700 border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'} rounded-r-md focus:z-10 focus:ring-2 focus:ring-blue-500`}
              aria-label="Card view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>

          {/* Privacy Toggle */}
          <button
            type="button"
            onClick={togglePrivacyMode}
            className={`inline-flex items-center px-3 py-2 border ${privacyMode ? 'bg-indigo-50 text-indigo-700 border-indigo-600' : 'bg-white text-gray-700 border-gray-300'} rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            aria-label={privacyMode ? 'Show amounts' : 'Hide amounts'}
            title={privacyMode ? 'Show amounts' : 'Hide amounts for privacy'}
          >
            {privacyMode ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Show
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                Hide
              </>
            )}
          </button>

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
                {maskedCurrency(`$${assets.reduce((sum: number, asset: Asset) => sum + asset.value, 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Asset Display */}
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
      ) : viewMode === 'list' ? (
        /* List View - Compact Table */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.map((asset: Asset) => (
                  <tr key={asset.assetId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-xl mr-3">{getCategoryIcon(asset.category)}</span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{asset.name}</div>
                          {asset.description && (
                            <div className="text-xs text-gray-500 truncate max-w-xs">{asset.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{asset.category}</div>
                      {asset.subCategory && (
                        <div className="text-xs text-gray-500 capitalize">{asset.subCategory}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">{formatCurrency(asset.value, asset.currency)}</div>
                      <div className="text-xs text-gray-500">{asset.currency}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {asset.zakatEligible ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Eligible
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Not Eligible
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/assets/${asset.assetId}`}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => setEditingAsset(asset)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card View - Original */
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
