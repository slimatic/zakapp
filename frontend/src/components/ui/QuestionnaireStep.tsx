import React from 'react';
import { ArrowLeft, ArrowRight, Check, HelpCircle } from 'lucide-react';
import { AssetQuestionnaireData, QuestionnaireStep } from '../../store';
import AssetCategorySelector from './AssetCategorySelector';
import AssetDetailsCollector from './AssetDetailsCollector';
import { AssetCategoryType, ASSET_CATEGORIES } from '@zakapp/shared';

interface QuestionnaireStepProps {
  step: QuestionnaireStep;
  stepIndex: number;
  totalSteps: number;
  assetData: AssetQuestionnaireData;
  errors: Record<string, string>;
  onDataChange: (data: Partial<AssetQuestionnaireData>) => void;
  onClearError: (field: string) => void;
  onShowHelp: (category?: AssetCategoryType, field?: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onComplete: () => void;
  canProceed: boolean;
}

export const QuestionnaireStepComponent: React.FC<QuestionnaireStepProps> = ({
  step,
  stepIndex,
  totalSteps,
  assetData,
  errors,
  onDataChange,
  onClearError,
  onShowHelp,
  onNext,
  onPrevious,
  onComplete,
  canProceed,
}) => {
  const renderStepContent = () => {
    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-8">
              <span className="text-3xl">🏦</span>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-4">
                Add Your Asset
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
                Welcome to the asset questionnaire! We&apos;ll guide you through adding your asset 
                information step by step to ensure accurate Zakat calculation.
              </p>
            </div>

            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-primary-900 mb-3">What you&apos;ll need:</h3>
              <ul className="text-left space-y-2 text-primary-800">
                <li className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-primary-600" />
                  <span>Current market value of your asset</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-primary-600" />
                  <span>Specific details about the asset type</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-5 h-5 text-primary-600" />
                  <span>Understanding of Zakat eligibility</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-center space-x-2 text-sm text-neutral-600">
              <HelpCircle className="w-4 h-4" />
              <button
                onClick={() => onShowHelp()}
                className="text-primary-600 hover:text-primary-700 transition-colors"
              >
                Need help? Click here for guidance
              </button>
            </div>
          </div>
        );

      case 'category':
        return (
          <AssetCategorySelector
            selectedCategory={assetData.category}
            onCategorySelect={(category) => onDataChange({ category })}
            onShowHelp={(category) => onShowHelp(category)}
            error={errors.category}
          />
        );

      case 'details': {
        if (!assetData.category) {
          return (
            <div className="text-center text-neutral-500">
              <p>Please select a category first.</p>
            </div>
          );
        }
        return (
          <AssetDetailsCollector
            category={assetData.category}
            assetData={assetData}
            onDataChange={onDataChange}
            onShowHelp={(field) => onShowHelp(assetData.category, field)}
            errors={errors}
            onClearError={onClearError}
          />
        );
      }

      case 'review': {
        const categoryData = assetData.category 
          ? Object.values(ASSET_CATEGORIES).find(cat => cat.id === assetData.category)
          : null;
        
        const subCategoryData = categoryData && assetData.subCategory
          ? categoryData.subCategories.find(sub => sub.id === assetData.subCategory)
          : null;

        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                Review Your Asset
              </h2>
              <p className="text-neutral-600">
                Please review your asset information before saving. You can go back to make changes if needed.
              </p>
            </div>

            <div className="max-w-2xl mx-auto bg-white border border-neutral-200 rounded-xl p-6 space-y-6">
              {/* Asset Summary */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">
                    {assetData.category === 'cash' ? '💰' :
                     assetData.category === 'gold' ? '🪙' :
                     assetData.category === 'silver' ? '🥈' :
                     assetData.category === 'business' ? '🏢' :
                     assetData.category === 'property' ? '🏠' :
                     assetData.category === 'stocks' ? '📈' :
                     assetData.category === 'crypto' ? '₿' :
                     assetData.category === 'debts' ? '📋' : '📊'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-neutral-900">
                    {assetData.name}
                  </h3>
                  <p className="text-neutral-600">
                    {categoryData?.name} • {subCategoryData?.name}
                  </p>
                </div>
              </div>

              {/* Asset Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-neutral-900 mb-3">Financial Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Value:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: assetData.currency,
                        }).format(assetData.value)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Currency:</span>
                      <span className="font-medium">{assetData.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Zakat Eligible:</span>
                      <span className={`font-medium ${
                        assetData.zakatEligible ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {assetData.zakatEligible ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-neutral-900 mb-3">Zakat Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Rate:</span>
                      <span className="font-medium">{categoryData?.zakatRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Nisab Applicable:</span>
                      <span className="font-medium">
                        {categoryData?.nisabApplicable ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {assetData.zakatEligible && (
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Est. Zakat:</span>
                        <span className="font-medium text-primary-600">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: assetData.currency,
                          }).format(assetData.value * (categoryData?.zakatRate || 2.5) / 100)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {assetData.description && (
                <div>
                  <h4 className="font-medium text-neutral-900 mb-2">Description</h4>
                  <p className="text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                    {assetData.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      }

      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-neutral-200">
        <button
          onClick={onPrevious}
          disabled={stepIndex === 0}
          className={`
            flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors
            ${stepIndex === 0
              ? 'text-neutral-400 cursor-not-allowed'
              : 'text-neutral-700 hover:bg-neutral-100'
            }
          `}
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>

        <div className="text-sm text-neutral-500">
          Step {stepIndex + 1} of {totalSteps}
        </div>

        {stepIndex === totalSteps - 1 ? (
          <button
            onClick={onComplete}
            disabled={!canProceed}
            className={`
              flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors
              ${canProceed
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
              }
            `}
          >
            <Check className="w-5 h-5" />
            <span>Complete</span>
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!canProceed}
            className={`
              flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors
              ${canProceed
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
              }
            `}
          >
            <span>Next</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default QuestionnaireStepComponent;