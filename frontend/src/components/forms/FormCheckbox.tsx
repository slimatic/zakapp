import React from 'react';
import { FieldError } from 'react-hook-form';

interface FormCheckboxProps {
  label: string;
  name: string;
  description?: string;
  required?: boolean;
  error?: FieldError;
  disabled?: boolean;
  className?: string;
}

export const FormCheckbox = React.forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ label, name, description, required, error, disabled, className, ...props }, ref) => {
    return (
      <div className={className}>
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              ref={ref}
              type="checkbox"
              id={name}
              name={name}
              disabled={disabled}
              className={`w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500 ${
                disabled ? 'cursor-not-allowed' : ''
              }`}
              {...props}
            />
          </div>
          <div className="ml-3">
            <label htmlFor={name} className="text-sm font-medium text-neutral-700">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            {description && (
              <p className="text-sm text-neutral-500">{description}</p>
            )}
          </div>
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error.message}</p>
        )}
      </div>
    );
  }
);

FormCheckbox.displayName = 'FormCheckbox';