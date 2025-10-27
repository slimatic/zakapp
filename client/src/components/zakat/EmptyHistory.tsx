import React from 'react';
import { ClockIcon, CalculatorIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

/**
 * Empty state component for calculation history
 * Guides users to perform their first Zakat calculation
 */
export const EmptyHistory: React.FC = () => {
  return (
    <div className="text-center py-12 px-4">
      {/* Illustration */}
      <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <ClockIcon className="w-12 h-12 text-green-600" />
      </div>

      {/* Heading */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        No Calculations Yet
      </h2>

      <p className="text-gray-600 max-w-md mx-auto mb-8">
        Your Zakat calculation history will appear here. Start by calculating your Zakat to see your history.
      </p>

      {/* What happens next */}
      <div className="max-w-lg mx-auto mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          What you'll see here:
        </h3>
        <ul className="space-y-2 text-sm text-blue-800 text-left">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>All your Zakat calculations with dates</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Total assets and Zakat amounts</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Methodology used for each calculation</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Ability to download or export calculations</span>
          </li>
        </ul>
      </div>

      {/* Call to action */}
      <Link
        to="/zakat/calculator"
        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors shadow-sm"
      >
        <CalculatorIcon className="w-5 h-5" />
        Calculate Zakat Now
      </Link>

      {/* Help link */}
      <p className="mt-6 text-sm text-gray-500">
        New to Zakat?{' '}
        <Link to="/help/getting-started" className="text-green-600 hover:text-green-700 underline">
          Learn about Zakat calculation
        </Link>
      </p>
    </div>
  );
};

export default EmptyHistory;
