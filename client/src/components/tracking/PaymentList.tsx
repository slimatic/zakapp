/**
 * PaymentList Component - T062
 * Lists payment records with filtering and categorization
 */

import React, { useState } from 'react';
import { usePayments } from '../../hooks/usePayments';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Input } from '../ui/Input';
import { formatCurrency } from '../../utils/formatters';
import { formatGregorianDate } from '../../utils/calendarConverter';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';

interface PaymentListProps {
  snapshotId: string;
  onCreateNew?: () => void;
  onEditPayment?: (payment: PaymentRecord) => void;
  onDeletePayment?: (paymentId: string) => void;
  compact?: boolean;
}

// Islamic recipient categories for filtering
const ZAKAT_RECIPIENTS = [
  { value: 'all', label: 'All Categories' },
  { value: 'fakir', label: 'Al-Fuqara (The Poor)' },
  { value: 'miskin', label: 'Al-Masakin (The Needy)' },
  { value: 'amil', label: 'Al-Amilin (Administrators)' },
  { value: 'muallaf', label: 'Al-Muallafah (New Muslims)' },
  { value: 'riqab', label: 'Ar-Riqab (Freeing Slaves)' },
  { value: 'gharimin', label: 'Al-Gharimin (Debt-ridden)' },
  { value: 'fisabilillah', label: 'Fi Sabilillah (In Allah\'s way)' },
  { value: 'ibnus_sabil', label: 'Ibn as-Sabil (Traveler)' }
];

const PAYMENT_METHODS = [
  { value: 'all', label: 'All Methods' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'check', label: 'Check' },
  { value: 'online', label: 'Online Payment' },
  { value: 'cryptocurrency', label: 'Cryptocurrency' },
  { value: 'other', label: 'Other' }
];

export const PaymentList: React.FC<PaymentListProps> = ({
  snapshotId,
  onCreateNew,
  onEditPayment,
  onDeletePayment,
  compact = false
}) => {
  // Filters state
  const [filters, setFilters] = useState({
    category: 'all',
    paymentMethod: 'all',
    search: '',
    startDate: '',
    endDate: ''
  });

  // Fetch payments
  const { data, isLoading, error, refetch } = usePayments({
    snapshotId,
    category: filters.category === 'all' ? undefined : filters.category
    // Note: Additional filters like paymentMethod, search, dates would need backend support
  });

  const payments = data?.payments || [];

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      paymentMethod: 'all',
      search: '',
      startDate: '',
      endDate: ''
    });
  };

  const hasActiveFilters = filters.category !== 'all' || 
                          filters.paymentMethod !== 'all' || 
                          filters.search || 
                          filters.startDate || 
                          filters.endDate;

  // Calculate totals
  const totalAmount = payments.reduce((sum: number, payment: PaymentRecord) => sum + payment.amount, 0);
  const categoryTotals = payments.reduce((acc: Record<string, number>, payment: PaymentRecord) => {
    acc[payment.recipientCategory] = (acc[payment.recipientCategory] || 0) + payment.amount;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorMessage error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className={compact ? 'text-lg font-semibold' : 'text-xl font-bold'}>
            Payment Records
          </h3>
          <p className="text-gray-600 mt-1">
            {payments.length ? `${payments.length} payments recorded` : 'Track your Zakat payments'}
          </p>
        </div>
        
        {onCreateNew && (
          <Button 
            onClick={onCreateNew}
            disabled={!snapshotId}
            title={!snapshotId ? 'Please select a snapshot first' : undefined}
          >
            Add Payment
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      {!compact && payments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm font-medium text-green-800">Total Paid</div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(totalAmount)}
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-800">Payment Count</div>
            <div className="text-2xl font-bold text-blue-900">
              {payments.length}
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm font-medium text-purple-800">Categories Used</div>
            <div className="text-2xl font-bold text-purple-900">
              {Object.keys(categoryTotals).length}
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-sm font-medium text-orange-800">Average Payment</div>
            <div className="text-2xl font-bold text-orange-900">
              {formatCurrency(totalAmount / payments.length)}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              {ZAKAT_RECIPIENTS.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <Input
              type="text"
              placeholder="Recipient, description..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      {/* Payment List */}
      {payments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
          <p className="text-gray-600 mb-4">
            {hasActiveFilters 
              ? 'No payments match your current filters.' 
              : 'Start recording your Zakat payments to track your giving.'}
          </p>
          {onCreateNew && (
            <Button onClick={onCreateNew}>
              Add Your First Payment
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Payment Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {payment.recipientName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {ZAKAT_RECIPIENTS.find(cat => cat.value === payment.recipientCategory)?.label}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatGregorianDate(new Date(payment.paymentDate))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      {PAYMENT_METHODS.find(method => method.value === payment.paymentMethod)?.label}
                    </span>

                    {payment.receiptReference && (
                      <span className="flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16l4-2 4 2V4M7 4h10M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h2" />
                        </svg>
                        Ref: {payment.receiptReference}
                      </span>
                    )}
                  </div>

                  {payment.notes && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      {payment.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {onEditPayment && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditPayment(payment)}
                    >
                      Edit
                    </Button>
                  )}
                  
                  {onDeletePayment && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeletePayment(payment.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};