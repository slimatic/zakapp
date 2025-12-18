import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useCreateAsset, useUpdateAsset } from '../../services/apiHooks';
import type { Asset, AssetCategoryType } from '@zakapp/shared';
import { Button, Input } from '../ui';
import {
  shouldShowPassiveCheckbox,
  shouldShowRestrictedCheckbox,
  getPassiveInvestmentGuidance,
  getRestrictedAccountGuidance,
  getModifierBadge
} from '../../utils/assetModifiers';
import { PASSIVE_INVESTMENT_TYPES, RESTRICTED_ACCOUNT_TYPES } from '../../constants/sharedFallback';

interface AssetFormProps {
  asset?: Asset;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * AssetForm component for creating and editing assets with modifier support
 */
export const AssetForm: React.FC<AssetFormProps> = ({ asset, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: asset?.name || '',
    category: asset?.category || 'cash' as AssetCategoryType,
    subCategory: asset?.subCategory || '',
    value: asset?.value || 0,
    currency: asset?.currency || 'USD',
    acquisitionDate: asset?.acquisitionDate ? new Date(asset.acquisitionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    description: asset?.description || '',
    zakatEligible: asset?.zakatEligible ?? true,
    isPassiveInvestment: (asset as any)?.isPassiveInvestment || false,
    isRestrictedAccount: (asset as any)?.isRestrictedAccount || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculationModifier, setCalculationModifier] = useState<number>(
    (asset as any)?.calculationModifier || 1.0
  );

  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();

  const isEditing = !!asset;
  const mutation = isEditing ? updateMutation : createMutation;

  // Recalculate modifier when flags change
  useEffect(() => {
    const newModifier = formData.isRestrictedAccount ? 0.0 :
                       formData.isPassiveInvestment ? 0.3 : 1.0;
    setCalculationModifier(newModifier);

    // Clear passive flag if category changes to ineligible type
    if (!PASSIVE_INVESTMENT_TYPES.includes(formData.category as any)) {
      setFormData(prev => ({ ...prev, isPassiveInvestment: false }));
    }

    // Clear restricted flag if category changes to ineligible type
    if (!RESTRICTED_ACCOUNT_TYPES.includes(formData.category as any)) {
      setFormData(prev => ({ ...prev, isRestrictedAccount: false }));
    }
  }, [formData.category, formData.isRestrictedAccount, formData.isPassiveInvestment]);

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

    if (!formData.acquisitionDate) {
      newErrors.acquisitionDate = 'Acquisition date is required';
    } else {
      const acquisitionDate = new Date(formData.acquisitionDate);
      if (isNaN(acquisitionDate.getTime())) {
        newErrors.acquisitionDate = 'Invalid acquisition date';
      } else if (acquisitionDate > new Date()) {
        newErrors.acquisitionDate = 'Acquisition date cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || mutation.isPending) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    if (isEditing && asset) {
      const assetData = {
        ...formData,
        category: CATEGORY_SEND_MAP[formData.category as string] || String(formData.category).toUpperCase(),
        acquisitionDate: new Date(formData.acquisitionDate),
        notes: formData.description,
      };
      // keep zakatEligible so edits to eligibility persist
      delete (assetData as any).description;
      delete (assetData as any).subCategory;
      
      updateMutation.mutate({ assetId: asset.assetId, assetData }, {
        onSuccess: () => {
          onSuccess?.();
        },
        onError: (error: any) => {
          const msg = error instanceof Error ? error.message : 'Failed to update asset. Please try again.';
          toast.error(msg);
          setErrors({ submit: msg });
          setIsSubmitting(false);
        }
      });
    } else {
      const assetData = {
        ...formData,
        category: CATEGORY_SEND_MAP[formData.category as string] || String(formData.category).toUpperCase(),
        acquisitionDate: new Date(formData.acquisitionDate),
        notes: formData.description,
      };
      // include zakatEligible for new assets as well
      delete (assetData as any).description;
      delete (assetData as any).subCategory;
      
      createMutation.mutate(assetData, {
        onSuccess: () => {
          onSuccess?.();
        },
        onError: (error: any) => {
          const msg = error instanceof Error ? error.message : 'Failed to create asset. Please try again.';
          toast.error(msg);
          setErrors({ submit: msg });
          setIsSubmitting(false);
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

  // Map UI category values to backend canonical categories
  const CATEGORY_SEND_MAP: Record<string, string> = {
    cash: 'cash',
    gold: 'gold',
    silver: 'silver',
    business: 'business',
    property: 'property',
    stocks: 'stocks',
    crypto: 'crypto',
    debts: 'debts',
    expenses: 'expenses'
  };

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
      { value: 'retirement_other', label: 'Retirement (Other)' },
      { value: '529_education', label: '529 Education Savings' }
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
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : 'name-help'}
          />
          <p id="name-help" className="mt-1 text-xs text-gray-500">
            Enter a descriptive name for your asset
          </p>
          {errors.name && (
            <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.name}
            </p>
          )}
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
            aria-required="true"
            aria-describedby="category-help"
          >
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p id="category-help" className="mt-1 text-xs text-gray-500">
            Select the type of asset you're adding
          </p>
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
              aria-describedby="subcategory-help"
            >
              <option value="">Select a sub-category</option>
              {subCategoryOptions[formData.category].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p id="subcategory-help" className="mt-1 text-xs text-gray-500">
              Optional: Specify a more detailed classification
            </p>
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
              aria-required="true"
              aria-invalid={!!errors.value}
              aria-describedby={errors.value ? 'value-error' : undefined}
              autoSelectOnFocus={true}
            />
            {errors.value && (
              <p id="value-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.value}
              </p>
            )}
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
              aria-required="true"
              aria-invalid={!!errors.currency}
              aria-describedby={errors.currency ? 'currency-error' : 'currency-help'}
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
            <p id="currency-help" className="mt-1 text-xs text-gray-500">
              Select the currency for this asset's value
            </p>
            {errors.currency && (
              <p id="currency-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.currency}
              </p>
            )}
          </div>
        </div>

        {/* Acquisition Date */}
        <div>
          <label htmlFor="acquisitionDate" className="block text-sm font-medium text-gray-700 mb-2">
            Acquisition Date *
          </label>
          <Input
            type="date"
            id="acquisitionDate"
            value={formData.acquisitionDate}
            onChange={(e) => handleChange('acquisitionDate', e.target.value)}
            className={errors.acquisitionDate ? 'border-red-500' : ''}
            aria-required="true"
            aria-invalid={!!errors.acquisitionDate}
            aria-describedby={errors.acquisitionDate ? 'acquisitionDate-error' : 'acquisitionDate-help'}
            max={new Date().toISOString().split('T')[0]}
          />
          <p id="acquisitionDate-help" className="mt-1 text-xs text-gray-500">
            When did you acquire this asset?
          </p>
          {errors.acquisitionDate && (
            <p id="acquisitionDate-error" className="mt-1 text-sm text-red-600" role="alert">
              {errors.acquisitionDate}
            </p>
          )}
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
            aria-describedby="description-help"
          />
          <p id="description-help" className="mt-1 text-xs text-gray-500">
            Optional: Add any additional details or notes
          </p>
        </div>

        {/* Zakat Eligible */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              id="zakatEligible"
              checked={formData.zakatEligible}
              onChange={(e) => {
                const checked = e.target.checked;
                handleChange('zakatEligible', checked);
                // If eligibility is removed, also clear passive investment selection
                if (!checked) {
                  handleChange('isPassiveInvestment', false);
                }
              }}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              aria-describedby="zakat-help"
            />
            <span className="ml-2 text-sm text-gray-700">
              This asset is eligible for Zakat calculation
            </span>
          </label>
          <p id="zakat-help" className="mt-1 ml-6 text-xs text-gray-500">
            Check this if the asset should be included in Zakat calculations
          </p>
        </div>

        {/* Modifier Section: Passive Investment */}
        {shouldShowPassiveCheckbox(formData.category as string) && (
          <div className="border-l-4 border-blue-300 bg-blue-50 p-4 rounded">
            <label className="flex items-start">
              <input
                type="checkbox"
                id="isPassiveInvestment"
                checked={formData.isPassiveInvestment}
                onChange={(e) => handleChange('isPassiveInvestment', e.target.checked)}
                disabled={formData.isRestrictedAccount || !formData.zakatEligible}
                className="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-describedby="passive-help"
                aria-disabled={formData.isRestrictedAccount || !formData.zakatEligible}
              />
              <span className="ml-3">
                <span className="text-sm font-medium text-gray-700 block">
                  Passive Investment (30% Rule)
                </span>
                <span className="text-xs text-gray-600 block mt-1">
                  {getPassiveInvestmentGuidance()}
                </span>
              </span>
            </label>
            {formData.isRestrictedAccount && (
              <p className="mt-2 text-xs text-red-600 font-medium ml-6">
                ⚠️ Cannot be marked as both passive and restricted
              </p>
            )}
            {formData.isPassiveInvestment && (
              <div className="mt-2 ml-6 p-2 bg-blue-100 rounded">
                <p className="text-xs text-blue-700">
                  📊 Modifier Applied: {getModifierBadge(0.3).text}
                </p>
              </div>
            )}
            {!formData.zakatEligible && (
              <p className="mt-2 text-xs text-gray-600 ml-6">
                ⚠️ Passive investments can only be marked when the asset is eligible for Zakat
              </p>
            )}
          </div>
        )}

        {/* Modifier Section: Restricted Account */}
        {shouldShowRestrictedCheckbox(formData.category as string) && (
          <div className="border-l-4 border-gray-300 bg-gray-50 p-4 rounded">
            <label className="flex items-start">
              <input
                type="checkbox"
                id="isRestrictedAccount"
                checked={formData.isRestrictedAccount}
                onChange={(e) => {
                  handleChange('isRestrictedAccount', e.target.checked);
                  // Auto-clear passive when restricted is enabled
                  if (e.target.checked) {
                    handleChange('isPassiveInvestment', false);
                  }
                }}
                className="mt-1 rounded border-gray-300 text-gray-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                aria-describedby="restricted-help"
              />
              <span className="ml-3">
                <span className="text-sm font-medium text-gray-700 block">
                  Restricted Account (Deferred Contribution)
                </span>
                <span className="text-xs text-gray-600 block mt-1">
                  {getRestrictedAccountGuidance()}
                </span>
              </span>
            </label>
            {formData.isRestrictedAccount && (
              <div className="mt-2 ml-6 p-2 bg-gray-100 rounded">
                <p className="text-xs text-gray-700">
                  ⏸️ Modifier Applied: {getModifierBadge(0.0).text}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Calculation Modifier Display */}
        {(formData.isPassiveInvestment || formData.isRestrictedAccount) && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-gray-700 font-medium">
              Calculation Modifier: <span className="font-bold text-blue-600">{(calculationModifier * 100).toFixed(1)}%</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Your Zakat will be calculated on {calculationModifier === 1.0 ? 'the full value' : `${(calculationModifier * 100).toFixed(1)}% of`} of this asset.
            </p>
          </div>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert" aria-live="assertive">
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
            isLoading={isSubmitting || mutation.isPending}
            disabled={isSubmitting || mutation.isPending}
          >
            {isEditing ? 'Update Asset' : 'Add Asset'}
          </Button>
        </div>
      </form>
    </div>
  );
};