import React from 'react';
import { HelpCircle, X } from 'lucide-react';
import { AssetCategoryType, ASSET_CATEGORIES } from '@zakapp/shared';

interface ContextualHelpProps {
  category?: AssetCategoryType;
  field?: string;
  isVisible: boolean;
  onClose: () => void;
}

interface HelpContent {
  title: string;
  description: string;
  examples?: string[];
  tips?: string[];
}

const getHelpContent = (category?: AssetCategoryType, field?: string): HelpContent => {
  if (!category) {
    return {
      title: 'Getting Started',
      description: 'Choose the type of asset you want to add. Each category has specific fields to help ensure accurate Zakat calculation.',
      examples: [
        'Cash & Bank Accounts: Savings, checking accounts',
        'Gold & Silver: Jewelry, coins, bars',
        'Business Assets: Inventory, trade goods',
        'Property: Real estate investments',
        'Investments: Stocks, crypto, bonds',
      ],
    };
  }

  const categoryData = Object.values(ASSET_CATEGORIES).find(cat => cat.id === category);
  
  if (!categoryData) {
    return {
      title: 'Asset Information',
      description: 'Please provide accurate information about your asset for proper Zakat calculation.',
    };
  }

  // Field-specific help
  if (field) {
    switch (field) {
      case 'name':
        return {
          title: 'Asset Name',
          description: 'Give your asset a descriptive name to help you identify it later.',
          examples: [
            'Primary Savings Account',
            'Wedding Gold Jewelry',
            'Downtown Rental Property',
            'Bitcoin Investment',
          ],
          tips: ['Use clear, specific names', 'Include location if relevant'],
        };
      
      case 'value':
        return {
          title: 'Asset Value',
          description: 'Enter the current market value of your asset in your chosen currency.',
          tips: [
            'Use current market prices for precious metals',
            'For property, use fair market value',
            'For stocks/crypto, use recent market price',
            'Include only the portion you own',
          ],
        };
      
      case 'zakatEligible':
        return {
          title: 'Zakat Eligibility',
          description: 'Determine whether this asset is subject to Zakat based on Islamic principles.',
          tips: [
            'Personal-use items are typically not eligible',
            'Investment assets are usually eligible',
            'Consult a scholar if unsure',
          ],
        };
      
      default:
        break;
    }
  }

  // Category-specific help
  return {
    title: categoryData.name,
    description: categoryData.description,
    examples: categoryData.subCategories.map(sub => `${sub.name}: ${sub.description}`),
    tips: [
      `Zakat rate: ${categoryData.zakatRate}%`,
      categoryData.nisabApplicable ? 'Subject to Nisab threshold' : 'Not subject to Nisab',
      categoryData.defaultZakatEligible ? 'Generally Zakat eligible' : 'Zakat eligibility varies',
    ],
  };
};

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  category,
  field,
  isVisible,
  onClose,
}) => {
  if (!isVisible) return null;

  const helpContent = getHelpContent(category, field);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <HelpCircle className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-neutral-900">
              {helpContent.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <p className="text-neutral-700 leading-relaxed">
            {helpContent.description}
          </p>

          {helpContent.examples && helpContent.examples.length > 0 && (
            <div>
              <h3 className="font-semibold text-neutral-900 mb-3">Examples:</h3>
              <ul className="space-y-2">
                {helpContent.examples.map((example, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-primary-600 font-medium">•</span>
                    <span className="text-neutral-700">{example}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {helpContent.tips && helpContent.tips.length > 0 && (
            <div>
              <h3 className="font-semibold text-neutral-900 mb-3">Tips:</h3>
              <ul className="space-y-2">
                {helpContent.tips.map((tip, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-amber-500 font-medium">💡</span>
                    <span className="text-neutral-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 rounded-b-xl">
          <p className="text-sm text-neutral-600">
            Need more help? Consider consulting with a qualified Islamic scholar for specific guidance on your situation.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContextualHelp;