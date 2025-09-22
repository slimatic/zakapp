import React from 'react';
import { AssetCategoryType, ASSET_CATEGORIES } from '@zakapp/shared';
import { HelpCircle, ChevronRight } from 'lucide-react';

interface AssetCategorySelectorProps {
  selectedCategory?: AssetCategoryType;
  onCategorySelect: (category: AssetCategoryType) => void;
  onShowHelp: (category?: AssetCategoryType) => void;
  error?: string;
}

const categoryIcons: Record<AssetCategoryType, string> = {
  cash: '💰',
  gold: '🪙',
  silver: '🥈',
  business: '🏢',
  property: '🏠',
  stocks: '📈',
  crypto: '₿',
  debts: '📋',
};

export const AssetCategorySelector: React.FC<AssetCategorySelectorProps> = ({
  selectedCategory,
  onCategorySelect,
  onShowHelp,
  error,
}) => {
  const categories = Object.values(ASSET_CATEGORIES);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          What type of asset would you like to add?
        </h2>
        <p className="text-neutral-600">
          Select the category that best describes your asset. You can click the help icon for more information.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          
          return (
            <div
              key={category.id}
              className={`
                relative group border-2 rounded-xl p-6 cursor-pointer transition-all duration-200
                ${isSelected 
                  ? 'border-primary-600 bg-primary-50 shadow-lg' 
                  : 'border-neutral-200 hover:border-primary-300 hover:shadow-md'
                }
              `}
              onClick={() => onCategorySelect(category.id as AssetCategoryType)}
            >
              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Help Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowHelp(category.id as AssetCategoryType);
                }}
                className="absolute top-3 left-3 p-2 text-neutral-500 hover:text-primary-600 hover:bg-white rounded-lg transition-colors"
              >
                <HelpCircle className="w-5 h-5" />
              </button>

              <div className="flex items-start space-x-4 mt-8">
                {/* Icon */}
                <div className="text-3xl">
                  {categoryIcons[category.id as AssetCategoryType] || '📊'}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isSelected ? 'text-primary-900' : 'text-neutral-900'
                  }`}>
                    {category.name}
                  </h3>

                  {/* Description */}
                  <p className={`text-sm leading-relaxed ${
                    isSelected ? 'text-primary-700' : 'text-neutral-600'
                  }`}>
                    {category.description}
                  </p>

                  {/* Zakat Info */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs">
                      <span className={`
                        px-2 py-1 rounded-full 
                        ${category.zakatEligible 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-neutral-100 text-neutral-600'
                        }
                      `}>
                        {category.zakatEligible ? 'Zakat Eligible' : 'Check Eligibility'}
                      </span>
                      <span className="text-neutral-500">
                        Rate: {category.zakatRate}%
                      </span>
                    </div>

                    <ChevronRight className={`w-5 h-5 transition-transform ${
                      isSelected ? 'text-primary-600 transform rotate-90' : 'text-neutral-400'
                    }`} />
                  </div>

                  {/* Subcategories Preview */}
                  <div className="mt-3">
                    <p className="text-xs text-neutral-500 mb-1">
                      Includes: {category.subCategories.slice(0, 3).map(sub => sub.name).join(', ')}
                      {category.subCategories.length > 3 && `... +${category.subCategories.length - 3} more`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* General Help Button */}
      <div className="text-center">
        <button
          onClick={() => onShowHelp()}
          className="inline-flex items-center space-x-2 text-sm text-primary-600 hover:text-primary-700 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Need help choosing? Click here for guidance</span>
        </button>
      </div>
    </div>
  );
};

export default AssetCategorySelector;