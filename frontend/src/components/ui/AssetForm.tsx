import React, { useState } from 'react';
import { Asset, AssetCategoryType, ASSET_CATEGORIES, CURRENCIES } from '@zakapp/shared';

interface AssetFormProps {
  asset?: Asset;
  onSubmit: (assetData: AssetFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface AssetFormData {
  name: string;
  category: AssetCategoryType;
  subCategory: string;
  value: number;
  currency: string;
  description?: string;
  zakatEligible: boolean;
}

export const AssetForm: React.FC<AssetFormProps> = ({
  asset,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<AssetFormData>({
    name: asset?.name || '',
    category: asset?.category || 'cash',
    subCategory: asset?.subCategory || '',
    value: asset?.value || 0,
    currency: asset?.currency || 'USD',
    description: asset?.description || '',
    zakatEligible: asset?.zakatEligible ?? true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required';
    }
    
    if (!formData.subCategory.trim()) {
      newErrors.subCategory = 'Subcategory is required';
    }
    
    if (formData.value < 0) {
      newErrors.value = 'Value must be greater than or equal to 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof AssetFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const assetCategories = Object.values(ASSET_CATEGORIES);
  const currencies = CURRENCIES;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {asset ? 'Edit Asset' : 'Add New Asset'}
        </h2>
        <p className="text-neutral-600">
          {asset ? 'Update your asset information' : 'Add a new asset to your portfolio'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Asset Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-2">
            Asset Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.name ? 'border-red-300' : 'border-neutral-300'
            }`}
            placeholder="e.g., Savings Account, Gold Jewelry, Investment Property"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Category and Subcategory Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value as AssetCategoryType)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
            >
              {assetCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="subCategory" className="block text-sm font-medium text-neutral-700 mb-2">
              Subcategory *
            </label>
            <input
              type="text"
              id="subCategory"
              value={formData.subCategory}
              onChange={(e) => handleInputChange('subCategory', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.subCategory ? 'border-red-300' : 'border-neutral-300'
              }`}
              placeholder="e.g., Checking, Savings, 24k Gold"
              disabled={isLoading}
            />
            {errors.subCategory && (
              <p className="mt-1 text-sm text-red-600">{errors.subCategory}</p>
            )}
          </div>
        </div>

        {/* Value and Currency Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="value" className="block text-sm font-medium text-neutral-700 mb-2">
              Current Value *
            </label>
            <input
              type="number"
              id="value"
              value={formData.value}
              onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
              step="0.01"
              min="0"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.value ? 'border-red-300' : 'border-neutral-300'
              }`}
              placeholder="0.00"
              disabled={isLoading}
            />
            {errors.value && (
              <p className="mt-1 text-sm text-red-600">{errors.value}</p>
            )}
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-neutral-700 mb-2">
              Currency
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isLoading}
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Additional details about this asset..."
            disabled={isLoading}
          />
        </div>

        {/* Zakat Eligible */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="zakatEligible"
              type="checkbox"
              checked={formData.zakatEligible}
              onChange={(e) => handleInputChange('zakatEligible', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              disabled={isLoading}
            />
          </div>
          <div className="ml-3">
            <label htmlFor="zakatEligible" className="text-sm font-medium text-neutral-700">
              Subject to Zakat
            </label>
            <p className="text-sm text-neutral-500">
              Check this if this asset is subject to Zakat calculation
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-neutral-200">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {asset ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              asset ? 'Update Asset' : 'Add Asset'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 bg-neutral-100 text-neutral-700 px-6 py-3 rounded-lg font-medium hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};