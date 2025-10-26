/**
 * Loading Fallback Components
 * 
 * Provides context-aware loading states for lazy-loaded routes
 * Part of T029: Implement Loading Skeletons
 */

import React from 'react';
import { Skeleton, SkeletonCard, SkeletonTable } from './Skeleton';

/**
 * Generic page loading fallback with centered spinner
 */
export const PageLoadingFallback: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
        <span className="sr-only">Loading page content</span>
      </div>
    </div>
  );
};

/**
 * Dashboard loading skeleton
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading dashboard</span>
      
      {/* Header */}
      <div>
        <Skeleton height="32px" width="200px" className="mb-2" />
        <Skeleton height="20px" width="300px" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} lines={2} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard hasImage imageHeight="250px" lines={1} />
        <SkeletonCard hasImage imageHeight="250px" lines={1} />
      </div>

      {/* Recent Activity */}
      <div>
        <Skeleton height="24px" width="150px" className="mb-4" />
        <SkeletonTable rows={3} columns={3} />
      </div>
    </div>
  );
};

/**
 * Asset list loading skeleton
 */
export const AssetListSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading assets</span>
      
      {/* Header with action button */}
      <div className="flex justify-between items-center">
        <Skeleton height="32px" width="150px" />
        <Skeleton height="40px" width="120px" borderRadius="6px" />
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Skeleton height="40px" width="200px" borderRadius="6px" />
        <Skeleton height="40px" width="150px" borderRadius="6px" />
      </div>

      {/* Asset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} lines={3} />
        ))}
      </div>
    </div>
  );
};

/**
 * Calculator loading skeleton
 */
export const CalculatorSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading calculator</span>
      
      {/* Title */}
      <div className="text-center">
        <Skeleton height="36px" width="250px" className="mx-auto mb-2" />
        <Skeleton height="20px" width="400px" className="mx-auto" />
      </div>

      {/* Form Sections */}
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow">
            <Skeleton height="24px" width="180px" className="mb-4" />
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Skeleton height="16px" width="100px" className="mb-2" />
                  <Skeleton height="40px" borderRadius="6px" />
                </div>
                <div>
                  <Skeleton height="16px" width="100px" className="mb-2" />
                  <Skeleton height="40px" borderRadius="6px" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Result Section */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <Skeleton height="28px" width="200px" className="mb-3" />
        <Skeleton height="48px" width="150px" />
      </div>
    </div>
  );
};

/**
 * Profile/Settings loading skeleton
 */
export const ProfileSkeleton: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading profile</span>
      
      {/* Header */}
      <Skeleton height="32px" width="150px" />

      {/* Form Sections */}
      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton height="16px" width="120px" className="mb-2" />
            <Skeleton height="40px" borderRadius="6px" />
          </div>
        ))}
        
        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Skeleton height="40px" width="100px" borderRadius="6px" />
          <Skeleton height="40px" width="100px" borderRadius="6px" />
        </div>
      </div>
    </div>
  );
};

/**
 * List/History loading skeleton
 */
export const HistorySkeleton: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading history</span>
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton height="32px" width="150px" />
        <Skeleton height="40px" width="120px" borderRadius="6px" />
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Skeleton height="40px" width="150px" borderRadius="6px" />
        <Skeleton height="40px" width="150px" borderRadius="6px" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <SkeletonTable rows={8} columns={5} />
      </div>
    </div>
  );
};
