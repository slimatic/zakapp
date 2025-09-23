import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseClasses = 'btn';
  
  const variantClasses = {
    default: 'btn-primary',
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    accent: 'btn-accent',
    outline: 'border border-neutral-300 bg-transparent text-neutral-700 hover:bg-neutral-50',
    ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};