import React from 'react';
import { Asset, ASSET_CATEGORIES } from '@zakapp/shared';
import { Edit, Trash2, DollarSign, Calendar } from 'lucide-react';

interface AssetListProps {
  assets: Asset[];
  onEdit: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
  onViewDetails?: (asset: Asset) => void;
  isLoading?: boolean;
}

export const AssetList: React.FC<AssetListProps> = ({
  assets,
  onEdit,
  onDelete,
  onViewDetails,
  isLoading = false,
}) => {
  const formatCurrency = (amount: number, currency: string) => {
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

  const getCategoryInfo = (categoryId: string) => {
    return Object.values(ASSET_CATEGORIES).find(cat => cat.id === categoryId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-neutral-200 p-6 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-neutral-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-neutral-200 rounded w-1/6"></div>
              </div>
              <div className="h-6 bg-neutral-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
        <DollarSign className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">
          No assets yet
        </h3>
        <p className="text-neutral-600 mb-6 max-w-sm mx-auto">
          Start building your asset portfolio by adding your first asset. This
          will help you track your Zakat obligations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assets.map(asset => {
        const categoryInfo = getCategoryInfo(asset.category);
        return (
          <div
            key={asset.assetId}
            className="bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-neutral-900 truncate">
                      {asset.name}
                    </h3>
                    {asset.zakatEligible && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Zakat Eligible
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 mb-3">
                    <span className="flex items-center gap-1">
                      <span className="font-medium">
                        {categoryInfo?.name || asset.category}
                      </span>
                      <span>•</span>
                      <span>{asset.subCategory}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Added {formatDate(asset.createdAt)}
                    </span>
                  </div>

                  {asset.description && (
                    <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
                      {asset.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-neutral-900">
                      {formatCurrency(asset.value, asset.currency)}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(asset)}
                        className="p-2 text-neutral-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit asset"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(asset.assetId)}
                        className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {onViewDetails && (
              <div className="px-6 pb-4">
                <button
                  onClick={() => onViewDetails(asset)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Details →
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
