import React from 'react';
import { FieldError } from 'react-hook-form';

interface FormInputProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'email' | 'password' | 'date' | 'datetime-local';
  placeholder?: string;
  required?: boolean;
  error?: FieldError;
  disabled?: boolean;
  step?: string;
  min?: string | number;
  max?: string | number;
  className?: string;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      label,
      name,
      type = 'text',
      placeholder,
      required,
      error,
      disabled,
      step,
      min,
      max,
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
        <input
          ref={ref}
          type={type}
          id={name}
          name={name}
          placeholder={placeholder}
          disabled={disabled}
          step={step}
          min={min}
          max={max}
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

FormInput.displayName = 'FormInput';
