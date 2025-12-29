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

import React from 'react';
import { Button } from './Button';

interface ErrorMessageProps {
  error: any;
  onRetry?: () => void;
  className?: string;
  title?: string;
}

/**
 * Error message component for displaying error states with optional retry functionality
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  className = '',
  title = 'Something went wrong'
}) => {
  // Extract error message from different error formats
  const getErrorMessage = (err: any): string => {
    if (typeof err === 'string') return err;
    if (err?.message) return err.message;
    if (err?.error?.message) return err.error.message;
    if (err?.data?.message) return err.data.message;
    return 'An unexpected error occurred';
  };

  const errorMessage = getErrorMessage(error);

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="text-red-400 text-xl">⚠️</div>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {title}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            {errorMessage}
          </div>
          {onRetry && (
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={onRetry}
                className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300"
              >
                Try again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};