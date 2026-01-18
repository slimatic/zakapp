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
import { ZakatPayment } from '../../types';
import { apiService } from '../../services/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  zakatAmount: number;
  currency: string;
  onPaymentRecorded: (payment: ZakatPayment) => void;
  methodology?: string;
}

interface ValidationErrors {
  amount?: string;
  date?: string;
  recipient?: string;
  method?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  zakatAmount = 0,
  currency = 'USD',
  onPaymentRecorded,
  methodology = 'standard'
}) => {
  const [formData, setFormData] = useState({
    amount: (zakatAmount || 0).toString(),
    date: new Date().toISOString().split('T')[0],
    recipient: '',
    method: 'cash',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showEducationalContent, setShowEducationalContent] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        amount: (zakatAmount || 0).toString(),
        date: new Date().toISOString().split('T')[0],
        recipient: '',
        method: 'cash',
        notes: ''
      });
      setError(null);
      setValidationErrors({});
    }
  }, [isOpen, zakatAmount]);

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Amount validation
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      errors.amount = 'Amount must be a positive number';
    } else if (amount > zakatAmount * 2) {
      errors.amount = 'Amount seems unusually high compared to calculated Zakat';
    }

    // Date validation
    const paymentDate = new Date(formData.date);
    const today = new Date();
    if (paymentDate > today) {
      errors.date = 'Payment date cannot be in the future';
    }

    // Method validation
    if (!formData.method) {
      errors.method = 'Payment method is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      setError('Please correct the errors below');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        methodology
      };

      const response = await apiService.recordPayment(paymentData);

      if (response.success && response.data) {
        onPaymentRecorded(response.data);
        onClose();
        // Form will be reset by useEffect when modal reopens
      } else {
        setError(response.message || 'Failed to record payment. Please try again.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record payment';
      setError(`Network error: ${errorMessage}. Please check your connection and try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const getEducationalContent = () => {
    const content = {
      standard: {
        title: "Zakat Payment Guidelines (Standard Method)",
        guidelines: [
          "Pay your Zakat as soon as it becomes due",
          "Ensure recipients are eligible according to Islamic law",
          "Consider local needs and most deserving cases",
          "Keep records for your own accountability"
        ]
      },
      hanafi: {
        title: "Zakat Payment Guidelines (Hanafi School)",
        guidelines: [
          "Follow Hanafi jurisprudence for recipient categories",
          "Local poor and needy have priority in distribution",
          "Consider family and community needs first",
          "Document payments for spiritual accountability"
        ]
      },
      shafii: {
        title: "Zakat Payment Guidelines (Shafi'i School)",
        guidelines: [
          "Distribute according to Shafi'i methodology",
          "Eight categories of recipients as per Quran",
          "Equal distribution not required, based on need",
          "Maintain sincerity and humility in giving"
        ]
      }
    };

    return content[methodology as keyof typeof content] || content.standard;
  };

  if (!isOpen) return null;

  const formatCurrency = (amount: number, curr: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-w-md">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Record Zakat Payment</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Educational Content Toggle */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowEducationalContent(!showEducationalContent)}
              className="flex items-center text-sm text-green-600 hover:text-green-800"
            >
              <svg className={`w-4 h-4 mr-1 transform transition-transform ${showEducationalContent ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              {showEducationalContent ? 'Hide' : 'Show'} Payment Guidelines
            </button>

            {showEducationalContent && (
              <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-md">
                <h4 className="text-sm font-medium text-green-800 mb-2">
                  {getEducationalContent().title}
                </h4>
                <ul className="text-sm text-green-700 space-y-1">
                  {getEducationalContent().guidelines.map((guideline, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {guideline}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                Payment Amount *
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">{currency}</span>
                </div>
                <input
                  type="number"
                  name="amount"
                  id="amount"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  onFocus={(e) => e.target.select()}
                  className={`block w-full pl-12 pr-12 border rounded-md focus:ring-green-500 focus:border-green-500 sm:text-sm ${validationErrors.amount ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="0.00"
                  aria-describedby="amount-error"
                />
              </div>
              {validationErrors.amount && (
                <p className="mt-1 text-sm text-red-600" id="amount-error">
                  {validationErrors.amount}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Calculated Zakat: {formatCurrency(zakatAmount, currency)}
              </p>
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                Payment Date *
              </label>
              <input
                type="date"
                name="date"
                id="date"
                required
                value={formData.date}
                onChange={handleChange}
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm ${validationErrors.date ? 'border-red-300' : 'border-gray-300'
                  }`}
                aria-describedby="date-error"
              />
              {validationErrors.date && (
                <p className="mt-1 text-sm text-red-600" id="date-error">
                  {validationErrors.date}
                </p>
              )}
            </div>

            {/* Recipient */}
            <div>
              <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">
                Recipient (Optional)
              </label>
              <input
                type="text"
                name="recipient"
                id="recipient"
                value={formData.recipient}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="e.g., Local Mosque, Charity Organization"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label htmlFor="method" className="block text-sm font-medium text-gray-700">
                Payment Method *
              </label>
              <select
                name="method"
                id="method"
                value={formData.method}
                onChange={handleChange}
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm ${validationErrors.method ? 'border-red-300' : 'border-gray-300'
                  }`}
                aria-describedby="method-error"
              >
                <option value="">Select payment method</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="check">Check</option>
                <option value="online">Online Payment</option>
                <option value="cryptocurrency">Cryptocurrency</option>
                <option value="other">Other</option>
              </select>
              {validationErrors.method && (
                <p className="mt-1 text-sm text-red-600" id="method-error">
                  {validationErrors.method}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Any additional notes about this payment..."
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Recording...
                  </div>
                ) : (
                  'Record Payment'
                )}
              </button>
            </div>
          </form>

          {/* Islamic Reminder */}
          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">
              <strong>Reminder:</strong> Zakat should be paid as soon as possible after it becomes due.
              May Allah accept your charity and increase your blessings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};