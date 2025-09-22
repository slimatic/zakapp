import React, { useState, useEffect } from 'react';
import { Asset, AssetCategoryType, ASSET_CATEGORIES, AssetFormData } from '@zakapp/shared';
import { AssetForm } from './AssetForm';
import { AssetList } from './AssetList';
import { AssetCategoryView } from './AssetCategoryView';
import { AssetQuestionnaire } from './AssetQuestionnaire';
import { Plus, Search, Filter, List, PieChart, HelpCircle } from 'lucide-react';
import { useUserAssets } from '../../hooks';

interface AssetManagementProps {
  // These would be connected to your API/state management
  assets?: Asset[]; // Optional - if not provided, will fetch from API
  onCreateAsset?: (assetData: AssetFormData) => Promise<void>;
  onUpdateAsset?: (assetId: string, assetData: AssetFormData) => Promise<void>;
  onDeleteAsset?: (assetId: string) => Promise<void>;
}

// Mock data for demonstration - in real app this would come from API
const mockAssets: Asset[] = [
  {
    assetId: '1',
    name: 'Primary Savings Account',
    category: 'cash',
    subCategory: 'savings',
    value: 25000,
    currency: 'USD',
    description: 'Main savings account for emergency fund',
    zakatEligible: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    assetId: '2', 
    name: 'Gold Jewelry Collection',
    category: 'gold',
    subCategory: 'jewelry',
    value: 12000,
    currency: 'USD',
    description: 'Family gold jewelry collection',
    zakatEligible: true,
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z',
  },
  {
    assetId: '3',
    name: 'Bitcoin Investment',
    category: 'crypto',
    subCategory: 'bitcoin',
    value: 8500,
    currency: 'USD',
    zakatEligible: true,
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z',
  },
  {
    assetId: '4',
    name: 'Checking Account',
    category: 'cash',
    subCategory: 'checking',
    value: 3500,
    currency: 'USD',
    description: 'Daily transactions account',
    zakatEligible: true,
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-01-12T10:00:00Z',
  },
  {
    assetId: '5',
    name: 'Apple Stock',
    category: 'stocks',
    subCategory: 'individual_stocks',
    value: 15000,
    currency: 'USD',
    description: 'AAPL shares investment',
    zakatEligible: true,
    createdAt: '2024-01-08T10:00:00Z',
    updatedAt: '2024-01-08T10:00:00Z',
  },
  {
    assetId: '6',
    name: 'Silver Coins',
    category: 'silver',
    subCategory: 'coins',
    value: 2800,
    currency: 'USD',
    description: 'Silver eagle coins collection',
    zakatEligible: true,
    createdAt: '2024-01-03T10:00:00Z',
    updatedAt: '2024-01-03T10:00:00Z',
  },
  {
    assetId: '7',
    name: 'Business Inventory',
    category: 'business',
    subCategory: 'inventory',
    value: 45000,
    currency: 'USD',
    description: 'Restaurant kitchen equipment and supplies',
    zakatEligible: true,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z',
  }
];

export const AssetManagement: React.FC<AssetManagementProps> = ({
  assets: propsAssets,
  onCreateAsset,
  onUpdateAsset,
  onDeleteAsset,
}) => {
  const { data: fetchedAssets } = useUserAssets();
  const [assets, setAssets] = useState<Asset[]>(propsAssets || mockAssets);
  const [showForm, setShowForm] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<AssetCategoryType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'categories'>('list');

  // Use fetched assets if no props assets provided
  useEffect(() => {
    if (!propsAssets && fetchedAssets) {
      setAssets(fetchedAssets);
    }
  }, [fetchedAssets, propsAssets]);

  // Filter assets based on search and category
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || asset.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate statistics
  const zakatEligibleValue = assets
    .filter(asset => asset.zakatEligible)
    .reduce((sum, asset) => sum + asset.value, 0);

  const handleCreateAsset = async (assetData: AssetFormData) => {
    setIsLoading(true);
    try {
      if (onCreateAsset) {
        await onCreateAsset(assetData);
      } else {
        // Mock implementation
        const newAsset: Asset = {
          assetId: Date.now().toString(),
          ...assetData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setAssets(prev => [...prev, newAsset]);
      }
      setShowForm(false);
    } catch (error) {
      console.error('Error creating asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAsset = async (assetData: AssetFormData) => {
    if (!editingAsset) return;
    
    setIsLoading(true);
    try {
      if (onUpdateAsset) {
        await onUpdateAsset(editingAsset.assetId, assetData);
      } else {
        // Mock implementation
        setAssets(prev => prev.map(asset => 
          asset.assetId === editingAsset.assetId 
            ? { ...asset, ...assetData, updatedAt: new Date().toISOString() }
            : asset
        ));
      }
      setEditingAsset(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error updating asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      if (onDeleteAsset) {
        await onDeleteAsset(assetId);
      } else {
        // Mock implementation
        setAssets(prev => prev.filter(asset => asset.assetId !== assetId));
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingAsset(null);
  };

  const handleQuestionnaireAssetCreated = (asset: Asset) => {
    setAssets(prev => [...prev, asset]);
    setShowQuestionnaire(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <AssetForm
          asset={editingAsset || undefined}
          onSubmit={editingAsset ? handleUpdateAsset : handleCreateAsset}
          onCancel={handleCancelForm}
          isLoading={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Asset Management</h1>
            <p className="text-neutral-600">
              Track and manage your assets for accurate Zakat calculations
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-neutral-900">{assets.length}</div>
              <div className="text-sm text-neutral-600">Total Assets</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(zakatEligibleValue)}</div>
              <div className="text-sm text-neutral-600">Zakat Eligible</div>
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs and Controls */}
      <div className="flex flex-col gap-4">
        {/* View Mode Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <List className="w-4 h-4" />
              List View
            </button>
            <button
              onClick={() => setViewMode('categories')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                viewMode === 'categories'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <PieChart className="w-4 h-4" />
              By Category
            </button>
          </div>

          {/* Add Asset Button Group */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQuestionnaire(true)}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              Guided Setup
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 border border-primary-600 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Quick Add
            </button>
          </div>
        </div>

        {/* Controls (only show for list view) */}
        {viewMode === 'list' && (
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as AssetCategoryType | 'all')}
                className="pl-10 pr-8 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="all">All Categories</option>
                {Object.values(ASSET_CATEGORIES).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Asset Display */}
      {viewMode === 'list' ? (
        <AssetList
          assets={filteredAssets}
          onEdit={handleEditAsset}
          onDelete={handleDeleteAsset}
          isLoading={isLoading}
        />
      ) : (
        <AssetCategoryView
          assets={assets}
          onEditAsset={handleEditAsset}
          onDeleteAsset={handleDeleteAsset}
        />
      )}

      {/* Asset Questionnaire */}
      <AssetQuestionnaire
        isOpen={showQuestionnaire}
        onClose={() => setShowQuestionnaire(false)}
        onAssetCreated={handleQuestionnaireAssetCreated}
      />
    </div>
  );
};