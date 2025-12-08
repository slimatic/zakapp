import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  // optional test id to help e2e tests
  dataTestId?: string;
  // auto-select text on focus (useful for monetary inputs)
  autoSelectOnFocus?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({\n  label,\n  error,\n  helpText,\n  className,\n  id,\n  dataTestId,\n  autoSelectOnFocus = false,\n  onFocus,\n  ...props\n}, ref) => {\n  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');\n\n  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {\n    if (autoSelectOnFocus) {\n      e.target.select();\n    }\n    onFocus?.(e);\n  };\n\n  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        data-testid={dataTestId}
        onFocus={handleFocus}
        className={clsx(
          'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 sm:text-sm',
          error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-green-500 focus:border-green-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helpText && !error && (
        <p className="text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
});