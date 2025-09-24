import React from 'react';
import { FieldError } from 'react-hook-form';

interface FormSelectProps {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
  error?: FieldError;
  disabled?: boolean;
  className?: string;
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      name,
      options,
      placeholder,
      required,
      error,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div className={className}>
        <label
          htmlFor={name}
          className="block text-sm font-medium text-neutral-700 mb-2"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <select
          ref={ref}
          id={name}
          name={name}
          disabled={disabled}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-neutral-300'
          } ${disabled ? 'bg-neutral-50 cursor-not-allowed' : ''}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
      </div>
    );
  }
);

FormSelect.displayName = 'FormSelect';
