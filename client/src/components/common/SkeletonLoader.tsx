import React from 'react';

type SkeletonVariant = 'card' | 'text' | 'circle';

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  count?: number;
  className?: string;
}

/**
 * SkeletonLoader component - Loading placeholder with shimmer animation
 * 
 * Features:
 * - Shimmer animation effect (pulse)
 * - Content-aware shapes matching final UI
 * - Multiple variants: card, text, circle
 * - Configurable count for multiple items
 * - Better perceived performance than spinners
 * 
 * Variants:
 * - 'card': Full card skeleton with multiple text lines
 * - 'text': Single line text skeleton
 * - 'circle': Circular avatar/icon skeleton
 * 
 * @param variant - Shape variant ('card', 'text', or 'circle')
 * @param count - Number of skeleton items to render
 * @param className - Optional additional CSS classes
 */
export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  count = 1,
  className = '',
}) => {
  const skeletons = Array.from({ length: count }, (_, index) => index);

  return (
    <>
      {skeletons.map((index) => (
        <div key={index} className={className}>
          {variant === 'card' && <SkeletonCard />}
          {variant === 'text' && <SkeletonText />}
          {variant === 'circle' && <SkeletonCircle />}
        </div>
      ))}
    </>
  );
};

/**
 * SkeletonCard - Card skeleton with header and multiple text lines
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
      </div>

      {/* Content Lines */}
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="h-10 bg-gray-200 rounded animate-pulse w-full" />
      </div>
    </div>
  );
};

/**
 * SkeletonText - Single line text skeleton
 */
export const SkeletonText: React.FC<{ width?: string; className?: string }> = ({
  width = 'w-full',
  className = '',
}) => {
  return (
    <div className={`h-4 bg-gray-200 rounded animate-pulse ${width} ${className}`} />
  );
};

/**
 * SkeletonCircle - Circular skeleton (for avatars, icons)
 */
export const SkeletonCircle: React.FC<{ size?: string; className?: string }> = ({
  size = 'w-12 h-12',
  className = '',
}) => {
  return (
    <div className={`bg-gray-200 rounded-full animate-pulse ${size} ${className}`} />
  );
};

/**
 * SkeletonLine - Customizable line skeleton
 */
export const SkeletonLine: React.FC<{ width?: string; height?: string; className?: string }> = ({
  width = 'w-full',
  height = 'h-4',
  className = '',
}) => {
  return (
    <div className={`bg-gray-200 rounded animate-pulse ${width} ${height} ${className}`} />
  );
};

/**
 * SkeletonButton - Button skeleton
 */
export const SkeletonButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`h-10 bg-gray-200 rounded-md animate-pulse w-32 ${className}`} />
  );
};

/**
 * SkeletonTable - Table skeleton with rows
 */
export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({
  rows = 5,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Table Header */}
      <div className="flex gap-4">
        <div className="h-4 bg-gray-300 rounded animate-pulse w-1/4" />
        <div className="h-4 bg-gray-300 rounded animate-pulse w-1/4" />
        <div className="h-4 bg-gray-300 rounded animate-pulse w-1/4" />
        <div className="h-4 bg-gray-300 rounded animate-pulse w-1/4" />
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex gap-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
        </div>
      ))}
    </div>
  );
};
