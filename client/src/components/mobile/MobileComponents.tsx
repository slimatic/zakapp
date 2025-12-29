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
 * Mobile Touch Targets
 * 
 * Mobile-optimized components with proper touch target sizes (44x44px minimum).
 * Ensures better usability on touch devices.
 */

import React from 'react';

/**
 * Mobile-optimized button with minimum 44x44px touch target
 */
interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 touch-manipulation';
  
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };
  
  // Ensure minimum 44x44px touch target
  const sizeClasses = {
    sm: 'min-h-[44px] px-4 text-sm gap-2',
    md: 'min-h-[48px] px-6 text-base gap-2',
    lg: 'min-h-[52px] px-8 text-lg gap-3',
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className="h-5 w-5 flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className="h-5 w-5 flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
    </button>
  );
};

/**
 * Mobile-optimized icon button with circular touch target
 */
interface MobileIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string; // For accessibility
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const MobileIconButton: React.FC<MobileIconButtonProps> = ({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };
  
  // Circular buttons with minimum 44x44px
  const sizeClasses = {
    sm: 'h-11 w-11', // 44px
    md: 'h-12 w-12', // 48px
    lg: 'h-14 w-14', // 56px
  };
  
  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
  };
  
  return (
    <button
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 touch-manipulation ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      <span className={iconSizes[size]} aria-hidden="true">
        {icon}
      </span>
    </button>
  );
};

/**
 * Mobile-optimized list item with proper touch spacing
 */
interface MobileListItemProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const MobileListItem: React.FC<MobileListItemProps> = ({
  title,
  description,
  icon,
  action,
  onClick,
  className = '',
}) => {
  const Component = onClick ? 'button' : 'div';
  const interactiveClasses = onClick
    ? 'hover:bg-gray-50 active:bg-gray-100 cursor-pointer touch-manipulation'
    : '';
  
  return (
    <Component
      onClick={onClick}
      className={`flex items-center gap-4 py-4 px-4 min-h-[64px] w-full text-left transition-colors ${interactiveClasses} ${className}`}
    >
      {icon && (
        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gray-100">
          {icon}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-gray-900 truncate">{title}</p>
        {description && (
          <p className="text-sm text-gray-500 truncate">{description}</p>
        )}
      </div>
      
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </Component>
  );
};

/**
 * Mobile-optimized card with proper spacing
 */
interface MobileCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  onClick,
  className = '',
}) => {
  const Component = onClick ? 'button' : 'div';
  const interactiveClasses = onClick
    ? 'hover:shadow-md active:shadow-sm cursor-pointer touch-manipulation'
    : '';
  
  return (
    <Component
      onClick={onClick}
      className={`bg-white rounded-lg border border-gray-200 p-6 transition-shadow w-full text-left ${interactiveClasses} ${className}`}
    >
      {children}
    </Component>
  );
};

/**
 * Mobile-optimized input with larger touch target
 */
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const MobileInput: React.FC<MobileInputProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `mobile-input-${label.toLowerCase().replace(/\s/g, '-')}`;
  
  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`block w-full min-h-[48px] px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors touch-manipulation ${
          error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
        }`}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

/**
 * Mobile-optimized textarea
 */
interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const MobileTextarea: React.FC<MobileTextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const textareaId = id || `mobile-textarea-${label.toLowerCase().replace(/\s/g, '-')}`;
  
  return (
    <div className={className}>
      <label
        htmlFor={textareaId}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>
      <textarea
        id={textareaId}
        className={`block w-full min-h-[120px] px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors touch-manipulation resize-y ${
          error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
        }`}
        {...props}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

/**
 * Mobile-optimized select dropdown
 */
interface MobileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  helperText?: string;
}

export const MobileSelect: React.FC<MobileSelectProps> = ({
  label,
  options,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const selectId = id || `mobile-select-${label.toLowerCase().replace(/\s/g, '-')}`;
  
  return (
    <div className={className}>
      <label
        htmlFor={selectId}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`block w-full min-h-[48px] px-4 py-3 text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors touch-manipulation ${
          error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
        }`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

/**
 * Mobile-optimized tab navigation
 */
interface MobileTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface MobileTabsProps {
  tabs: MobileTab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const MobileTabs: React.FC<MobileTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="flex -mb-px space-x-2 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`min-h-[48px] flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap touch-manipulation ${
                isActive
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.icon && (
                <span className="h-5 w-5" aria-hidden="true">
                  {tab.icon}
                </span>
              )}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default {
  MobileButton,
  MobileIconButton,
  MobileListItem,
  MobileCard,
  MobileInput,
  MobileTextarea,
  MobileSelect,
  MobileTabs,
};
