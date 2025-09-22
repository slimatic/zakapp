import React from 'react';
import { Check } from 'lucide-react';
import { QuestionnaireStep } from '../../store';

interface QuestionnaireProgressProps {
  steps: QuestionnaireStep[];
  currentStepIndex: number;
  onStepClick?: (stepIndex: number) => void;
}

export const QuestionnaireProgress: React.FC<QuestionnaireProgressProps> = ({
  steps,
  currentStepIndex,
  onStepClick,
}) => {
  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = step.isCompleted;
            const isActive = step.isActive;
            const isClickable = onStepClick && (isCompleted || index <= currentStepIndex);

            return (
              <div key={step.id} className="flex flex-col items-center relative">
                {/* Step Circle */}
                <button
                  onClick={() => isClickable && onStepClick(index)}
                  disabled={!isClickable}
                  className={`
                    relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200
                    ${isCompleted 
                      ? 'bg-primary-600 text-white shadow-lg' 
                      : isActive 
                        ? 'bg-primary-100 text-primary-700 border-2 border-primary-600' 
                        : 'bg-neutral-200 text-neutral-500'
                    }
                    ${isClickable ? 'hover:scale-105 cursor-pointer' : 'cursor-default'}
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </button>

                {/* Step Label */}
                <div className="mt-3 text-center">
                  <div 
                    className={`text-sm font-medium ${
                      isActive ? 'text-primary-700' : 'text-neutral-700'
                    }`}
                  >
                    {step.title}
                  </div>
                  {isActive && (
                    <div className="text-xs text-neutral-500 mt-1 max-w-32 leading-tight">
                      {step.description}
                    </div>
                  )}
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div 
                    className={`
                      absolute top-5 left-full w-full h-0.5 -translate-y-1/2 transform
                      ${isCompleted ? 'bg-primary-600' : 'bg-neutral-300'}
                    `}
                    style={{ 
                      width: 'calc(100vw / ' + steps.length + ' - 2.5rem)',
                      marginLeft: '1.25rem'
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Progress Bar */}
      <div className="md:hidden mt-6">
        <div className="flex items-center justify-between text-sm text-neutral-600 mb-2">
          <span>Step {currentStepIndex + 1} of {steps.length}</span>
          <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireProgress;