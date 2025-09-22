import React, { useState } from 'react';
import { Asset, ASSET_CATEGORIES } from '@zakapp/shared';
import { ChevronDown, ChevronRight, DollarSign, TrendingUp, PieChart } from 'lucide-react';

interface AssetCategoryViewProps {
  assets: Asset[];
  onEditAsset?: (asset: Asset) => void;
  onDeleteAsset?: (assetId: string) => void;
}

interface CategorySummary {
  categoryId: string;
  categoryName: string;
  totalValue: number;
  assetCount: number;
  zakatEligibleValue: number;
  assets: Asset[];
}

export const AssetCategoryView: React.FC<AssetCategoryViewProps> = ({
  assets,
  onEditAsset,
  onDeleteAsset,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Group assets by category
  const categoryGroups: CategorySummary[] = Object.values(ASSET_CATEGORIES).map(categoryInfo => {
    const categoryAssets = assets.filter(asset => asset.category === categoryInfo.id);
    const totalValue = categoryAssets.reduce((sum, asset) => sum + asset.value, 0);
    const zakatEligibleValue = categoryAssets
      .filter(asset => asset.zakatEligible)
      .reduce((sum, asset) => sum + asset.value, 0);

    return {
      categoryId: categoryInfo.id,
      categoryName: categoryInfo.name,
      totalValue,
      assetCount: categoryAssets.length,
      zakatEligibleValue,
      assets: categoryAssets,
    };
  }).filter(group => group.assetCount > 0);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const totalPortfolioValue = categoryGroups.reduce((sum, group) => sum + group.totalValue, 0);
  const totalZakatEligible = categoryGroups.reduce((sum, group) => sum + group.zakatEligibleValue, 0);

  if (categoryGroups.length === 0) {
    return (
      <div className="text-center py-12">
        <PieChart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">No assets to categorize</h3>
        <p className="text-neutral-600">
          Add some assets to see them organized by category here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Portfolio by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-5 h-5 text-primary-600" />
              <span className="text-sm font-medium text-neutral-600">Total Portfolio</span>
            </div>
            <div className="text-2xl font-bold text-neutral-900">
              {formatCurrency(totalPortfolioValue)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-neutral-600">Zakat Eligible</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalZakatEligible)}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-neutral-600">Categories</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {categoryGroups.length}
            </div>
          </div>
        </div>
      </div>

      {/* Category Groups */}
      <div className="space-y-4">
        {categoryGroups.map((group) => {
          const isExpanded = expandedCategories.has(group.categoryId);
          const categoryInfo = ASSET_CATEGORIES[group.categoryId.toUpperCase() as keyof typeof ASSET_CATEGORIES];
          const percentage = totalPortfolioValue > 0 ? (group.totalValue / totalPortfolioValue) * 100 : 0;

          return (
            <div key={group.categoryId} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
              {/* Category Header */}
              <div
                className="p-6 cursor-pointer hover:bg-neutral-50 transition-colors"
                onClick={() => toggleCategory(group.categoryId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-neutral-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-neutral-400" />
                      )}
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {group.categoryName}
                      </h3>
                    </div>
                    <span className="text-sm text-neutral-500">
                      {group.assetCount} asset{group.assetCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-neutral-900">
                        {formatCurrency(group.totalValue)}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {percentage.toFixed(1)}% of portfolio
                      </div>
                    </div>
                    {group.zakatEligibleValue > 0 && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(group.zakatEligibleValue)}
                        </div>
                        <div className="text-xs text-green-500">Zakat eligible</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Description */}
                {categoryInfo && (
                  <p className="text-sm text-neutral-600 mt-2">
                    {categoryInfo.description}
                  </p>
                )}

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Assets in Category */}
              {isExpanded && (
                <div className="border-t border-neutral-200">
                  <div className="p-4 space-y-3">
                    {group.assets.map((asset) => (
                      <div
                        key={asset.assetId}
                        className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h4 className="font-medium text-neutral-900">{asset.name}</h4>
                            {asset.zakatEligible && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Zakat Eligible
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-neutral-600">
                            <span>{asset.subCategory}</span>
                            <span>•</span>
                            <span>Added {formatDate(asset.createdAt)}</span>
                          </div>
                          {asset.description && (
                            <p className="text-sm text-neutral-500 mt-1 line-clamp-1">
                              {asset.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-lg font-semibold text-neutral-900">
                              {formatCurrency(asset.value, asset.currency)}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {onEditAsset && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditAsset(asset);
                                }}
                                className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                title="Edit asset"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            )}
                            {onDeleteAsset && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteAsset(asset.assetId);
                                }}
                                className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete asset"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};