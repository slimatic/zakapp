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

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface OnboardingGuideProps {
  currentStep: 1 | 2 | 3;
  completedSteps: number[];
  bestAction?: {
    stepNumber: 1 | 2 | 3;
    title: string;
    description: string;
    label: string;
    href: string;
    variant: 'urgent' | 'primary' | 'success' | 'warning' | 'neutral';
  };
  isOnboardingComplete?: boolean;
}

interface Step {
  number: number;
  title: string;
  description: string;
  action: string;
  href: string;
  variant?: string;
}

/**
 * OnboardingGuide component - Smart Journey Card
 * 
 * Merges standard onboarding steps with dynamic "Next Best Action" intelligence.
 * The active priority action will highlight the corresponding step to guide the user.
 */
export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  currentStep,
  completedSteps,
  bestAction,
  isOnboardingComplete = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Base definition of steps
  const baseSteps: Step[] = [
    {
      number: 1,
      title: 'Add Assets',
      description: 'Add your wealth assets (cash, gold, investments) to begin tracking',
      action: 'Add Your First Asset',
      href: '/assets/new',
    },
    {
      number: 2,
      title: 'Create Nisab Record',
      description: 'Start a Nisab Year Record to track your Hawl period (354 days)',
      action: 'Create Nisab Record',
      href: '/nisab-records',
    },
    {
      number: 3,
      title: 'Track Payments',
      description: 'Record your Zakat payments and monitor payment history',
      action: 'Record Payment',
      href: '/payments',
    },
  ];

  // Merge Base Steps with Intelligent Action Context
  const steps = baseSteps.map(step => {
    // If this step matches the Best Action, override its content/visuals
    if (bestAction && bestAction.stepNumber === step.number) {
      return {
        ...step,
        title: bestAction.title,
        description: bestAction.description,
        action: bestAction.label,
        href: bestAction.href,
        variant: bestAction.variant
      };
    }
    return step;
  });

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
    // If we have a specific best action targeting this step, treat it as current even if technically completed
    // This allows maintenance tasks (like "Update Assets") to reactivate Step 1
    if (bestAction && bestAction.stepNumber === stepNumber) return true;

    return stepNumber === currentStep && !isStepCompleted(stepNumber);
  };

  // Helper for dynamic styles
  const getStepStyles = (completed: boolean, current: boolean, variant?: string) => {
    if (current && variant === 'urgent') return 'bg-red-50 border-red-200 shadow-md ring-1 ring-red-200';
    if (current && variant === 'warning') return 'bg-amber-50 border-amber-200 shadow-sm';

    if (completed && !current) return 'bg-green-50 border-green-200';
    if (current) return 'bg-white border-blue-300 shadow-sm';

    return 'bg-gray-50 border-gray-200';
  };

  const getBadgeStyles = (completed: boolean, current: boolean, variant?: string) => {
    if (current && variant === 'urgent') return 'bg-red-600 text-white animate-pulse';
    if (current && variant === 'warning') return 'bg-amber-500 text-white';

    if (completed && !current) return 'bg-green-600 text-white';
    if (current) return 'bg-blue-600 text-white';

    return 'bg-gray-300 text-gray-600';
  };

  const getTitleStyles = (completed: boolean, current: boolean, variant?: string) => {
    if (current && variant === 'urgent') return 'text-red-700 font-bold';
    if (current && variant === 'warning') return 'text-amber-800 font-bold';

    if (completed && !current) return 'text-green-700';
    if (current) return 'text-blue-700';

    return 'text-gray-600';
  };

  const getButtonStyles = (variant?: string) => {
    const base = "inline-flex items-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 rounded min-h-[44px] py-2 px-4 transition-colors ";

    if (variant === 'urgent') return base + "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 shadow-sm";
    if (variant === 'warning') return base + "bg-amber-100 text-amber-800 hover:bg-amber-200 focus:ring-amber-500";

    return base + "text-blue-600 hover:text-blue-700 hover:underline focus:ring-blue-600 px-3"; // Standard link style
  };

  // RENDER: Maintenance Mode (Single Card) - replaces the 3-step guide on completion
  if (isOnboardingComplete && bestAction) {
    const isWarning = bestAction.variant === 'warning';
    const isUrgent = bestAction.variant === 'urgent';
    // Base colors for maintenance mode
    const bgClass = isUrgent ? 'bg-red-50 border-red-200' :
      isWarning ? 'bg-amber-50 border-amber-200' :
        'bg-blue-50 border-blue-200';
    const textClass = isUrgent ? 'text-red-900' :
      isWarning ? 'text-amber-900' :
        'text-blue-900';
    const btnClass = isUrgent ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' :
      isWarning ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500' :
        'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';

    return (
      <div className={`rounded-xl border shadow-sm p-4 sm:p-5 transition-all duration-300 ${bgClass}`}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-4 items-start">
            <div className={`p-2 rounded-lg shrink-0 ${isUrgent ? 'bg-red-100 text-red-600' : isWarning ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
              {/* Dynamic Icon based on variant */}
              {isUrgent ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              ) : isWarning ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              )}
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${textClass} mb-1`}>
                {bestAction.title}
              </h3>
              <p className={`text-sm ${textClass} opacity-90`}>
                {bestAction.description}
              </p>
            </div>
          </div>

          <Link
            to={bestAction.href}
            className={`inline-flex items-center justify-center px-4 py-2 font-medium text-white rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${btnClass} whitespace-nowrap w-full sm:w-auto`}
          >
            {bestAction.label}
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

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
          <h2 className="text-lg font-bold text-gray-900">Your Zakat Journey</h2>
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleCollapsed}
          className="p-2 rounded-md text-gray-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
            Follow these steps to track your Zakat obligations. We'll highlight what needs attention.
          </p>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step) => {
              const completed = isStepCompleted(step.number);
              const current = isStepCurrent(step.number);

              return (
                <div
                  key={step.number}
                  className={`
                    flex items-start gap-4 p-4 rounded-lg border-2 transition-all duration-300
                    ${getStepStyles(completed, current, step.variant)}
                  `}
                >
                  {/* Step Number / Checkmark */}
                  <div
                    className={`
                      flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                      ${getBadgeStyles(completed, current, step.variant)}
                    `}
                  >
                    {!current && completed ? (
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
                        ${getTitleStyles(completed, current, step.variant)}
                      `}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {step.description}
                    </p>

                    {/* Action Button (only for current step) */}
                    {current && (
                      <Link
                        to={step.href}
                        className={getButtonStyles(step.variant)}
                      >
                        {/* Icon for Urgent/Warning */}
                        {step.variant === 'urgent' && <span className="mr-2">⚠️</span>}
                        {step.action}
                        {/* Standard arrow if not button-like */}
                        {!(step.variant?.match(/urgent|warning/)) && " →"}
                      </Link>
                    )}

                    {/* Completed State with Add More option */}
                    {!current && completed && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-green-600">
                          ✓ Completed
                        </span>
                        {step.number === 1 && (
                          <>
                            <Link
                              to={step.href}
                              className="text-xs font-medium text-gray-600 hover:text-gray-900 hover:underline"
                            >
                              Add more assets
                            </Link>
                            <span className="text-gray-300">|</span>
                            <Link
                              to="/liabilities"
                              className="text-xs font-medium text-gray-600 hover:text-gray-900 hover:underline"
                            >
                              Add liabilities
                            </Link>
                          </>
                        )}
                        {step.number === 2 && (
                          <Link
                            to={step.href}
                            className="text-xs font-medium text-gray-600 hover:text-gray-900 hover:underline"
                          >
                            Create another record
                          </Link>
                        )}
                        {step.number === 3 && (
                          <Link
                            to={step.href}
                            className="text-xs font-medium text-gray-600 hover:text-gray-900 hover:underline"
                          >
                            Record another payment
                          </Link>
                        )}
                      </div>
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
