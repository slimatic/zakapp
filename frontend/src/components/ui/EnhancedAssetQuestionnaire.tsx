import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  DollarSign,
  Coins,
  Building,
  TrendingUp,
  Landmark,
  Briefcase,
  Bitcoin,
  Receipt,
} from 'lucide-react';
import { Asset, AssetCategoryType } from '@zakapp/shared';

interface AssetQuestionnaireProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetCreated: (asset: Asset) => Promise<void>;
}

interface QuestionnaireStep {
  id: string;
  title: string;
  description: string;
  category: AssetCategoryType;
  icon: React.ElementType;
  questions: Question[];
}

interface Question {
  id: string;
  type: 'boolean' | 'number' | 'text' | 'select' | 'multiselect';
  question: string;
  description?: string;
  required?: boolean;
  options?: string[];
  dependsOn?: string;
  dependsOnValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
  };
}

interface QuestionnaireState {
  currentStep: number;
  answers: Record<string, any>;
  discoveredAssets: Partial<Asset>[];
  isLoading?: boolean;
  error?: string | null;
}

const questionnaireSteps: QuestionnaireStep[] = [
  {
    id: 'cash',
    title: 'Cash & Bank Accounts',
    description: "Let's start with your cash holdings and bank accounts",
    category: 'cash',
    icon: DollarSign,
    questions: [
      {
        id: 'has_savings',
        type: 'boolean',
        question: 'Do you have money in savings accounts?',
        description: 'Include any savings accounts with banks or credit unions',
        required: true,
      },
      {
        id: 'savings_amount',
        type: 'number',
        question: 'What is the total amount in your savings accounts?',
        dependsOn: 'has_savings',
        dependsOnValue: true,
        validation: { min: 0 },
      },
      {
        id: 'has_checking',
        type: 'boolean',
        question: 'Do you have money in checking accounts?',
        required: true,
      },
      {
        id: 'checking_amount',
        type: 'number',
        question: 'What is the total amount in your checking accounts?',
        dependsOn: 'has_checking',
        dependsOnValue: true,
        validation: { min: 0 },
      },
      {
        id: 'has_cash_hand',
        type: 'boolean',
        question: 'Do you keep cash at home or carry cash regularly?',
        required: true,
      },
      {
        id: 'cash_hand_amount',
        type: 'number',
        question: 'How much cash do you typically have on hand?',
        dependsOn: 'has_cash_hand',
        dependsOnValue: true,
        validation: { min: 0 },
      },
    ],
  },
  {
    id: 'gold',
    title: 'Gold Assets',
    description: 'Tell us about any gold you own',
    category: 'gold',
    icon: Coins,
    questions: [
      {
        id: 'has_gold_jewelry',
        type: 'boolean',
        question: 'Do you own gold jewelry?',
        description: 'Include rings, necklaces, bracelets, etc.',
        required: true,
      },
      {
        id: 'gold_jewelry_value',
        type: 'number',
        question: 'What is the estimated value of your gold jewelry?',
        dependsOn: 'has_gold_jewelry',
        dependsOnValue: true,
        validation: { min: 0 },
      },
      {
        id: 'has_gold_coins',
        type: 'boolean',
        question: 'Do you own gold coins or bars?',
        required: true,
      },
      {
        id: 'gold_coins_value',
        type: 'number',
        question: 'What is the current value of your gold coins/bars?',
        dependsOn: 'has_gold_coins',
        dependsOnValue: true,
        validation: { min: 0 },
      },
    ],
  },
  {
    id: 'silver',
    title: 'Silver Assets',
    description: 'Information about your silver holdings',
    category: 'silver',
    icon: Landmark,
    questions: [
      {
        id: 'has_silver',
        type: 'boolean',
        question:
          'Do you own any silver jewelry, coins, or other silver items?',
        required: true,
      },
      {
        id: 'silver_value',
        type: 'number',
        question: 'What is the estimated total value of your silver?',
        dependsOn: 'has_silver',
        dependsOnValue: true,
        validation: { min: 0 },
      },
    ],
  },
  {
    id: 'business',
    title: 'Business Assets',
    description: 'Business inventory and commercial holdings',
    category: 'business',
    icon: Briefcase,
    questions: [
      {
        id: 'has_business',
        type: 'boolean',
        question: 'Do you own a business or have business inventory?',
        required: true,
      },
      {
        id: 'business_type',
        type: 'select',
        question: 'What type of business assets do you have?',
        dependsOn: 'has_business',
        dependsOnValue: true,
        options: [
          'Retail inventory',
          'Manufacturing materials',
          'Trade goods',
          'Agricultural products',
          'Other',
        ],
      },
      {
        id: 'business_value',
        type: 'number',
        question:
          'What is the current value of your business inventory/assets?',
        dependsOn: 'has_business',
        dependsOnValue: true,
        validation: { min: 0 },
      },
    ],
  },
  {
    id: 'property',
    title: 'Investment Property',
    description: 'Real estate held for investment',
    category: 'property',
    icon: Building,
    questions: [
      {
        id: 'has_investment_property',
        type: 'boolean',
        question: 'Do you own any property for investment purposes?',
        description:
          'Include rental properties, land, or commercial real estate',
        required: true,
      },
      {
        id: 'property_value',
        type: 'number',
        question:
          'What is the current market value of your investment property?',
        dependsOn: 'has_investment_property',
        dependsOnValue: true,
        validation: { min: 0 },
      },
    ],
  },
  {
    id: 'stocks',
    title: 'Stocks & Securities',
    description: 'Investment in stocks, bonds, and funds',
    category: 'stocks',
    icon: TrendingUp,
    questions: [
      {
        id: 'has_stocks',
        type: 'boolean',
        question: 'Do you have investments in stocks, bonds, or mutual funds?',
        required: true,
      },
      {
        id: 'stocks_value',
        type: 'number',
        question: 'What is the current total value of your stock investments?',
        dependsOn: 'has_stocks',
        dependsOnValue: true,
        validation: { min: 0 },
      },
    ],
  },
  {
    id: 'crypto',
    title: 'Cryptocurrency',
    description: 'Digital currency holdings',
    category: 'crypto',
    icon: Bitcoin,
    questions: [
      {
        id: 'has_crypto',
        type: 'boolean',
        question: 'Do you own any cryptocurrency?',
        description: 'Include Bitcoin, Ethereum, and other digital currencies',
        required: true,
      },
      {
        id: 'crypto_value',
        type: 'number',
        question:
          'What is the current total value of your cryptocurrency holdings?',
        dependsOn: 'has_crypto',
        dependsOnValue: true,
        validation: { min: 0 },
      },
    ],
  },
  {
    id: 'debts',
    title: 'Money Owed to You',
    description: 'Loans and debts others owe you',
    category: 'debts',
    icon: Receipt,
    questions: [
      {
        id: 'has_receivables',
        type: 'boolean',
        question: 'Does anyone owe you money?',
        description:
          'Include personal loans, business receivables, or other debts',
        required: true,
      },
      {
        id: 'receivables_value',
        type: 'number',
        question: 'What is the total amount owed to you?',
        dependsOn: 'has_receivables',
        dependsOnValue: true,
        validation: { min: 0 },
      },
    ],
  },
];

export const EnhancedAssetQuestionnaire: React.FC<AssetQuestionnaireProps> = ({
  isOpen,
  onClose,
  onAssetCreated,
}) => {
  const [state, setState] = useState<QuestionnaireState>({
    currentStep: 0,
    answers: {},
    discoveredAssets: [],
    isLoading: false,
    error: null,
  });

  const currentStepData = questionnaireSteps[state.currentStep];
  const progress = ((state.currentStep + 1) / questionnaireSteps.length) * 100;

  const handleAnswer = useCallback((questionId: string, value: any) => {
    setState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: value,
      },
    }));
  }, []);

  const shouldShowQuestion = useCallback(
    (question: Question): boolean => {
      if (!question.dependsOn) return true;
      return state.answers[question.dependsOn] === question.dependsOnValue;
    },
    [state.answers]
  );

  const generateAssetsFromAnswers = useCallback((): Partial<Asset>[] => {
    const assets: Partial<Asset>[] = [];

    // Cash assets
    if (state.answers.has_savings && state.answers.savings_amount) {
      assets.push({
        name: 'Savings Account',
        category: 'cash',
        subCategory: 'savings',
        value: state.answers.savings_amount,
        currency: 'USD',
        zakatEligible: true,
      });
    }

    if (state.answers.has_checking && state.answers.checking_amount) {
      assets.push({
        name: 'Checking Account',
        category: 'cash',
        subCategory: 'checking',
        value: state.answers.checking_amount,
        currency: 'USD',
        zakatEligible: true,
      });
    }

    if (state.answers.has_cash_hand && state.answers.cash_hand_amount) {
      assets.push({
        name: 'Cash on Hand',
        category: 'cash',
        subCategory: 'cash_on_hand',
        value: state.answers.cash_hand_amount,
        currency: 'USD',
        zakatEligible: true,
      });
    }

    // Gold assets
    if (state.answers.has_gold_jewelry && state.answers.gold_jewelry_value) {
      assets.push({
        name: 'Gold Jewelry',
        category: 'gold',
        subCategory: 'jewelry',
        value: state.answers.gold_jewelry_value,
        currency: 'USD',
        zakatEligible: true,
      });
    }

    if (state.answers.has_gold_coins && state.answers.gold_coins_value) {
      assets.push({
        name: 'Gold Coins/Bars',
        category: 'gold',
        subCategory: 'coins',
        value: state.answers.gold_coins_value,
        currency: 'USD',
        zakatEligible: true,
      });
    }

    // Silver assets
    if (state.answers.has_silver && state.answers.silver_value) {
      assets.push({
        name: 'Silver Holdings',
        category: 'silver',
        subCategory: 'jewelry',
        value: state.answers.silver_value,
        currency: 'USD',
        zakatEligible: true,
      });
    }

    // Business assets
    if (state.answers.has_business && state.answers.business_value) {
      assets.push({
        name: state.answers.business_type || 'Business Assets',
        category: 'business',
        subCategory: 'inventory',
        value: state.answers.business_value,
        currency: 'USD',
        zakatEligible: true,
      });
    }

    // Property assets
    if (state.answers.has_investment_property && state.answers.property_value) {
      assets.push({
        name: 'Investment Property',
        category: 'property',
        subCategory: 'residential_investment',
        value: state.answers.property_value,
        currency: 'USD',
        zakatEligible: true,
      });
    }

    // Stocks assets
    if (state.answers.has_stocks && state.answers.stocks_value) {
      assets.push({
        name: 'Stock Investments',
        category: 'stocks',
        subCategory: 'individual_stocks',
        value: state.answers.stocks_value,
        currency: 'USD',
        zakatEligible: true,
      });
    }

    // Crypto assets
    if (state.answers.has_crypto && state.answers.crypto_value) {
      assets.push({
        name: 'Cryptocurrency Holdings',
        category: 'crypto',
        subCategory: 'bitcoin',
        value: state.answers.crypto_value,
        currency: 'USD',
        zakatEligible: true,
      });
    }

    // Debts/Receivables
    if (state.answers.has_receivables && state.answers.receivables_value) {
      assets.push({
        name: 'Money Owed to Me',
        category: 'debts',
        subCategory: 'accounts_receivable',
        value: state.answers.receivables_value,
        currency: 'USD',
        zakatEligible: true,
      });
    }

    return assets;
  }, [state.answers]);

  const handleNext = useCallback(() => {
    if (state.currentStep < questionnaireSteps.length - 1) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
      }));
    } else {
      // Final step - generate assets and advance to results view
      const discoveredAssets = generateAssetsFromAnswers();
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1, // This is the key fix - advance to results view
        discoveredAssets,
      }));
    }
  }, [state.currentStep, generateAssetsFromAnswers]);

  const handlePrevious = useCallback(() => {
    if (state.currentStep > 0) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1,
      }));
    }
  }, [state.currentStep]);

  const handleComplete = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Create assets from discovered data
      for (const assetData of state.discoveredAssets) {
        if (assetData.value && assetData.value > 0) {
          const asset: Asset = {
            assetId:
              Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: assetData.name!,
            category: assetData.category!,
            subCategory: assetData.subCategory!,
            value: assetData.value,
            currency: assetData.currency!,
            description: assetData.description,
            zakatEligible: assetData.zakatEligible!,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...assetData,
          };
          await onAssetCreated(asset);
        }
      }
      onClose();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save assets',
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.discoveredAssets, onAssetCreated, onClose]);

  const renderQuestion = (question: Question) => {
    if (!shouldShowQuestion(question)) return null;

    const value = state.answers[question.id];

    switch (question.type) {
      case 'boolean':
        return (
          <div key={question.id} className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900">{question.question}</h4>
              {question.description && (
                <p className="text-sm text-gray-500 mt-1">
                  {question.description}
                </p>
              )}
            </div>
            <div className="flex space-x-4">
              <Button
                variant={value === true ? 'default' : 'outline'}
                onClick={() => handleAnswer(question.id, true)}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Yes
              </Button>
              <Button
                variant={value === false ? 'default' : 'outline'}
                onClick={() => handleAnswer(question.id, false)}
                className="flex-1"
              >
                No
              </Button>
            </div>
          </div>
        );

      case 'number':
        return (
          <div key={question.id} className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900">{question.question}</h4>
              {question.description && (
                <p className="text-sm text-gray-500 mt-1">
                  {question.description}
                </p>
              )}
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="number"
                value={value || ''}
                onChange={e =>
                  handleAnswer(question.id, parseFloat(e.target.value) || 0)
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                min={question.validation?.min}
                max={question.validation?.max}
              />
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={question.id} className="space-y-3">
            <div>
              <h4 className="font-medium text-gray-900">{question.question}</h4>
              {question.description && (
                <p className="text-sm text-gray-500 mt-1">
                  {question.description}
                </p>
              )}
            </div>
            <select
              value={value || ''}
              onChange={e => handleAnswer(question.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an option</option>
              {question.options?.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepComplete = useCallback(() => {
    if (!currentStepData) return false;

    return currentStepData.questions
      .filter(shouldShowQuestion)
      .every(question => {
        const answer = state.answers[question.id];
        if (
          question.required &&
          (answer === undefined || answer === null || answer === '')
        ) {
          return false;
        }
        return true;
      });
  }, [currentStepData, shouldShowQuestion, state.answers]);

  const showResults = state.currentStep >= questionnaireSteps.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-auto">
        <DialogTitle className="text-center">Asset Discovery Questionnaire</DialogTitle>

        <div className="space-y-6 p-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {showResults
                  ? 'Review Results'
                  : `Step ${state.currentStep + 1} of ${questionnaireSteps.length}`}
              </span>
              <span className="text-gray-600">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {showResults ? (
            /* Results View */
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Assets Discovered
                </h3>
                <p className="text-gray-600 mt-1">
                  Based on your answers, we found{' '}
                  {
                    state.discoveredAssets.filter(a => a.value && a.value > 0)
                      .length
                  }{' '}
                  assets
                </p>
              </div>

              <div className="grid gap-4">
                {state.discoveredAssets
                  .filter(asset => asset.value && asset.value > 0)
                  .map((asset, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {asset.name}
                            </h4>
                            <p className="text-sm text-gray-500 capitalize">
                              {asset.category} •{' '}
                              {asset.subCategory?.replace('_', ' ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              ${asset.value?.toLocaleString()}
                            </p>
                            {asset.zakatEligible && (
                              <Badge variant="secondary" className="text-xs">
                                Zakat Eligible
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>

              <div className="text-center space-y-4">
                {state.error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="text-red-400">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <p className="mt-1 text-sm text-red-700">{state.error}</p>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-600">
                  These assets will be added to your portfolio for Zakat
                  calculation.
                </p>
                <div className="flex space-x-4 justify-center">
                  <Button onClick={handlePrevious} variant="outline" disabled={state.isLoading}>
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Review
                  </Button>
                  <Button onClick={handleComplete} disabled={state.isLoading}>
                    {state.isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving Assets...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Add Assets
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Question View */
            currentStepData && (
              <div className="space-y-6">
                {/* Step Header */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <currentStepData.icon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {currentStepData.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {currentStepData.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Questions */}
                <div className="space-y-6">
                  {currentStepData.questions.map(renderQuestion)}
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-6 border-t">
                  <Button
                    onClick={handlePrevious}
                    variant="outline"
                    disabled={state.currentStep === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  <Button onClick={handleNext} disabled={!isStepComplete()}>
                    {state.currentStep === questionnaireSteps.length - 1 ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Review Results
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
