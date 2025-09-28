import React, { useState } from 'react';
import { useCreateAsset, useUpdateAsset } from '../../services/apiHooks';
import { Asset, AssetCategoryType } from '../../../../shared/src/types';
import { Button, Input } from '../ui';

interface AssetFormProps {
  asset?: Asset;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * AssetForm component for creating and editing assets
 */
export const AssetForm: React.FC<AssetFormProps> = ({ asset, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: asset?.name || '',
    category: asset?.category || 'cash' as AssetCategoryType,
    subCategory: asset?.subCategory || '',
    value: asset?.value || 0,
    currency: asset?.currency || 'USD',
    description: asset?.description || '',
    zakatEligible: asset?.zakatEligible ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();

  const isEditing = !!asset;
  const mutation = isEditing ? updateMutation : createMutation;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required';
    }

    if (formData.value <= 0) {
      newErrors.value = 'Asset value must be greater than 0';
    }

    if (!formData.currency.trim()) {
      newErrors.currency = 'Currency is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (isEditing && asset) {
      updateMutation.mutate({ assetId: asset.assetId, assetData: formData }, {
        onSuccess: () => {
          onSuccess?.();
        },
        onError: (error: any) => {
          console.error('Asset update error:', error);
          setErrors({ submit: 'Failed to update asset. Please try again.' });
        }
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          onSuccess?.();
        },
        onError: (error: any) => {
          console.error('Asset create error:', error);
          setErrors({ submit: 'Failed to create asset. Please try again.' });
        }
      });
    }
  };

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const categoryOptions = [
    { value: 'cash', label: 'Cash & Savings' },
    { value: 'gold', label: 'Gold' },
    { value: 'silver', label: 'Silver' },
    { value: 'business', label: 'Business Assets' },
    { value: 'property', label: 'Property' },
    { value: 'stocks', label: 'Stocks & Investments' },
    { value: 'crypto', label: 'Cryptocurrency' },
    { value: 'debts', label: 'Debts Owed to You' },
    { value: 'expenses', label: 'Expenses' }
  ];

  const subCategoryOptions: Record<string, Array<{ value: string; label: string }>> = {
    cash: [
      { value: 'savings', label: 'Savings Account' },
      { value: 'checking', label: 'Checking Account' },
      { value: 'cash_on_hand', label: 'Cash on Hand' },
      { value: 'certificates_of_deposit', label: 'Certificates of Deposit' },
      { value: 'money_market', label: 'Money Market Account' }
    ],
    gold: [
      { value: 'jewelry', label: 'Jewelry' },
      { value: 'coins', label: 'Coins' },
      { value: 'bars', label: 'Bars' },
      { value: 'ornaments', label: 'Ornaments' }
    ],
    silver: [
      { value: 'jewelry', label: 'Jewelry' },
      { value: 'coins', label: 'Coins' },
      { value: 'bars', label: 'Bars' },
      { value: 'ornaments', label: 'Ornaments' },
      { value: 'utensils', label: 'Utensils' }
    ],
    business: [
      { value: 'inventory', label: 'Inventory' },
      { value: 'trade_goods', label: 'Trade Goods' },
      { value: 'raw_materials', label: 'Raw Materials' },
      { value: 'finished_goods', label: 'Finished Goods' },
      { value: 'work_in_progress', label: 'Work in Progress' }
    ],
    property: [
      { value: 'residential_investment', label: 'Residential Investment' },
      { value: 'commercial', label: 'Commercial' },
      { value: 'land', label: 'Land' },
      { value: 'agricultural', label: 'Agricultural' },
      { value: 'industrial', label: 'Industrial' }
    ],
    stocks: [
      { value: 'individual_stocks', label: 'Individual Stocks' },
      { value: 'mutual_funds', label: 'Mutual Funds' },
      { value: 'etfs', label: 'ETFs' },
      { value: 'bonds', label: 'Bonds' },
      { value: 'index_funds', label: 'Index Funds' },
      { value: 'retirement_401k', label: 'Retirement (401k)' },
      { value: 'retirement_ira', label: 'Retirement (IRA)' },
      { value: 'retirement_other', label: 'Retirement (Other)' }
    ],
    crypto: [
      { value: 'bitcoin', label: 'Bitcoin' },
      { value: 'ethereum', label: 'Ethereum' },
      { value: 'stablecoin', label: 'Stablecoin' },
      { value: 'defi_tokens', label: 'DeFi Tokens' },
      { value: 'altcoin', label: 'Altcoin' }
    ]
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit Asset' : 'Add New Asset'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Asset Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Asset Name *
          </label>
          <Input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={errors.name ? 'border-red-500' : ''}
            placeholder="e.g., Chase Savings Account"
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => {
              handleChange('category', e.target.value);
              handleChange('subCategory', ''); // Reset subcategory when category changes
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sub-Category */}
        {subCategoryOptions[formData.category] && (
          <div>
            <label htmlFor="subCategory" className="block text-sm font-medium text-gray-700 mb-2">
              Sub-Category
            </label>
            <select
              id="subCategory"
              value={formData.subCategory}
              onChange={(e) => handleChange('subCategory', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a sub-category</option>
              {subCategoryOptions[formData.category].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Value and Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-2">
              Value *
            </label>
            <Input
              type="number"
              id="value"
              value={formData.value}
              onChange={(e) => handleChange('value', parseFloat(e.target.value) || 0)}
              className={errors.value ? 'border-red-500' : ''}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
            {errors.value && <p className="mt-1 text-sm text-red-600">{errors.value}</p>}
          </div>
          
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency *
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.currency ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="SAR">SAR - Saudi Riyal</option>
              <option value="AED">AED - UAE Dirham</option>
              <option value="PKR">PKR - Pakistani Rupee</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="MYR">MYR - Malaysian Ringgit</option>
            </select>
            {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Additional notes about this asset..."
          />
        </div>

        {/* Zakat Eligible */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.zakatEligible}
              onChange={(e) => handleChange('zakatEligible', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">
              This asset is eligible for Zakat calculation
            </span>
          </label>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            isLoading={mutation.isPending}
            disabled={mutation.isPending}
          >
            {isEditing ? 'Update Asset' : 'Add Asset'}
          </Button>
        </div>
      </form>
    </div>
  );
};