import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Asset,
  ASSET_CATEGORIES,
  assetFormSchema,
  AssetFormData,
} from '@zakapp/shared';
import {
  FormInput,
  FormSelect,
  FormTextarea,
  FormCheckbox,
  CurrencyInput,
  DateInput,
} from '../forms';

interface AssetFormProps {
  asset?: Asset;
  onSubmit: (assetData: AssetFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const AssetForm: React.FC<AssetFormProps> = ({
  asset,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const defaultValues: AssetFormData = useMemo(() => {
    const baseAsset = asset || {};
    const extendedAsset = baseAsset as Asset & Record<string, unknown>;

    return {
      name: asset?.name || '',
      category: asset?.category || 'cash',
      subCategory: asset?.subCategory || '',
      value: asset?.value || 0,
      currency: asset?.currency || 'USD',
      description: asset?.description || '',
      zakatEligible: asset?.zakatEligible ?? true,
      // Initialize optional fields based on asset or defaults
      interestRate: extendedAsset.interestRate as number | undefined,
      maturityDate: extendedAsset.maturityDate as string | undefined,
      weight: extendedAsset.weight as number | undefined,
      purity: extendedAsset.purity as number | undefined,
      businessType: extendedAsset.businessType as string | undefined,
      holdingPeriod: extendedAsset.holdingPeriod as number | undefined,
      propertyType: extendedAsset.propertyType as string | undefined,
      location: extendedAsset.location as string | undefined,
      rentalIncome: extendedAsset.rentalIncome as number | undefined,
      ticker: extendedAsset.ticker as string | undefined,
      shares: extendedAsset.shares as number | undefined,
      dividendYield: extendedAsset.dividendYield as number | undefined,
      coinSymbol: extendedAsset.coinSymbol as string | undefined,
      quantity: extendedAsset.quantity as number | undefined,
      stakingRewards: extendedAsset.stakingRewards as number | undefined,
      debtor: extendedAsset.debtor as string | undefined,
      dueDate: extendedAsset.dueDate as string | undefined,
      repaymentSchedule: extendedAsset.repaymentSchedule as
        | 'lump_sum'
        | 'installments'
        | 'on_demand'
        | undefined,
      // Retirement account fields
      employerMatch: extendedAsset.employerMatch as number | undefined,
      vestingSchedule: extendedAsset.vestingSchedule as string | undefined,
      iraType: extendedAsset.iraType as 'traditional' | 'roth' | undefined,
      contributionLimit: extendedAsset.contributionLimit as number | undefined,
      accountType: extendedAsset.accountType as string | undefined,
    };
  }, [asset]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  const selectedCategory = watch('category');
  const selectedSubCategory = watch('subCategory');

  // Get category options
  const categoryOptions = Object.values(ASSET_CATEGORIES).map(category => ({
    value: category.id,
    label: category.name,
  }));

  // Get subcategory options based on selected category
  const subCategoryOptions = useMemo(() => {
    const category = Object.values(ASSET_CATEGORIES).find(
      cat => cat.id === selectedCategory
    );
    return (
      category?.subCategories.map(sub => ({
        value: sub.id,
        label: sub.name,
      })) || []
    );
  }, [selectedCategory]);

  const onFormSubmit = (data: AssetFormData) => {
    // Convert date strings to proper format if needed
    const formattedData = { ...data };

    // Format maturityDate if present
    if (
      formattedData.maturityDate &&
      !formattedData.maturityDate.includes('T')
    ) {
      formattedData.maturityDate = new Date(
        formattedData.maturityDate
      ).toISOString();
    }

    // Format dueDate if present
    if (formattedData.dueDate && !formattedData.dueDate.includes('T')) {
      formattedData.dueDate = new Date(formattedData.dueDate).toISOString();
    }

    onSubmit(formattedData);
  };

  // Render category-specific fields
  const renderCategorySpecificFields = () => {
    switch (selectedCategory) {
      case 'cash':
        return (
          <>
            {/* Only show interest rate for savings, CDs, and money market accounts */}
            {selectedSubCategory && 
             ['savings', 'certificates_of_deposit', 'money_market'].includes(selectedSubCategory) && (
              <FormInput
                {...register('interestRate', { 
                  valueAsNumber: true,
                  setValueAs: (value) => value === '' || isNaN(value) ? undefined : value
                })}
                label="Interest Rate (%)"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0.00"
                error={errors.interestRate}
                disabled={isLoading}
                className="md:col-span-1"
              />
            )}
            {/* Only show maturity date for CDs and money market accounts */}
            {selectedSubCategory && 
             ['certificates_of_deposit', 'money_market'].includes(selectedSubCategory) && (
              <DateInput
                {...register('maturityDate')}
                label="Maturity Date"
                error={errors.maturityDate}
                disabled={isLoading}
                className="md:col-span-1"
              />
            )}
          </>
        );

      case 'gold':
      case 'silver':
        return (
          <>
            <FormInput
              {...register('weight', { valueAsNumber: true })}
              label="Weight (grams)"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              error={errors.weight}
              disabled={isLoading}
              className="md:col-span-1"
            />
            <FormInput
              {...register('purity', { valueAsNumber: true })}
              label="Purity (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="99.9"
              error={errors.purity}
              disabled={isLoading}
              className="md:col-span-1"
            />
          </>
        );

      case 'business':
        return (
          <>
            <FormInput
              {...register('businessType')}
              label="Business Type"
              placeholder="e.g., Retail, Manufacturing"
              error={errors.businessType}
              disabled={isLoading}
              className="md:col-span-1"
            />
            <FormInput
              {...register('holdingPeriod', { valueAsNumber: true })}
              label="Holding Period (months)"
              type="number"
              min="0"
              placeholder="12"
              error={errors.holdingPeriod}
              disabled={isLoading}
              className="md:col-span-1"
            />
          </>
        );

      case 'property':
        return (
          <>
            <FormInput
              {...register('propertyType')}
              label="Property Type"
              placeholder="e.g., Apartment, House, Commercial"
              error={errors.propertyType}
              disabled={isLoading}
              className="md:col-span-1"
            />
            <FormInput
              {...register('location')}
              label="Location"
              placeholder="City, State/Province"
              error={errors.location}
              disabled={isLoading}
              className="md:col-span-1"
            />
            <FormInput
              {...register('rentalIncome', { valueAsNumber: true })}
              label="Monthly Rental Income"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              error={errors.rentalIncome}
              disabled={isLoading}
              className="md:col-span-2"
            />
          </>
        );

      case 'stocks':
        return (
          <>
            {/* Show ticker/shares/dividend for traditional investments */}
            {selectedSubCategory && 
             !['retirement_401k', 'retirement_ira', 'retirement_other'].includes(selectedSubCategory) && (
              <>
                <FormInput
                  {...register('ticker')}
                  label="Ticker Symbol"
                  placeholder="e.g., AAPL, MSFT"
                  error={errors.ticker}
                  disabled={isLoading}
                  className="md:col-span-1"
                />
                <FormInput
                  {...register('shares', { valueAsNumber: true })}
                  label="Number of Shares"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="100"
                  error={errors.shares}
                  disabled={isLoading}
                  className="md:col-span-1"
                />
                <FormInput
                  {...register('dividendYield', { valueAsNumber: true })}
                  label="Dividend Yield (%)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="2.5"
                  error={errors.dividendYield}
                  disabled={isLoading}
                  className="md:col-span-2"
                />
              </>
            )}
            
            {/* Show retirement-specific fields for 401k */}
            {selectedSubCategory === 'retirement_401k' && (
              <>
                <FormInput
                  {...register('employerMatch', { valueAsNumber: true })}
                  label="Employer Match (%)"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="50"
                  error={errors.employerMatch}
                  disabled={isLoading}
                  className="md:col-span-1"
                />
                <FormInput
                  {...register('vestingSchedule')}
                  label="Vesting Schedule"
                  placeholder="e.g., 4 year graded"
                  error={errors.vestingSchedule}
                  disabled={isLoading}
                  className="md:col-span-1"
                />
              </>
            )}
            
            {/* Show IRA-specific fields */}
            {selectedSubCategory === 'retirement_ira' && (
              <>
                <FormSelect
                  {...register('iraType')}
                  label="IRA Type"
                  options={[
                    { value: '', label: 'Select IRA Type' },
                    { value: 'traditional', label: 'Traditional IRA' },
                    { value: 'roth', label: 'Roth IRA' }
                  ]}
                  error={errors.iraType}
                  disabled={isLoading}
                  className="md:col-span-1"
                />
                <FormInput
                  {...register('contributionLimit', { valueAsNumber: true })}
                  label="Annual Contribution Limit"
                  type="number"
                  step="1"
                  min="0"
                  placeholder="6500"
                  error={errors.contributionLimit}
                  disabled={isLoading}
                  className="md:col-span-1"
                />
              </>
            )}
            
            {/* Show other retirement account fields */}
            {selectedSubCategory === 'retirement_other' && (
              <FormInput
                {...register('accountType')}
                label="Account Type"
                placeholder="e.g., 403(b), SEP-IRA, Solo 401(k)"
                error={errors.accountType}
                disabled={isLoading}
                className="md:col-span-2"
              />
            )}
          </>
        );

      case 'crypto':
        return (
          <>
            <FormInput
              {...register('coinSymbol')}
              label="Coin Symbol"
              placeholder="e.g., BTC, ETH"
              error={errors.coinSymbol}
              disabled={isLoading}
              className="md:col-span-1"
            />
            <FormInput
              {...register('quantity', { valueAsNumber: true })}
              label="Quantity"
              type="number"
              step="0.00000001"
              min="0"
              placeholder="1.0"
              error={errors.quantity}
              disabled={isLoading}
              className="md:col-span-1"
            />
            <FormInput
              {...register('stakingRewards', { valueAsNumber: true })}
              label="Annual Staking Rewards"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              error={errors.stakingRewards}
              disabled={isLoading}
              className="md:col-span-2"
            />
          </>
        );

      case 'debts':
        return (
          <>
            <FormInput
              {...register('debtor')}
              label="Debtor Name"
              placeholder="Name of person/entity who owes"
              error={errors.debtor}
              disabled={isLoading}
              className="md:col-span-2"
            />
            <DateInput
              {...register('dueDate')}
              label="Due Date"
              error={errors.dueDate}
              disabled={isLoading}
              className="md:col-span-1"
            />
            <FormInput
              {...register('interestRate', { valueAsNumber: true })}
              label="Interest Rate (%)"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="0.00"
              error={errors.interestRate}
              disabled={isLoading}
              className="md:col-span-1"
            />
            <FormSelect
              {...register('repaymentSchedule')}
              label="Repayment Schedule"
              options={[
                { value: 'lump_sum', label: 'Lump Sum' },
                { value: 'installments', label: 'Installments' },
                { value: 'on_demand', label: 'On Demand' },
              ]}
              placeholder="Select repayment schedule"
              error={errors.repaymentSchedule}
              disabled={isLoading}
              className="md:col-span-2"
            />
          </>
        );

      case 'expenses':
        return (
          <>
            {/* Common fields for all expense types */}
            {selectedSubCategory === 'debts_owed' && (
              <>
                <FormInput
                  {...register('creditor')}
                  label="Creditor Name"
                  placeholder="Name of creditor/lender"
                  error={errors.creditor}
                  disabled={isLoading}
                  className="md:col-span-1"
                />
                <FormInput
                  {...register('interestRate', { valueAsNumber: true })}
                  label="Interest Rate (%)"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="18.5"
                  error={errors.interestRate}
                  disabled={isLoading}
                  className="md:col-span-1"
                />
                <DateInput
                  {...register('dueDate')}
                  label="Due Date"
                  error={errors.dueDate}
                  disabled={isLoading}
                  className="md:col-span-2"
                />
              </>
            )}
            
            {selectedSubCategory === 'essential_needs' && (
              <>
                <FormInput
                  {...register('expenseType')}
                  label="Expense Type"
                  placeholder="e.g., Housing, Food, Clothing"
                  error={errors.expenseType}
                  disabled={isLoading}
                  className="md:col-span-1"
                />
                <FormSelect
                  {...register('frequency')}
                  label="Frequency"
                  options={[
                    { value: '', label: 'Select frequency' },
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'yearly', label: 'Yearly' },
                    { value: 'one_time', label: 'One Time' }
                  ]}
                  error={errors.frequency}
                  disabled={isLoading}
                  className="md:col-span-1"
                />
              </>
            )}
            
            {selectedSubCategory === 'family_obligations' && (
              <>
                <FormInput
                  {...register('dependentCount', { valueAsNumber: true })}
                  label="Number of Dependents"
                  type="number"
                  min="0"
                  placeholder="2"
                  error={errors.dependentCount}
                  disabled={isLoading}
                  className="md:col-span-1"
                />
                <FormInput
                  {...register('supportType')}
                  label="Support Type"
                  placeholder="e.g., Child support, Elder care"
                  error={errors.supportType}
                  disabled={isLoading}
                  className="md:col-span-1"
                />
              </>
            )}
            
            {selectedSubCategory === 'business_liabilities' && (
              <>
                <FormInput
                  {...register('businessType')}
                  label="Business Type"
                  placeholder="e.g., Retail, Consulting"
                  error={errors.businessType}
                  disabled={isLoading}
                  className="md:col-span-1"
                />
                <FormInput
                  {...register('liabilityType')}
                  label="Liability Type"
                  placeholder="e.g., Equipment loan, Trade payables"
                  error={errors.liabilityType}
                  disabled={isLoading}
                  className="md:col-span-1"
                />
              </>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {asset ? 'Edit Asset' : 'Add New Asset'}
        </h2>
        <p className="text-neutral-600">
          {asset
            ? 'Update your asset information'
            : 'Add a new asset to your portfolio'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-neutral-900 border-b border-neutral-200 pb-2">
            Basic Information
          </h3>

          <FormInput
            {...register('name')}
            label="Asset Name"
            placeholder="e.g., Savings Account, Gold Jewelry, Investment Property"
            required
            error={errors.name}
            disabled={isLoading}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              {...register('category')}
              label="Category"
              options={categoryOptions}
              required
              error={errors.category}
              disabled={isLoading}
            />

            <FormSelect
              {...register('subCategory')}
              label="Subcategory"
              options={subCategoryOptions}
              placeholder="Select a category first"
              required
              error={errors.subCategory}
              disabled={isLoading || !selectedCategory}
            />
          </div>

          <CurrencyInput
            label="Current Value"
            name="value"
            currencyFieldName="currency"
            required
            error={errors.value}
            currencyError={errors.currency}
            disabled={isLoading}
            valueRegister={register('value', { valueAsNumber: true })}
            currencyRegister={register('currency')}
          />

          <FormTextarea
            {...register('description')}
            label="Description"
            placeholder="Additional details about this asset..."
            error={errors.description}
            disabled={isLoading}
          />

          <FormCheckbox
            {...register('zakatEligible')}
            label="Subject to Zakat"
            description="Check this if this asset is subject to Zakat calculation"
            error={errors.zakatEligible}
            disabled={isLoading}
          />
        </div>

        {/* Category-Specific Fields */}
        {selectedCategory && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-neutral-900 border-b border-neutral-200 pb-2">
              Additional Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderCategorySpecificFields()}
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-neutral-200">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {asset ? 'Updating...' : 'Creating...'}
              </span>
            ) : asset ? (
              'Update Asset'
            ) : (
              'Add Asset'
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
