import React, { useState } from 'react';
import { Button } from '../ui';

interface ZakatMethodology {
  id: string;
  name: string;
  description: string;
  zakatRate: number;
  nisabSource: 'gold' | 'silver';
  calendarType: 'lunar' | 'solar';
  regionalAdaptations?: any;
  scholarlyReferences?: string[];
  rulings?: {
    cashAndSavings: number;
    goldAndSilver: number;
    business: number;
    investments: number;
    cryptocurrency: number;
    agriculture?: number;
    livestock?: number;
  };
}

interface MethodologyRule {
  category: string;
  rate: number;
  conditions: string[];
  explanation: string;
}

interface MethodologySelectorProps {
  selectedMethodology: string;
  methodologies: ZakatMethodology[];
  onMethodologyChange: (methodology: string, customRules?: any) => void;
  showComparison: boolean;
}

/**
 * MethodologySelector Component
 * Interactive methodology selection with detailed descriptions,
 * side-by-side comparison, and custom methodology creation
 */
export const MethodologySelector: React.FC<MethodologySelectorProps> = ({
  selectedMethodology,
  methodologies,
  onMethodologyChange,
  showComparison
}) => {
  const [customRules, setCustomRules] = useState({
    zakatRate: 2.5,
    nisabSource: 'gold' as 'gold' | 'silver',
    calendarType: 'lunar' as 'lunar' | 'solar',
    categoryRates: {
      cash: 2.5,
      gold: 2.5,
      silver: 2.5,
      business: 2.5,
      investment: 2.5,
      crypto: 2.5
    }
  });

  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [activeComparisonTab, setActiveComparisonTab] = useState<'overview' | 'rules' | 'references'>('overview');

  // Default methodologies if none provided from API
  const defaultMethodologies: ZakatMethodology[] = [
    {
      id: 'standard',
      name: 'Standard Methodology',
      description: 'The most commonly used Zakat calculation methodology based on contemporary Islamic scholarship.',
      zakatRate: 2.5,
      nisabSource: 'silver',
      calendarType: 'lunar',
      rulings: {
        cashAndSavings: 2.5,
        goldAndSilver: 2.5,
        business: 2.5,
        investments: 2.5,
        cryptocurrency: 2.5
      },
      scholarlyReferences: [
        'Fiqh al-Zakat by Dr. Yusuf al-Qaradawi',
        'Contemporary Fatawa on Zakat by various Islamic councils',
        'Islamic Society of North America (ISNA) Guidelines'
      ]
    },
    {
      id: 'hanafi',
      name: 'Hanafi School',
      description: 'Following the Hanafi school of Islamic jurisprudence with specific rulings on wealth calculation.',
      zakatRate: 2.5,
      nisabSource: 'silver',
      calendarType: 'lunar',
      rulings: {
        cashAndSavings: 2.5,
        goldAndSilver: 2.5,
        business: 2.5,
        investments: 2.5,
        cryptocurrency: 0 // More conservative approach
      },
      scholarlyReferences: [
        'Al-Hidayah by Marghinani',
        'Fatawa Alamgiri',
        'Modern Hanafi Fiqh Councils'
      ]
    },
    {
      id: 'shafi_i',
      name: 'Shafi\'i School',
      description: 'Based on Shafi\'i school methodology with emphasis on gold-based nisab calculations.',
      zakatRate: 2.5,
      nisabSource: 'gold',
      calendarType: 'lunar',
      rulings: {
        cashAndSavings: 2.5,
        goldAndSilver: 2.5,
        business: 2.5,
        investments: 2.5,
        cryptocurrency: 2.5
      },
      scholarlyReferences: [
        'Al-Majmu\' by An-Nawawi',
        'Minhaj at-Talibin by An-Nawawi',
        'Contemporary Shafi\'i Councils'
      ]
    }
  ];

  const availableMethodologies = methodologies.length > 0 ? methodologies : defaultMethodologies;
  const currentMethodology = availableMethodologies.find(m => m.id === selectedMethodology);

  const handleMethodologySelect = (methodologyId: string) => {
    if (methodologyId === 'custom') {
      setShowCustomEditor(true);
      onMethodologyChange('custom', customRules);
    } else {
      setShowCustomEditor(false);
      onMethodologyChange(methodologyId);
    }
  };

  const handleCustomRuleChange = (category: keyof typeof customRules.categoryRates, value: number) => {
    const updatedRules = {
      ...customRules,
      categoryRates: {
        ...customRules.categoryRates,
        [category]: value
      }
    };
    setCustomRules(updatedRules);
    onMethodologyChange('custom', updatedRules);
  };

  const getMethodologyIcon = (methodologyId: string): string => {
    const icons: Record<string, string> = {
      standard: '⚖️',
      hanafi: '🕌',
      shafi_i: '📖',
      custom: '⚙️'
    };
    return icons[methodologyId] || '⚖️';
  };

  const getComparisonData = () => {
    return availableMethodologies.map(methodology => ({
      ...methodology,
      differences: {
        nisabPreference: methodology.nisabSource === 'gold' ? 'Higher threshold (gold-based)' : 'Lower threshold (silver-based)',
        cryptoStance: methodology.rulings?.cryptocurrency === 0 ? 'Not accepted' : 'Fully accepted',
        conservatism: methodology.id === 'hanafi' ? 'More conservative' : methodology.id === 'shafi_i' ? 'Moderate' : 'Standard'
      }
    }));
  };

  return (
    <div className="space-y-6">
      {/* Quick Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {availableMethodologies.map((methodology) => (
          <div
            key={methodology.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedMethodology === methodology.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
            onClick={() => handleMethodologySelect(methodology.id)}
          >
            <div className="text-center">
              <div className="text-3xl mb-2">{getMethodologyIcon(methodology.id)}</div>
              <div className="font-medium text-gray-900 text-sm mb-1">
                {methodology.name}
              </div>
              <div className="text-xs text-gray-600 mb-2">
                {methodology.nisabSource} nisab • {methodology.zakatRate}% rate
              </div>
              {selectedMethodology === methodology.id && (
                <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Selected
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Custom Methodology Option */}
        <div
          className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
            selectedMethodology === 'custom'
              ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
          }`}
          onClick={() => handleMethodologySelect('custom')}
        >
          <div className="text-center">
            <div className="text-3xl mb-2">⚙️</div>
            <div className="font-medium text-gray-900 text-sm mb-1">
              Custom Rules
            </div>
            <div className="text-xs text-gray-600 mb-2">
              Create your own methodology
            </div>
            {selectedMethodology === 'custom' && (
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Selected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Current Methodology Details */}
      {currentMethodology && selectedMethodology !== 'custom' && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <div className="text-4xl">{getMethodologyIcon(selectedMethodology)}</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {currentMethodology.name}
              </h3>
              <p className="text-gray-700 mb-4">
                {currentMethodology.description}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Zakat Rate:</span>
                  <div className="text-lg font-bold text-blue-600">
                    {currentMethodology.zakatRate}%
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Nisab Source:</span>
                  <div className="text-lg font-bold text-gray-900 capitalize">
                    {currentMethodology.nisabSource}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Calendar:</span>
                  <div className="text-lg font-bold text-gray-900 capitalize">
                    {currentMethodology.calendarType}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Crypto:</span>
                  <div className="text-lg font-bold text-gray-900">
                    {currentMethodology.rulings?.cryptocurrency === 0 ? 'Not Included' : 'Included'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Rules Editor */}
      {showCustomEditor && selectedMethodology === 'custom' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-4">
            🔧 Custom Methodology Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* General Settings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">General Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Zakat Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={customRules.zakatRate}
                    onChange={(e) => setCustomRules(prev => ({ 
                      ...prev, 
                      zakatRate: parseFloat(e.target.value) || 0 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nisab Source
                  </label>
                  <select
                    value={customRules.nisabSource}
                    onChange={(e) => setCustomRules(prev => ({ 
                      ...prev, 
                      nisabSource: e.target.value as 'gold' | 'silver' 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="gold">Gold (Higher Threshold)</option>
                    <option value="silver">Silver (Lower Threshold)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calendar Type
                  </label>
                  <select
                    value={customRules.calendarType}
                    onChange={(e) => setCustomRules(prev => ({ 
                      ...prev, 
                      calendarType: e.target.value as 'lunar' | 'solar' 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="lunar">Lunar (Islamic Calendar)</option>
                    <option value="solar">Solar (Gregorian Calendar)</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Category-Specific Rates */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Category-Specific Rates (%)</h4>
              <div className="space-y-3">
                {Object.entries(customRules.categoryRates).map(([category, rate]) => (
                  <div key={category} className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {category.replace('_', ' & ')}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={rate}
                      onChange={(e) => handleCustomRuleChange(
                        category as keyof typeof customRules.categoryRates, 
                        parseFloat(e.target.value) || 0
                      )}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Islamic Compliance:</strong> Please consult with qualified Islamic scholars 
                  before using custom rates. Standard methodologies are based on established jurisprudence.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Methodology Comparison */}
      {showComparison && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-gray-900">
              📊 Methodology Comparison
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Compare different Islamic jurisprudence approaches to Zakat calculation
            </p>
          </div>

          {/* Comparison Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex px-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'rules', label: 'Detailed Rules' },
                { id: 'references', label: 'Scholarly References' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveComparisonTab(tab.id as any)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 ${
                    activeComparisonTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Comparison */}
            {activeComparisonTab === 'overview' && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Aspect</th>
                      {getComparisonData().map((methodology) => (
                        <th key={methodology.id} className="text-left py-3 px-4 font-medium text-gray-900">
                          {methodology.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-3 px-4 font-medium text-gray-600">Zakat Rate</td>
                      {getComparisonData().map((methodology) => (
                        <td key={methodology.id} className="py-3 px-4 text-gray-900">
                          {methodology.zakatRate}%
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-gray-600">Nisab Preference</td>
                      {getComparisonData().map((methodology) => (
                        <td key={methodology.id} className="py-3 px-4 text-gray-900">
                          {methodology.differences.nisabPreference}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-gray-600">Cryptocurrency</td>
                      {getComparisonData().map((methodology) => (
                        <td key={methodology.id} className="py-3 px-4 text-gray-900">
                          {methodology.differences.cryptoStance}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-medium text-gray-600">Approach</td>
                      {getComparisonData().map((methodology) => (
                        <td key={methodology.id} className="py-3 px-4 text-gray-900">
                          {methodology.differences.conservatism}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Detailed Rules Comparison */}
            {activeComparisonTab === 'rules' && (
              <div className="space-y-6">
                {getComparisonData().map((methodology) => (
                  <div key={methodology.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <span>{getMethodologyIcon(methodology.id)}</span>
                      <span>{methodology.name}</span>
                    </h4>
                    
                    {methodology.rulings && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(methodology.rulings).map(([category, rate]) => (
                          <div key={category} className="text-sm">
                            <span className="font-medium text-gray-600 capitalize">
                              {category.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span className="ml-2 font-bold text-gray-900">
                              {rate === 0 ? 'N/A' : `${rate}%`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Scholarly References */}
            {activeComparisonTab === 'references' && (
              <div className="space-y-6">
                {getComparisonData().map((methodology) => (
                  <div key={methodology.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                      <span>{getMethodologyIcon(methodology.id)}</span>
                      <span>{methodology.name}</span>
                    </h4>
                    
                    {methodology.scholarlyReferences && (
                      <ul className="space-y-2">
                        {methodology.scholarlyReferences.map((reference, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start space-x-2">
                            <span className="font-medium text-gray-500 mt-0.5">•</span>
                            <span>{reference}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          ❓ Frequently Asked Questions
        </h3>
        
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-blue-900">Which methodology should I choose?</p>
            <p className="text-blue-800 mt-1">
              The Standard methodology is widely accepted. If you follow a specific school of thought 
              (Hanafi, Shafi'i, etc.), choose accordingly. When in doubt, consult local Islamic scholars.
            </p>
          </div>
          
          <div>
            <p className="font-medium text-blue-900">What's the difference between gold and silver nisab?</p>
            <p className="text-blue-800 mt-1">
              Gold nisab (85g) typically results in a higher threshold, while silver nisab (595g) 
              is lower. Many scholars recommend using the lower threshold to benefit the poor more.
            </p>
          </div>
          
          <div>
            <p className="font-medium text-blue-900">Can I create my own custom rules?</p>
            <p className="text-blue-800 mt-1">
              While the app allows custom configurations, please consult qualified Islamic scholars 
              before deviating from established methodologies to ensure Islamic compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};