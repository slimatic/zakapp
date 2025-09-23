import React from 'react';
import { FieldError } from 'react-hook-form';

interface DateInputProps {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  error?: FieldError;
  disabled?: boolean;
  className?: string;
  includeTime?: boolean;
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      label,
      name,
      placeholder,
      required,
      error,
      disabled,
      className,
      includeTime = false,
      ...props
    },
    ref
  ) => {
    const inputType = includeTime ? 'datetime-local' : 'date';

    return (
      <div className={className}>
        <label
          htmlFor={name}
          className="block text-sm font-medium text-neutral-700 mb-2"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          ref={ref}
          type={inputType}
          id={name}
          name={name}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-neutral-300'
          } ${disabled ? 'bg-neutral-50 cursor-not-allowed' : ''}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';
