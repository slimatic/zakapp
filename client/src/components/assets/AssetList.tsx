import React, { useState } from 'react';
import { useAssets } from '../../services/apiHooks';
import { Asset } from '../../../../shared/src/types';

export const AssetList: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAssets();
      if (response.success && response.data) {
        setAssets(response.data);
      } else {
        setError(response.message || 'Failed to load assets');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAsset = async (assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await apiService.createAsset(assetData);
      if (response.success && response.data) {
        setAssets(prev => [...prev, response.data]);
        setShowAddModal(false);
      } else {
        setError(response.message || 'Failed to create asset');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create asset');
    }
  };

  const getAssetTypeLabel = (type: AssetType): string => {
    const labels: Record<AssetType, string> = {
      [AssetType.CASH]: 'Cash',
      [AssetType.BANK_ACCOUNT]: 'Bank Account',
      [AssetType.GOLD]: 'Gold',
      [AssetType.SILVER]: 'Silver',
      [AssetType.CRYPTOCURRENCY]: 'Cryptocurrency',
      [AssetType.BUSINESS_ASSETS]: 'Business Assets',
      [AssetType.INVESTMENT_ACCOUNT]: 'Investment Account',
      [AssetType.REAL_ESTATE]: 'Real Estate',
      [AssetType.DEBTS_OWED_TO_YOU]: 'Debts Owed to You',
      [AssetType.OTHER]: 'Other'
    };
    return labels[type] || type;
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Your Assets</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Add Asset
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {assets.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24m32 10v6c0 2.21-1.79 4-4 4H12c-2.21 0-4-1.79-4-4v-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No assets yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first asset.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Add Asset
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <div key={asset.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {asset.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {getAssetTypeLabel(asset.type)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-lg font-semibold text-green-600">
                      {formatCurrency(asset.value, asset.currency)}
                    </span>
                  </div>
                </div>
                {asset.description && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600">{asset.description}</p>
                  </div>
                )}
                <div className="mt-3 text-xs text-gray-400">
                  Added {new Date(asset.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <AddAssetModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddAsset}
        />
      )}
    </div>
  );
};

interface AddAssetModalProps {
  onClose: () => void;
  onAdd: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const AddAssetModal: React.FC<AddAssetModalProps> = ({ onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: AssetType.CASH,
    value: '',
    currency: 'USD',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.value) {
      return;
    }

    const asset = {
      name: formData.name,
      type: formData.type,
      value: parseFloat(formData.value),
      currency: formData.currency,
      description: formData.description || undefined,
    };

    onAdd(asset);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Asset</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Asset Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="e.g., Savings Account"
              />
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Asset Type
              </label>
              <select
                name="type"
                id="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                {Object.values(AssetType).map((type) => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4">
              <div className="flex-1">
                <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                  Value
                </label>
                <input
                  type="number"
                  name="value"
                  id="value"
                  required
                  min="0"
                  step="0.01"
                  value={formData.value}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="0.00"
                />
              </div>
              <div className="flex-shrink-0">
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                  Currency
                </label>
                <select
                  name="currency"
                  id="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="SAR">SAR</option>
                  <option value="AED">AED</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Additional details about this asset..."
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Add Asset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};