import React from 'react';
import { FieldError, UseFormRegisterReturn } from 'react-hook-form';
import { CURRENCIES } from '@zakapp/shared';

interface CurrencyInputProps {
  label: string;
  name: string;
  currencyFieldName: string;
  placeholder?: string;
  required?: boolean;
  error?: FieldError;
  currencyError?: FieldError;
  disabled?: boolean;
  step?: string;
  min?: string | number;
  max?: string | number;
  className?: string;
  valueRegister: UseFormRegisterReturn; // React Hook Form register for value field
  currencyRegister: UseFormRegisterReturn; // React Hook Form register for currency field
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  label,
  name,
  currencyFieldName,
  placeholder = "0.00",
  required,
  error,
  currencyError,
  disabled,
  step = "0.01",
  min = "0",
  max,
  className,
  valueRegister,
  currencyRegister,
}) => {
  const currencyOptions = CURRENCIES.map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name}`
  }));

  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-neutral-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <input
            {...valueRegister}
            type="number"
            id={name}
            placeholder={placeholder}
            disabled={disabled}
            step={step}
            min={min}
            max={max}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
              error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300'
            } ${disabled ? 'bg-neutral-50 cursor-not-allowed' : ''}`}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600">{error.message}</p>
          )}
        </div>
        <div>
          <select
            {...currencyRegister}
            id={currencyFieldName}
            disabled={disabled}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
              currencyError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-neutral-300'
            } ${disabled ? 'bg-neutral-50 cursor-not-allowed' : ''}`}
          >
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {currencyError && (
            <p className="mt-1 text-sm text-red-600">{currencyError.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};