import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useQuestionnaireStore } from '../../store';
import QuestionnaireProgress from './QuestionnaireProgress';
import QuestionnaireStepComponent from './QuestionnaireStep';
import ContextualHelp from './ContextualHelp';
import { AssetCategoryType } from '@zakapp/shared';
import { Asset } from '@zakapp/shared';

interface AssetQuestionnaireProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetCreated?: (asset: Asset) => void;
}

export const AssetQuestionnaire: React.FC<AssetQuestionnaireProps> = ({
  isOpen,
  onClose,
  onAssetCreated,
}) => {
  const {
    currentStepIndex,
    steps,
    isCompleted,
    assetData,
    showHelp,
    errors,
    isLoading,
    nextStep,
    previousStep,
    goToStep,
    updateAssetData,
    clearError,
    toggleHelp,
    resetQuestionnaire,
    completeQuestionnaire,
    validateCurrentStep,
  } = useQuestionnaireStore();

  const [helpContext, setHelpContext] = useState<{
    category?: AssetCategoryType;
    field?: string;
  }>({});

  // Don't render if not open
  if (!isOpen) return null;

  const handleClose = () => {
    resetQuestionnaire();
    onClose();
  };

  const handleShowHelp = (category?: AssetCategoryType, field?: string) => {
    setHelpContext({ category, field });
    if (!showHelp) {
      toggleHelp();
    }
  };

  const handleHideHelp = () => {
    if (showHelp) {
      toggleHelp();
    }
    setHelpContext({});
  };

  const handleComplete = () => {
    const asset = completeQuestionnaire();
    if (asset && onAssetCreated) {
      onAssetCreated(asset);
      handleClose();
    }
  };

  const currentStep = steps[currentStepIndex];
  const canProceed = validateCurrentStep();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 bg-white">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Z</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Add Asset</h1>
              <p className="text-sm text-neutral-600">
                {currentStep.title} - {currentStep.description}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6 text-neutral-600" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50">
          <QuestionnaireProgress
            steps={steps}
            currentStepIndex={currentStepIndex}
            onStepClick={goToStep}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {isCompleted ? (
              <div className="text-center space-y-6">
                <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-3xl">✅</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    Asset Added Successfully!
                  </h2>
                  <p className="text-neutral-600">
                    Your asset has been added and is ready for Zakat calculation.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <QuestionnaireStepComponent
                step={currentStep}
                stepIndex={currentStepIndex}
                totalSteps={steps.length}
                assetData={assetData}
                errors={errors}
                onDataChange={updateAssetData}
                onClearError={clearError}
                onShowHelp={handleShowHelp}
                onNext={nextStep}
                onPrevious={previousStep}
                onComplete={handleComplete}
                canProceed={canProceed}
              />
            )}
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">Processing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Contextual Help Modal */}
      <ContextualHelp
        category={helpContext.category}
        field={helpContext.field}
        isVisible={showHelp}
        onClose={handleHideHelp}
      />
    </div>
  );
};

export default AssetQuestionnaire;