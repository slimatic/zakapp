import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAsset, useDeleteAsset } from '../../services/apiHooks';
import { Asset } from '../../../../shared/src/types';
import { Button, LoadingSpinner, ErrorMessage } from '../ui';

/**
 * AssetDetails component for displaying comprehensive asset information
 */
export const AssetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: assetData, isLoading, error, refetch } = useAsset(id!);
  const deleteMutation = useDeleteAsset();

  const asset: Asset | null = assetData?.asset || null;

  const handleDelete = () => {
    if (!asset) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${asset.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      deleteMutation.mutate(asset.assetId, {
        onSuccess: () => {
          navigate('/assets');
        },
        onError: (error: any) => {
          console.error('Failed to delete asset:', error);
          alert('Failed to delete asset. Please try again.');
        }
      });
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      cash: '💰',
      gold: '🥇',
      silver: '🥈',
      business: '🏢',
      property: '🏠',
      stocks: '📈',
      crypto: '₿',
      debts: '📝',
      expenses: '💳'
    };
    return icons[category] || '📊';
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      cash: 'Cash & Savings',
      gold: 'Gold',
      silver: 'Silver',
      business: 'Business Assets',
      property: 'Property',
      stocks: 'Stocks & Investments',
      crypto: 'Cryptocurrency',
      debts: 'Debts Owed to You',
      expenses: 'Expenses'
    };
    return labels[category] || category;
  };

  const getSubCategoryLabel = (subCategory: string) => {
    return subCategory
      ? subCategory.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      : '';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ErrorMessage 
          error={error} 
          onRetry={refetch}
          className="mb-6"
        />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Asset Not Found</h3>
          <p className="text-gray-600 mb-6">
            The asset you're looking for doesn't exist or may have been deleted.
          </p>
          <Link to="/assets">
            <Button variant="primary">
              Back to Assets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center space-x-4">
          <div className="text-4xl">
            {getCategoryIcon(asset.category)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
            <p className="text-lg text-gray-600">
              {getCategoryLabel(asset.category)}
              {asset.subCategory && (
                <span> • {getSubCategoryLabel(asset.subCategory)}</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Link to={`/assets/${asset.assetId}/edit`}>
            <Button variant="secondary">
              Edit Asset
            </Button>
          </Link>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={deleteMutation.isPending}
            disabled={deleteMutation.isPending}
          >
            Delete Asset
          </Button>
        </div>
      </div>

      {/* Asset Details Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Value */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Value</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(asset.value, asset.currency)}
          </p>
          <p className="text-sm text-gray-500 mt-1">{asset.currency}</p>
        </div>

        {/* Zakat Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Zakat Status</h3>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            asset.zakatEligible 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {asset.zakatEligible ? '✓ Zakat Eligible' : '✗ Not Eligible'}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {asset.zakatEligible 
              ? 'This asset will be included in Zakat calculations'
              : 'This asset will be excluded from Zakat calculations'
            }
          </p>
        </div>

        {/* Asset Age */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Asset Age</h3>
          <p className="text-2xl font-bold text-blue-600">
            {Math.floor(
              (new Date().getTime() - new Date(asset.createdAt).getTime()) / 
              (1000 * 60 * 60 * 24)
            )} days
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Added on {formatDate(asset.createdAt)}
          </p>
        </div>
      </div>

      {/* Asset Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Asset Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              Basic Details
            </h4>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-900">Name</dt>
                <dd className="text-sm text-gray-700">{asset.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-900">Category</dt>
                <dd className="text-sm text-gray-700">{getCategoryLabel(asset.category)}</dd>
              </div>
              {asset.subCategory && (
                <div>
                  <dt className="text-sm font-medium text-gray-900">Sub-Category</dt>
                  <dd className="text-sm text-gray-700">{getSubCategoryLabel(asset.subCategory)}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-900">Value</dt>
                <dd className="text-sm text-gray-700">
                  {formatCurrency(asset.value, asset.currency)}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              Timestamps
            </h4>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-900">Created</dt>
                <dd className="text-sm text-gray-700">{formatDate(asset.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-900">Last Updated</dt>
                <dd className="text-sm text-gray-700">{formatDate(asset.updatedAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-900">Asset ID</dt>
                <dd className="text-sm text-gray-700 font-mono">{asset.assetId}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Description */}
        {asset.description && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              Description
            </h4>
            <p className="text-sm text-gray-700 leading-6">{asset.description}</p>
          </div>
        )}
      </div>

      {/* Zakat Calculation Info */}
      {asset.zakatEligible && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-6 mb-6">
          <h3 className="text-xl font-semibold text-green-900 mb-4">
            Zakat Calculation Information
          </h3>
          <div className="space-y-3">
            <p className="text-sm text-green-800">
              <span className="font-medium">Zakatable Value:</span> {formatCurrency(asset.value, asset.currency)}
            </p>
            <p className="text-sm text-green-800">
              <span className="font-medium">Estimated Zakat (2.5%):</span> {formatCurrency(asset.value * 0.025, asset.currency)}
            </p>
            <p className="text-xs text-green-600">
              * This is an estimate. Actual Zakat calculation depends on your total wealth, 
              nisab threshold, and chosen calculation methodology.
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Link to="/assets">
          <Button variant="secondary">
            ← Back to Assets
          </Button>
        </Link>
        
        <div className="flex space-x-3">
          <Link to={`/calculate?includeAsset=${asset.assetId}`}>
            <Button variant="primary">
              Calculate Zakat
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};