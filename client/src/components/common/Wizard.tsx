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

/**
 * Progress Indicators
 * 
 * Multi-step wizard component with progress tracking.
 * Shows current step, allows navigation, and indicates completion.
 */

import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CheckIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  component: React.ReactNode;
  validate?: () => boolean | Promise<boolean>;
}

interface StepProgressProps {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowSkip?: boolean;
}

/**
 * Visual progress indicator showing all steps
 */
export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep,
  onStepClick,
  allowSkip = false,
}) => {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = allowSkip || isCompleted || isCurrent;

          return (
            <li
              key={step.id}
              className={`relative ${
                index !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''
              } flex-1`}
            >
              {/* Connector line */}
              {index !== steps.length - 1 && (
                <div
                  className="absolute top-4 left-0 -ml-px mt-0.5 h-0.5 w-full"
                  aria-hidden="true"
                >
                  <div
                    className={`h-full ${
                      isCompleted ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  ></div>
                </div>
              )}

              {/* Step circle */}
              <button
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                className={`group relative flex items-center ${
                  isClickable ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <span className="flex h-9 items-center">
                  <span
                    className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${
                      isCompleted
                        ? 'bg-indigo-600 group-hover:bg-indigo-800'
                        : isCurrent
                        ? 'border-2 border-indigo-600 bg-white'
                        : 'border-2 border-gray-300 bg-white group-hover:border-gray-400'
                    } transition-colors`}
                  >
                    {isCompleted ? (
                      <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                    ) : (
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isCurrent ? 'bg-indigo-600' : 'bg-transparent'
                        }`}
                      />
                    )}
                  </span>
                </span>
                <span className="ml-4 flex min-w-0 flex-col">
                  <span
                    className={`text-sm font-medium ${
                      isCurrent ? 'text-indigo-600' : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </span>
                  {step.description && (
                    <span className="text-xs text-gray-500">{step.description}</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

/**
 * Simple step counter (e.g., "Step 2 of 5")
 */
export const StepCounter: React.FC<{
  currentStep: number;
  totalSteps: number;
  className?: string;
}> = ({ currentStep, totalSteps, className = '' }) => {
  return (
    <div className={`text-sm text-gray-500 ${className}`}>
      Step {currentStep + 1} of {totalSteps}
    </div>
  );
};

/**
 * Wizard navigation buttons
 */
interface WizardNavigationProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onComplete?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  nextLabel?: string;
  previousLabel?: string;
  completeLabel?: string;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
}

export const WizardNavigation: React.FC<WizardNavigationProps> = ({
  onPrevious,
  onNext,
  onComplete,
  isFirstStep,
  isLastStep,
  nextLabel = 'Next',
  previousLabel = 'Previous',
  completeLabel = 'Complete',
  isNextDisabled = false,
  isNextLoading = false,
}) => {
  return (
    <div className="flex justify-between pt-6 border-t border-gray-200">
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstStep}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {previousLabel}
      </button>

      {isLastStep ? (
        <button
          type="button"
          onClick={onComplete}
          disabled={isNextDisabled || isNextLoading}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isNextLoading ? 'Processing...' : completeLabel}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled || isNextLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isNextLoading ? 'Validating...' : nextLabel}
          <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

/**
 * Complete wizard component
 */
interface WizardProps {
  steps: WizardStep[];
  onComplete: () => void;
  initialStep?: number;
  allowSkip?: boolean;
  className?: string;
}

export const Wizard: React.FC<WizardProps> = ({
  steps,
  onComplete,
  initialStep = 0,
  allowSkip = false,
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isValidating, setIsValidating] = useState(false);

  const handleNext = useCallback(async () => {
    const step = steps[currentStep];
    
    if (step.validate) {
      setIsValidating(true);
      try {
        const isValid = await step.validate();
        if (!isValid) {
          setIsValidating(false);
          return;
        }
      } catch (error) {
        toast.error('Validation error');
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, steps]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleStepClick = useCallback((stepIndex: number) => {
    setCurrentStep(stepIndex);
  }, []);

  const handleComplete = useCallback(async () => {
    const step = steps[currentStep];
    
    if (step.validate) {
      setIsValidating(true);
      try {
        const isValid = await step.validate();
        if (!isValid) {
          setIsValidating(false);
          return;
        }
      } catch (error) {
        toast.error('Validation error');
        setIsValidating(false);
        return;
      }
      setIsValidating(false);
    }

    onComplete();
  }, [currentStep, steps, onComplete]);

  const currentStepData = steps[currentStep];

  return (
    <div className={className}>
      {/* Progress indicator */}
      <div className="mb-8">
        <StepProgress
          steps={steps}
          currentStep={currentStep}
          onStepClick={handleStepClick}
          allowSkip={allowSkip}
        />
      </div>

      {/* Step counter */}
      <div className="mb-4">
        <StepCounter currentStep={currentStep} totalSteps={steps.length} />
      </div>

      {/* Current step content */}
      <div className="min-h-[300px] mb-6">
        {currentStepData.component}
      </div>

      {/* Navigation */}
      <WizardNavigation
        onPrevious={handlePrevious}
        onNext={handleNext}
        onComplete={handleComplete}
        isFirstStep={currentStep === 0}
        isLastStep={currentStep === steps.length - 1}
        isNextLoading={isValidating}
      />
    </div>
  );
};

export default Wizard;
