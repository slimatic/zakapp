import React from 'react';
import {
  AssetCategoryType,
  ASSET_CATEGORIES,
  CURRENCIES,
} from '@zakapp/shared';
import { HelpCircle } from 'lucide-react';
import { AssetQuestionnaireData } from '../../store';

interface AssetDetailsCollectorProps {
  category: AssetCategoryType;
  assetData: AssetQuestionnaireData;
  onDataChange: (data: Partial<AssetQuestionnaireData>) => void;
  onShowHelp: (field: string) => void;
  errors: Record<string, string>;
  onClearError: (field: string) => void;
}

export const AssetDetailsCollector: React.FC<AssetDetailsCollectorProps> = ({
  category,
  assetData,
  onDataChange,
  onShowHelp,
  errors,
  onClearError,
}) => {
  const categoryData = Object.values(ASSET_CATEGORIES).find(
    cat => cat.id === category
  );

  if (!categoryData) {
    return (
      <div className="text-center text-neutral-500">
        <p>
          Invalid category selected. Please go back and select a valid category.
        </p>
      </div>
    );
  }

  const handleInputChange = (field: string, value: unknown) => {
    onDataChange({ [field]: value });
    if (errors[field]) {
      onClearError(field);
    }
  };

  const getSpecificFields = (subCategoryId?: string) => {
    if (!subCategoryId) return [];

    const subCategory = categoryData.subCategories.find(
      sub => sub.id === subCategoryId
    );
    return subCategory?.specificFields || [];
  };

  const specificFields = getSpecificFields(assetData.subCategory);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {categoryData.name} Details
        </h2>
        <p className="text-neutral-600">
          Please provide specific information about your{' '}
          {categoryData.name.toLowerCase()}.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Asset Name */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-neutral-700"
            >
              Asset Name *
            </label>
            <button
              onClick={() => onShowHelp('name')}
              className="p-1 text-neutral-500 hover:text-primary-600 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <input
            id="name"
            type="text"
            value={assetData.name}
            onChange={e => handleInputChange('name', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.name ? 'border-red-300' : 'border-neutral-300'
            }`}
            placeholder={`e.g., Primary ${categoryData.subCategories[0]?.name || 'Asset'}`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Subcategory */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="subCategory"
              className="block text-sm font-medium text-neutral-700"
            >
              Subcategory *
            </label>
            <button
              onClick={() => onShowHelp('subCategory')}
              className="p-1 text-neutral-500 hover:text-primary-600 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <select
            id="subCategory"
            value={assetData.subCategory || ''}
            onChange={e => handleInputChange('subCategory', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              errors.subCategory ? 'border-red-300' : 'border-neutral-300'
            }`}
          >
            <option value="">Select a subcategory</option>
            {categoryData.subCategories.map(subCategory => (
              <option key={subCategory.id} value={subCategory.id}>
                {subCategory.name}
              </option>
            ))}
          </select>
          {errors.subCategory && (
            <p className="mt-1 text-sm text-red-600">{errors.subCategory}</p>
          )}
          {assetData.subCategory && (
            <p className="mt-1 text-sm text-neutral-600">
              {
                categoryData.subCategories.find(
                  sub => sub.id === assetData.subCategory
                )?.description
              }
            </p>
          )}
        </div>

        {/* Value and Currency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="value"
                className="block text-sm font-medium text-neutral-700"
              >
                Current Value *
              </label>
              <button
                onClick={() => onShowHelp('value')}
                className="p-1 text-neutral-500 hover:text-primary-600 transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
            <input
              id="value"
              type="number"
              min="0"
              step="0.01"
              value={assetData.value || ''}
              onChange={e =>
                handleInputChange('value', parseFloat(e.target.value) || 0)
              }
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.value ? 'border-red-300' : 'border-neutral-300'
              }`}
              placeholder="0.00"
            />
            {errors.value && (
              <p className="mt-1 text-sm text-red-600">{errors.value}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="currency"
              className="block text-sm font-medium text-neutral-700 mb-2"
            >
              Currency
            </label>
            <select
              id="currency"
              value={assetData.currency}
              onChange={e => handleInputChange('currency', e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {CURRENCIES.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.name} ({currency.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Specific Fields based on subcategory */}
        {specificFields.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-neutral-900">
              Additional Information
            </h3>

            {specificFields.map(field => (
              <div key={field}>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {field.charAt(0).toUpperCase() +
                    field.slice(1).replace(/([A-Z])/g, ' $1')}
                </label>
                {field === 'weight' ? (
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Weight in grams"
                      className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <span className="px-3 py-3 bg-neutral-100 border border-neutral-300 rounded-lg text-sm text-neutral-600">
                      grams
                    </span>
                  </div>
                ) : field === 'purity' ? (
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="Purity percentage"
                      className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <span className="px-3 py-3 bg-neutral-100 border border-neutral-300 rounded-lg text-sm text-neutral-600">
                      %
                    </span>
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder={`Enter ${field}`}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Zakat Eligibility */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-neutral-700">
              Zakat Eligibility
            </label>
            <button
              onClick={() => onShowHelp('zakatEligible')}
              className="p-1 text-neutral-500 hover:text-primary-600 transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="zakatEligible"
                checked={assetData.zakatEligible === true}
                onChange={() => handleInputChange('zakatEligible', true)}
                className="w-4 h-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">
                Yes, this asset is subject to Zakat
              </span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name="zakatEligible"
                checked={assetData.zakatEligible === false}
                onChange={() => handleInputChange('zakatEligible', false)}
                className="w-4 h-4 text-primary-600 border-neutral-300 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-700">
                No, this asset is not subject to Zakat
              </span>
            </label>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Default for {categoryData.name}:{' '}
            {categoryData.defaultZakatEligible
              ? 'Eligible'
              : 'Check eligibility'}
          </p>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-neutral-700 mb-2"
          >
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={assetData.description || ''}
            onChange={e => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Add any additional notes or details about this asset..."
          />
        </div>
      </div>
    </div>
  );
};

export default AssetDetailsCollector;
