/**
 * Skeleton Component
 * 
 * Provides loading placeholders with shimmer animation
 * Improves perceived performance during lazy loading and data fetching
 * Part of T029: Implement Loading Skeletons
 */

import React from 'react';

interface SkeletonProps {
  /** Width of skeleton (default: 100%) */
  width?: string | number;
  /** Height of skeleton (default: 20px) */
  height?: string | number;
  /** Border radius (default: 4px) */
  borderRadius?: string | number;
  /** Additional CSS classes */
  className?: string;
  /** Number of skeleton lines to render */
  count?: number;
  /** Spacing between skeleton lines */
  spacing?: string;
}

/**
 * Base skeleton component with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = '',
  count = 1,
  spacing = '0.75rem',
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
  };

  if (count === 1) {
    return (
      <div
        className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] ${className}`}
        style={style}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className="space-y-0" style={{ gap: spacing }}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] ${className}`}
          style={{ ...style, marginBottom: index < count - 1 ? spacing : 0 }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

/**
 * Circular skeleton for avatars and icons
 */
export const SkeletonCircle: React.FC<Omit<SkeletonProps, 'borderRadius' | 'count' | 'spacing'>> = ({
  width = '40px',
  height = '40px',
  className = '',
}) => {
  return <Skeleton width={width} height={height} borderRadius="50%" className={className} />;
};

/**
 * Skeleton for text blocks with multiple lines
 */
interface SkeletonTextProps {
  lines?: number;
  spacing?: string;
  lastLineWidth?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  spacing = '0.75rem',
  lastLineWidth = '70%',
}) => {
  return (
    <div className="space-y-0" style={{ gap: spacing }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height="16px"
          width={index === lines - 1 ? lastLineWidth : '100%'}
          className={index < lines - 1 ? 'mb-3' : ''}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton for card components
 */
interface SkeletonCardProps {
  hasImage?: boolean;
  imageHeight?: string;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  hasImage = false,
  imageHeight = '200px',
  lines = 3,
}) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
      {hasImage && (
        <Skeleton height={imageHeight} className="mb-4" borderRadius="8px" />
      )}
      <SkeletonText lines={lines} />
    </div>
  );
};

/**
 * Skeleton for table rows
 */
interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`header-${index}`} height="20px" width="80%" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} height="16px" />
          ))}
        </div>
      ))}
    </div>
  );
};
