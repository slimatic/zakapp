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
import { Link } from 'react-router-dom';

interface OnboardingGuideProps {
  currentStep: 1 | 2 | 3;
  completedSteps: number[];
}

interface Step {
  number: number;
  title: string;
  description: string;
  action: string;
  href: string;
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
            Follow these three simple steps to start tracking your Zakat obligations:
          </p>

          {/* Quick Helper Links for 0/3 Progress */}
          {completedSteps.length === 0 && (
            <div className="flex flex-wrap gap-4 mb-4">
              <Link
                to="/onboarding"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Restart Setup Wizard
              </Link>
              <Link
                to="/learn"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Read Learning Guide
              </Link>
            </div>
          )}

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
                      <Link
                        to={step.href}
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded min-h-[44px] py-2 px-3"
                      >
                        {step.action} →
                      </Link>
                    )}

                    {/* Completed State with Add More option */}
                    {completed && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-green-600">
                          ✓ Completed
                        </span>
                        {step.number === 1 && (
                          <Link
                            to={step.href}
                            className="text-xs font-medium text-gray-600 hover:text-gray-900 hover:underline"
                          >
                            Add more assets
                          </Link>
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
