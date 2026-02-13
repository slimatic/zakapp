/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Decimal } from 'decimal.js';
import { useAssetRepository } from '../../hooks/useAssetRepository';
import { useAuth } from '../../contexts/AuthContext';
import { METHODOLOGIES, MethodologyName } from '../../core/calculations/methodology';
import type { Asset, AssetType } from '../../types';
import type { RetirementConfig } from '../../types/asset.types';
import { Button, Input } from '../ui';
import { EncryptedBadge } from '../ui/EncryptedBadge';
import {
  shouldShowPassiveCheckbox,
  shouldShowRestrictedCheckbox,
  getPassiveInvestmentGuidance,
  getRestrictedAccountGuidance,
  getPropertyGuidance,
  getModifierBadge
} from '../../utils/assetModifiers';
import { RetirementTreatmentSection } from './form-sections/RetirementTreatmentSection';
import { PassiveInvestmentSection } from './form-sections/PassiveInvestmentSection';
import { RestrictedAccountSection } from './form-sections/RestrictedAccountSection';
import { JewelryGuidance } from './form-sections/JewelryGuidance';

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
  const { user } = useAuth();
  const currentMethodologyName = (user?.settings?.preferredMethodology || 'STANDARD').toUpperCase() as MethodologyName;
  const currentMethodologyConfig = METHODOLOGIES[currentMethodologyName] || METHODOLOGIES.STANDARD;
  const isJewelryExemptMethodology = currentMethodologyConfig.jewelryExempt || false;

  // Helpers for category mapping
  const getInitialCategory = (assetType?: string): string => {
    if (!assetType) return 'cash';

    // Map backend UPPERCASE types to frontend lowercase values
    const map: Record<string, string> = {
      'CASH': 'cash',
      'BANK_ACCOUNT': 'cash',
      'GOLD': 'gold',
      'SILVER': 'silver',
      'BUSINESS_ASSETS': 'business',
      'REAL_ESTATE': 'property',
      'INVESTMENT_ACCOUNT': 'stocks',
      'RETIREMENT': 'stocks',
      'CRYPTOCURRENCY': 'crypto',
      'DEBTS_OWED_TO_YOU': 'debts',
      'OTHER': 'expenses'
    };

    return map[assetType] || 'cash';
  };

  const [formData, setFormData] = useState({
    name: asset?.name || '',
    category: getInitialCategory(asset?.type as unknown as string),
    subCategory: asset?.subCategory || (asset as any)?.subtype || '',
    value: asset?.value ? new Decimal(asset.value).toFixed(2) : '', // Store as string for input stability
    currency: asset?.currency || user?.settings?.currency || 'USD',
    acquisitionDate: asset?.acquisitionDate ? new Date(asset.acquisitionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    description: asset?.description || '',
    zakatEligible: asset?.zakatEligible ?? true,
    isPassiveInvestment: (asset as any)?.isPassiveInvestment || false,
    isRestrictedAccount: (asset as any)?.isRestrictedAccount || false,
    isEligibilityManual: (asset as any)?.isEligibilityManual || false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculationModifier, setCalculationModifier] = useState<number>(
    (asset as any)?.calculationModifier || 1.0
  );
  const [retirementConfig, setRetirementConfig] = useState<RetirementConfig | undefined>(() => {
    // Parse initial retirement config from asset metadata
    if (!asset?.metadata) return undefined;
    try {
      const meta = typeof asset.metadata === 'string' ? JSON.parse(asset.metadata) : asset.metadata;
      return meta.retirementConfig;
    } catch {
      return undefined;
    }
  });

  const { addAsset, updateAsset } = useAssetRepository();

  const isEditing = !!asset;

  // Smart toggle/guidance for Jewelry Exemption
  useEffect(() => {
    // Check if we should auto-exempt jewelry for new assets or non-overridden assets
    if (
      !formData.isEligibilityManual && // Only if NOT manually overridden
      formData.subCategory === 'jewelry' &&
      isJewelryExemptMethodology
    ) {
      // If currently true, set to false
      if (formData.zakatEligible === true) {
        setFormData(prev => ({ ...prev, zakatEligible: false }));
        toast.success(`Jewelry set to Exempt based on ${currentMethodologyConfig.name} rules`);
      }
    }
  }, [formData.subCategory, isJewelryExemptMethodology, formData.isEligibilityManual, currentMethodologyConfig.name, formData.zakatEligible]);

  // Recalculate modifier when flags change
  useEffect(() => {
    const propertyExempt = ['personal_residence', 'rental_property', 'vacant_land'];
    const isRetirement = formData.category === 'stocks' && formData.subCategory?.startsWith('retirement');

    let newModifier = 1.0;

    if (isRetirement && retirementConfig) {
      // Use the methodology from retirementConfig to determine modifier
      switch (retirementConfig.methodology) {
        case 'preserved_growth': newModifier = 0.20; break; // 0.5% is equivalent to 2.5% on 20%
        case 'collectible_value': {
          // Calculate net factor: 1 - penalty - tax
          const penalty = retirementConfig.withdrawalPenalty || 0;
          const tax = retirementConfig.estimatedTaxRate || 0;
          newModifier = Math.max(0, 1 - penalty - tax);
          break;
        }
        case 'manual': default: newModifier = 1.0; break;
      }
    } else if (formData.isRestrictedAccount) {
      newModifier = 0.0;
    } else if (formData.isPassiveInvestment) {
      newModifier = 0.3;
    } else if (formData.category === 'property' && propertyExempt.includes(formData.subCategory)) {
      newModifier = 0.0;
    }

    setCalculationModifier(newModifier);

    // Clear passive flag if category changes to ineligible type OR if it's a retirement subcategory
    const isRetirementSubCategory = formData.subCategory?.startsWith('retirement');
    if (!PASSIVE_INVESTMENT_TYPES.includes(formData.category as any) || isRetirementSubCategory) {
      setFormData(prev => ({ ...prev, isPassiveInvestment: false }));
    }

    // Clear restricted flag if category changes to ineligible type
    if (!RESTRICTED_ACCOUNT_TYPES.includes(formData.category as any)) {
      setFormData(prev => ({ ...prev, isRestrictedAccount: false }));
    }
  }, [formData.category, formData.subCategory, formData.isRestrictedAccount, formData.isPassiveInvestment, retirementConfig]);

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Asset name is required';
    }

    // Validate value allows strings but checks number validity
    if (!formData.value || isNaN(parseFloat(formData.value.toString())) || parseFloat(formData.value.toString()) <= 0) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Use Decimal for precise financial handling
      const numericValue = new Decimal(formData.value || 0).toDecimalPlaces(2).toNumber();

      // Map UI category values to backend canonical categories
      const CATEGORY_SEND_MAP: Record<string, string> = {
        cash: 'CASH',
        gold: 'GOLD',
        silver: 'SILVER',
        business: 'BUSINESS_ASSETS',
        property: 'REAL_ESTATE',
        stocks: 'INVESTMENT_ACCOUNT',
        crypto: 'CRYPTOCURRENCY',
        debts: 'DEBTS_OWED_TO_YOU',
        expenses: 'OTHER'
      };

      let finalType = (CATEGORY_SEND_MAP[formData.category] || 'OTHER') as AssetType;

      // Special handling: if category is 'stocks' but subCategory indicates retirement, use RETIREMENT type
      if (formData.category === 'stocks' && formData.subCategory?.startsWith('retirement')) {
        finalType = 'RETIREMENT' as AssetType;
      }

      // Special handling: if category is 'cash' but subCategoriy indicates Bank Account, use BANK_ACCOUNT type
      if (formData.category === 'cash' && ['checking', 'savings', 'money_market', 'certificates_of_deposit'].includes(formData.subCategory)) {
        finalType = 'BANK_ACCOUNT' as AssetType;
      }

      const isRetirement = finalType === 'RETIREMENT';
      let metadataObj: any = {
        isEligibilityManual: formData.isEligibilityManual
      };

      // Include retirement config if present
      if (isRetirement && retirementConfig) {
        metadataObj.retirementConfig = retirementConfig;
      }

      const commonData = {
        name: formData.name,
        type: finalType,
        subCategory: formData.subCategory || undefined,
        value: numericValue,
        currency: formData.currency,
        acquisitionDate: new Date(formData.acquisitionDate).toISOString(),
        description: formData.description,
        zakatEligible: formData.zakatEligible,
        isPassiveInvestment: formData.isPassiveInvestment,
        isRestrictedAccount: formData.isRestrictedAccount,
        calculationModifier: calculationModifier,
        // Save manual override status
        metadata: JSON.stringify(metadataObj),
        // Ensure other required fields have defaults
        country: 'US', // Default
        city: '',
      };

      if (isEditing && asset) {
        await updateAsset(asset.id!, commonData);
        onSuccess?.();
      } else {
        await addAsset(commonData);
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Asset save error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to save asset';
      toast.error(msg);
      setErrors((prev) => ({ ...prev, submit: msg }));
    } finally {
      setIsSubmitting(false);
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
      { value: 'rental_property', label: 'Rental Property (Income Generating)' },
      { value: 'property_for_resale', label: 'Property for Resale (Trade Asset)' },
      { value: 'personal_residence', label: 'Personal Residence' },
      { value: 'vacant_land', label: 'Vacant Land' },
      { value: 'commercial', label: 'Commercial Building' }
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
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="value" className="block text-sm font-medium text-gray-700">
                Value *
              </label>
              <EncryptedBadge />
            </div>
            <Input
              type="number"
              id="value"
              value={formData.value}
              onChange={(e) => handleChange('value', e.target.value)} // Keep as string for validity
              onFocus={(e) => e.target.select()}
              className={errors.value ? 'border-red-500' : ''}
              min="0"
              step="0.01"
              placeholder="0.00"
              aria-required="true"
              aria-invalid={!!errors.value}
              aria-describedby={errors.value ? 'value-error' : undefined}
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.currency ? 'border-red-500' : 'border-gray-300'
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
                // Set manual flag when user clicks
                handleChange('zakatEligible', checked);
                setFormData(prev => ({ ...prev, isEligibilityManual: true })); // Explicit override

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
            {formData.isEligibilityManual && (
              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">
                Manual Override
              </span>
            )}
          </label>
          <p id="zakat-help" className="mt-1 ml-6 text-xs text-gray-500">
            Check this if the asset should be included in Zakat calculations
          </p>

          {formData.subCategory === 'jewelry' && (
            <JewelryGuidance
              zakatEligible={formData.zakatEligible}
              isEligibilityManual={formData.isEligibilityManual}
              isJewelryExemptMethodology={isJewelryExemptMethodology}
              methodologyName={currentMethodologyConfig.name}
            />
          )}
        </div>




        {/* Modifier Section: Passive Investment (hidden for retirement since radio has this option) */}
        {shouldShowPassiveCheckbox(formData.category as string) && !formData.subCategory?.startsWith('retirement') && (
          <PassiveInvestmentSection
            isPassiveInvestment={formData.isPassiveInvestment}
            isRestrictedAccount={formData.isRestrictedAccount}
            zakatEligible={formData.zakatEligible}
            onChange={(checked) => handleChange('isPassiveInvestment', checked)}
          />
        )}


        {/* Modifier Section: Retirement Treatment (Radio Group) */}
        {formData.category === 'stocks' && formData.subCategory?.startsWith('retirement') && (
          <RetirementTreatmentSection
            retirementConfig={retirementConfig}
            value={formData.value}
            onConfigChange={setRetirementConfig}
          />
        )}


        {/* Modifier Section: Restricted Account (Legacy/Non-Retirement) */}
        {shouldShowRestrictedCheckbox(formData.category as string) && (!formData.subCategory?.startsWith('retirement')) && (
          <RestrictedAccountSection
            isRestrictedAccount={formData.isRestrictedAccount}
            onChange={(checked) => {
              handleChange('isRestrictedAccount', checked);
              if (checked) {
                handleChange('isPassiveInvestment', false);
              }
            }}
          />
        )}


        {/* Property Guidance Section */}
        {formData.category === 'property' && getPropertyGuidance(formData.subCategory) && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4">
            <div className="flex gap-2">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm text-emerald-900 font-medium">Fiqh Guidance</p>
                <p className="text-sm text-emerald-800 mt-1">
                  {getPropertyGuidance(formData.subCategory)}
                </p>
              </div>
            </div>
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
            variant="default"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isEditing ? 'Update Asset' : 'Add Asset'}
          </Button>
        </div>
      </form>
    </div>
  );
};