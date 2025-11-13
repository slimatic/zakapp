import React, { useState, useEffect } from 'react';

interface OnboardingGuideProps {
  currentStep: 1 | 2 | 3;
  completedSteps: number[];
}

interface Step {
  number: number;
  title: string;
  description: string;
  action: string;
}

/**
 * OnboardingGuide component - 3-step guided onboarding for new users
 * 
 * Features:
 * - Visual step indicators (numbered circles)
 * - Current step highlighted, completed steps checkmarked
 * - Collapsible with localStorage persistence
 * - Progressive disclosure approach
 * - Clear call-to-action for each step
 * 
 * Steps:
 * 1. Add Assets - Add your first asset to start tracking
 * 2. Create Record - Create a Nisab Year Record to begin Hawl
 * 3. Track Zakat - Monitor your progress and calculate Zakat
 * 
 * @param currentStep - Current step number (1, 2, or 3)
 * @param completedSteps - Array of completed step numbers
 */
export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  currentStep,
  completedSteps,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const steps: Step[] = [
    {
      number: 1,
      title: 'Add Assets',
      description: 'Add your wealth assets (cash, gold, investments) to begin tracking',
      action: 'Add Your First Asset',
    },
    {
      number: 2,
      title: 'Create Nisab Record',
      description: 'Start a Nisab Year Record to track your Hawl period (354 days)',
      action: 'Create Nisab Record',
    },
    {
      number: 3,
      title: 'Track Zakat',
      description: 'Monitor your wealth throughout the year and calculate Zakat when due',
      action: 'View Dashboard',
    },
  ];

  /**
   * Load collapsed state from localStorage on mount
   */
  useEffect(() => {
    const savedState = localStorage.getItem('zakapp_onboarding_collapsed');
    if (savedState === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  /**
   * Toggle collapsed state and persist to localStorage
   */
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('zakapp_onboarding_collapsed', String(newState));
  };

  /**
   * Determine if a step is completed
   */
  const isStepCompleted = (stepNumber: number): boolean => {
    return completedSteps.includes(stepNumber);
  };

  /**
   * Determine if a step is current
   */
  const isStepCurrent = (stepNumber: number): boolean => {
    return stepNumber === currentStep && !isStepCompleted(stepNumber);
  };

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 shadow-sm">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg
              className="w-6 h-6 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Getting Started Guide</h2>
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-md text-gray-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
          aria-label={isCollapsed ? 'Expand guide' : 'Collapse guide'}
          aria-expanded={!isCollapsed}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="space-y-4">
          <p className="text-sm text-gray-700 mb-4">
            Follow these three simple steps to start tracking your Zakat obligations:
          </p>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, index) => {
              const completed = isStepCompleted(step.number);
              const current = isStepCurrent(step.number);

              return (
                <div
                  key={step.number}
                  className={`
                    flex items-start gap-4 p-4 rounded-lg border-2 transition-all
                    ${completed ? 'bg-green-50 border-green-200' : ''}
                    ${current ? 'bg-white border-blue-300 shadow-sm' : ''}
                    ${!completed && !current ? 'bg-gray-50 border-gray-200' : ''}
                  `}
                >
                  {/* Step Number / Checkmark */}
                  <div
                    className={`
                      flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${completed ? 'bg-green-600 text-white' : ''}
                      ${current ? 'bg-blue-600 text-white' : ''}
                      ${!completed && !current ? 'bg-gray-300 text-gray-600' : ''}
                    `}
                  >
                    {completed ? (
                      <svg
                        className="w-5 h-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <h3
                      className={`
                        font-semibold mb-1
                        ${completed ? 'text-green-700' : ''}
                        ${current ? 'text-blue-700' : ''}
                        ${!completed && !current ? 'text-gray-600' : ''}
                      `}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {step.description}
                    </p>

                    {/* Action Button (only for current step) */}
                    {current && (
                      <button
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline focus:outline-none"
                        onClick={() => {
                          // Navigation will be handled by parent component
                          // This is just a visual indicator
                        }}
                      >
                        {step.action} →
                      </button>
                    )}

                    {/* Completed Badge */}
                    {completed && (
                      <span className="text-xs font-medium text-green-600">
                        ✓ Completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Indicator */}
          <div className="pt-4 border-t border-blue-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">
                {completedSteps.length} of {steps.length} completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
                role="progressbar"
                aria-valuenow={(completedSteps.length / steps.length) * 100}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Onboarding progress: ${completedSteps.length} of ${steps.length} steps completed`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Collapsed View */}
      {isCollapsed && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {completedSteps.length} of {steps.length} steps completed
          </p>
          <span className="text-xs text-blue-600 font-medium">Click to expand</span>
        </div>
      )}
    </div>
  );
};
