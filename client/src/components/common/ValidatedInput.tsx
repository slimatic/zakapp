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

import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Validate a field value against rules
 */
export function validateField(
  value: any,
  rules: ValidationRule[]
): ValidationResult {
  for (const rule of rules) {
    // Required check
    if (rule.required && (value === '' || value === null || value === undefined)) {
      return { isValid: false, message: rule.message };
    }

    // Skip other checks if value is empty and not required
    if (!value && !rule.required) {
      continue;
    }

    // Min value
    if (rule.min !== undefined && Number(value) < rule.min) {
      return { isValid: false, message: rule.message };
    }

    // Max value
    if (rule.max !== undefined && Number(value) > rule.max) {
      return { isValid: false, message: rule.message };
    }

    // Min length
    if (rule.minLength !== undefined && String(value).length < rule.minLength) {
      return { isValid: false, message: rule.message };
    }

    // Max length
    if (rule.maxLength !== undefined && String(value).length > rule.maxLength) {
      return { isValid: false, message: rule.message };
    }

    // Pattern match
    if (rule.pattern && !rule.pattern.test(String(value))) {
      return { isValid: false, message: rule.message };
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      return { isValid: false, message: rule.message };
    }
  }

  return { isValid: true };
}

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  rules?: ValidationRule[];
  helpText?: string;
  showValidation?: boolean;
  onValidation?: (isValid: boolean) => void;
}

/**
 * Input component with real-time validation
 * Validates on blur (not on every keystroke) for better UX
 */
export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  name,
  rules = [],
  helpText,
  showValidation = true,
  onValidation,
  className = '',
  ...inputProps
}) => {
  const [value, setValue] = useState(inputProps.value || '');
  const [touched, setTouched] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });

  useEffect(() => {
    if (inputProps.value !== undefined) {
      setValue(inputProps.value);
    }
  }, [inputProps.value]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setTouched(true);
    const result = validateField(value, rules);
    setValidation(result);
    onValidation?.(result.isValid);
    inputProps.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    
    // If already touched, revalidate immediately
    if (touched) {
      const result = validateField(e.target.value, rules);
      setValidation(result);
      onValidation?.(result.isValid);
    }
    
    inputProps.onChange?.(e);
  };

  const showError = touched && !validation.isValid;
  const showSuccess = touched && validation.isValid && rules.length > 0;

  return (
    <div className={className}>
      {/* Label */}
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {rules.some(r => r.required) && (
          <span className="text-red-500 ml-1" aria-label="required">*</span>
        )}
      </label>

      {/* Input with validation indicator */}
      <div className="relative">
        <input
          {...inputProps}
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`
            block w-full px-3 py-2 border rounded-lg shadow-sm
            focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors
            ${showError
              ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
              : showSuccess
              ? 'border-green-300 text-gray-900 focus:ring-green-500 focus:border-green-500'
              : 'border-gray-300 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'
            }
            ${showValidation && (showError || showSuccess) ? 'pr-10' : ''}
          `}
          aria-invalid={showError}
          aria-describedby={
            showError ? `${name}-error` : helpText ? `${name}-help` : undefined
          }
        />

        {/* Validation icon */}
        {showValidation && showError && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <XCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
          </div>
        )}

        {showValidation && showSuccess && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Error message */}
      {showError && (
        <p className="mt-1 text-sm text-red-600" id={`${name}-error`} role="alert">
          {validation.message}
        </p>
      )}

      {/* Help text */}
      {!showError && helpText && (
        <p className="mt-1 text-sm text-gray-500" id={`${name}-help`}>
          {helpText}
        </p>
      )}
    </div>
  );
};

interface ValidatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: string;
  rules?: ValidationRule[];
  helpText?: string;
  showValidation?: boolean;
  onValidation?: (isValid: boolean) => void;
}

/**
 * Textarea component with real-time validation
 */
export const ValidatedTextarea: React.FC<ValidatedTextareaProps> = ({
  label,
  name,
  rules = [],
  helpText,
  showValidation = true,
  onValidation,
  className = '',
  ...textareaProps
}) => {
  const [value, setValue] = useState(textareaProps.value || '');
  const [touched, setTouched] = useState(false);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true });

  useEffect(() => {
    if (textareaProps.value !== undefined) {
      setValue(textareaProps.value);
    }
  }, [textareaProps.value]);

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setTouched(true);
    const result = validateField(value, rules);
    setValidation(result);
    onValidation?.(result.isValid);
    textareaProps.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    
    if (touched) {
      const result = validateField(e.target.value, rules);
      setValidation(result);
      onValidation?.(result.isValid);
    }
    
    textareaProps.onChange?.(e);
  };

  const showError = touched && !validation.isValid;
  const showSuccess = touched && validation.isValid && rules.length > 0;

  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {rules.some(r => r.required) && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>

      <textarea
        {...textareaProps}
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`
          block w-full px-3 py-2 border rounded-lg shadow-sm
          focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors
          ${showError
            ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
            : showSuccess
            ? 'border-green-300 text-gray-900 focus:ring-green-500 focus:border-green-500'
            : 'border-gray-300 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'
          }
        `}
        aria-invalid={showError}
        aria-describedby={
          showError ? `${name}-error` : helpText ? `${name}-help` : undefined
        }
      />

      {showError && (
        <p className="mt-1 text-sm text-red-600" id={`${name}-error`} role="alert">
          {validation.message}
        </p>
      )}

      {!showError && helpText && (
        <p className="mt-1 text-sm text-gray-500" id={`${name}-help`}>
          {helpText}
        </p>
      )}
    </div>
  );
};

export default ValidatedInput;
