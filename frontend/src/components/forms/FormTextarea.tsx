import React from 'react';
import { FieldError } from 'react-hook-form';

interface FormTextareaProps {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  error?: FieldError;
  disabled?: boolean;
  rows?: number;
  className?: string;
}

export const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  FormTextareaProps
>(
  (
    {
      label,
      name,
      placeholder,
      required,
      error,
      disabled,
      rows = 3,
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
        <textarea
          ref={ref}
          id={name}
          name={name}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-vertical ${
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

FormTextarea.displayName = 'FormTextarea';
