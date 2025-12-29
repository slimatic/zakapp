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
 * Enhanced Loading States
 * 
 * Provides specific, contextual loading messages instead of generic "Loading..."
 * Uses skeleton components for better perceived performance.
 */

import React from 'react';

interface LoadingStateProps {
  message?: string;
  description?: string;
  className?: string;
}

/**
 * Generic loading state with spinner and message
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  description,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p className="mt-4 text-lg font-medium text-gray-900">{message}</p>
      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
};

/**
 * Asset-specific loading states
 */
export const LoadingAssets: React.FC = () => (
  <LoadingState
    message="Loading your assets..."
    description="Fetching asset values and calculating totals"
  />
);

export const LoadingAssetDetails: React.FC = () => (
  <LoadingState
    message="Loading asset details..."
    description="Retrieving complete asset information"
  />
);

export const SavingAsset: React.FC = () => (
  <LoadingState
    message="Saving asset..."
    description="Encrypting and storing your data securely"
  />
);

/**
 * Zakat calculation loading states
 */
export const CalculatingZakat: React.FC = () => (
  <LoadingState
    message="Calculating Zakat..."
    description="Applying methodology and calculating obligations"
  />
);

export const LoadingCalculationHistory: React.FC = () => (
  <LoadingState
    message="Loading calculation history..."
    description="Retrieving past Zakat calculations"
  />
);

/**
 * Authentication loading states
 */
export const AuthenticatingUser: React.FC = () => (
  <LoadingState
    message="Signing you in..."
    description="Verifying credentials securely"
  />
);

export const CreatingAccount: React.FC = () => (
  <LoadingState
    message="Creating your account..."
    description="Setting up encryption and secure storage"
  />
);

/**
 * Data export loading states
 */
export const GeneratingExport: React.FC = () => (
  <LoadingState
    message="Generating export..."
    description="Preparing your data for download"
  />
);

export const GeneratingReport: React.FC = () => (
  <LoadingState
    message="Generating report..."
    description="Compiling calculation details and formatting"
  />
);

/**
 * Skeleton components for progressive loading
 */

interface SkeletonProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-3 bg-gray-200 rounded w-full"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="animate-pulse">
    <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-3 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="border-b border-gray-200 px-6 py-4">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="h-3 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 3 }) => (
  <div className="space-y-4 animate-pulse">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonChart: React.FC = () => (
  <div className="animate-pulse bg-white border border-gray-200 rounded-lg p-6">
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
    <div className="h-64 bg-gray-100 rounded flex items-end justify-around p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-200 rounded-t"
          style={{
            height: `${Math.random() * 80 + 20}%`,
            width: '12%',
          }}
        ></div>
      ))}
    </div>
  </div>
);

/**
 * Progressive loading wrapper
 * Shows skeleton while loading, then fades in content
 */
interface ProgressiveLoadProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}

export const ProgressiveLoad: React.FC<ProgressiveLoadProps> = ({
  isLoading,
  skeleton,
  children,
}) => {
  if (isLoading) {
    return <>{skeleton}</>;
  }

  return (
    <div className="animate-fade-in">
      {children}
    </div>
  );
};

export default LoadingState;
