import React from 'react';
import { clsx } from 'clsx';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  className,
  ...props
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={clsx(
        'w-full bg-neutral-200 rounded-full h-2 overflow-hidden',
        className
      )}
      {...props}
    >
      <div
        className="bg-primary-600 h-full rounded-full transition-all duration-300 ease-in-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};
