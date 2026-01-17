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

/**
 * PaymentList Component (Local-First Refactor)
 * Lists payment records with filtering and categorization using RxDB
 */

import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { usePaymentRepository } from '../../hooks/usePaymentRepository';
import { useNisabRecordRepository } from '../../hooks/useNisabRecordRepository';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Input } from '../ui/Input';
import { PaymentCard } from './PaymentCard';
import { PaymentDetailModal } from './PaymentDetailModal';
import { formatCurrency } from '../../utils/formatters';
import { useMaskedCurrency } from '../../contexts/PrivacyContext';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';
import { Decimal } from 'decimal.js';


interface PaymentListProps {
  nisabRecordId?: string;
  snapshotId?: string; // Deprecated alias maintained for compatibility
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
  nisabRecordId,
  snapshotId,
  onCreateNew,
  onEditPayment,
  onDeletePayment,
  compact = false
}) => {
  const maskedCurrency = useMaskedCurrency();

  // Filters state
  const [filters, setFilters] = useState({
    category: 'all',
    paymentMethod: 'all',
    search: '',
    startDate: '',
    endDate: ''
  });

  // Sorting state
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'created'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Detail modal state
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  // Fetch payments locally
  const resolvedRecordId = nisabRecordId ?? snapshotId;
  const { payments: allPayments, isLoading, error } = usePaymentRepository();

  // Filter by snapshotId if provided
  const payments = useMemo(() => {
    if (!resolvedRecordId) return allPayments;
    return allPayments.filter(p => p.snapshotId === resolvedRecordId);
  }, [allPayments, resolvedRecordId]);

  // Fetch Nisab Year Records locally
  const { records: nisabRecordsData } = useNisabRecordRepository();

  // Create a map of Nisab Year Records by ID
  const nisabRecordMap = useMemo(() => {
    const map = new Map();
    nisabRecordsData.forEach((record) => {
      map.set(record.id, record);
    });
    return map;
  }, [nisabRecordsData]);

  // Helper to coerce possibly-missing or non-numeric amounts into a safe number
  const safeAmount = (p: PaymentRecord | any): number => {
    const raw = p?.amount;
    if (raw === null || raw === undefined) return 0;
    try {
      const dec = new Decimal(raw);
      return dec.isFinite() ? dec.toNumber() : 0;
    } catch {
      return 0;
    }
  };


  // Sort and filter payments
  const sortedAndFilteredPayments = useMemo(() => {
    let filtered = [...payments];

    // Filter by Category
    if (filters.category !== 'all') {
      // Some legacy logic used 'poor' instead of 'fakir', handle map mismatch if needed
      // But for now assumes standard values.
      filtered = filtered.filter(p => p.recipientCategory === filters.category);
    }

    // Apply client-side filters
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(p => p.paymentMethod === filters.paymentMethod);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.recipientName.toLowerCase().includes(searchLower) ||
        (p.notes || '').toLowerCase().includes(searchLower) ||
        (p.receiptReference || '').toLowerCase().includes(searchLower)
      );
    }

    if (filters.startDate) {
      filtered = filtered.filter(p =>
        new Date(p.paymentDate) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(p =>
        new Date(p.paymentDate) <= new Date(filters.endDate)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime();
          break;
        case 'amount':
          comparison = safeAmount(a) - safeAmount(b);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [payments, filters, sortBy, sortOrder]);

  // Paginate results
  const totalPages = Math.ceil(sortedAndFilteredPayments.length / itemsPerPage);
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedAndFilteredPayments.slice(startIndex, endIndex);
  }, [sortedAndFilteredPayments, currentPage, itemsPerPage]);

  // Reset to page 1 when filters or sorting changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortBy, sortOrder]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSortChange = (field: 'date' | 'amount' | 'created') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
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
  const totalAmount = sortedAndFilteredPayments.reduce((sum: Decimal, payment: PaymentRecord) => {
    return sum.plus(new Decimal(payment.amount || 0));
  }, new Decimal(0)).toNumber();

  const categoryTotals = sortedAndFilteredPayments.reduce((acc: Record<string, number>, payment: PaymentRecord) => {
    const cat = payment.recipientCategory || 'unknown';
    const amount = new Decimal(payment.amount || 0);
    acc[cat] = new Decimal(acc[cat] || 0).plus(amount).toNumber();
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
        <ErrorMessage error={error} onRetry={() => window.location.reload()} />
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
            {sortedAndFilteredPayments.length ? `${sortedAndFilteredPayments.length} payments` : 'Track your Zakat payments'}
            {hasActiveFilters && sortedAndFilteredPayments.length !== payments.length && (
              <span className="text-sm text-gray-500"> (filtered from {payments.length})</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (sortedAndFilteredPayments.length === 0) {
                toast.error('No payments to export');
                return;
              }

              try {
                const exportData = {
                  version: '1.0',
                  exportDate: new Date().toISOString(),
                  totalPayments: sortedAndFilteredPayments.length,
                  payments: sortedAndFilteredPayments.map((p: any) => ({
                    id: p.id,
                    paymentDate: p.paymentDate,
                    amount: p.amount,
                    currency: p.currency,
                    snapshotId: p.snapshotId,
                    recipientName: p.recipientName,
                    recipientCategory: p.recipientCategory,
                    notes: p.notes,
                    status: p.status
                  }))
                };

                const jsonContent = JSON.stringify(exportData, null, 2);
                const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
                const link = document.createElement('a');
                if (link.download !== undefined) {
                  const url = URL.createObjectURL(blob);
                  link.setAttribute('href', url);
                  link.setAttribute('download', `zakapp-payments-${new Date().toISOString().split('T')[0]}.json`);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }
              } catch (err) {
                toast.error('Failed to export payments.');
              }
            }}
          >
            Export JSON
          </Button>

          {onCreateNew && (
            <Button onClick={onCreateNew}>
              Add Payment
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {!compact && sortedAndFilteredPayments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm font-medium text-green-800">Total Paid</div>
            <div className="text-2xl font-bold text-green-900">
              {maskedCurrency(formatCurrency(totalAmount))}
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
              {maskedCurrency(formatCurrency(sortedAndFilteredPayments.length > 0 ? new Decimal(totalAmount).dividedBy(sortedAndFilteredPayments.length).toNumber() : 0))}
            </div>

          </div>
        </div>
      )}

      {/* Sorting Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
        <span className="text-sm font-medium text-gray-700">Sort by:</span>

        <button
          onClick={() => handleSortChange('date')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${sortBy === 'date'
            ? 'bg-green-100 text-green-800 font-medium'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Payment Date
          {sortBy === 'date' && (
            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
          )}
        </button>

        <button
          onClick={() => handleSortChange('amount')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${sortBy === 'amount'
            ? 'bg-green-100 text-green-800 font-medium'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Amount
          {sortBy === 'amount' && (
            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
          )}
        </button>

        <button
          onClick={() => handleSortChange('created')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${sortBy === 'created'
            ? 'bg-green-100 text-green-800 font-medium'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Created Date
          {sortBy === 'created' && (
            <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
          )}
        </button>

        <div className="ml-auto text-sm text-gray-600">
          {sortOrder === 'asc' ? 'Oldest first' : 'Newest first'}
        </div>
      </div>

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
      {sortedAndFilteredPayments.length === 0 ? (
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
        <>
          <div className="space-y-4">
            {paginatedPayments.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                nisabYear={nisabRecordMap.get(payment.snapshotId)}
                onEdit={onEditPayment}
                onDelete={onDeletePayment}
                onViewDetails={setSelectedPayment}
                compact={compact}
              />
            ))}
          </div>

          {/* Payment Detail Modal */}
          {selectedPayment && (
            <PaymentDetailModal
              payment={selectedPayment}
              nisabYear={nisabRecordMap.get(selectedPayment.snapshotId)}
              onClose={() => setSelectedPayment(null)}
              onEdit={(payment) => {
                setSelectedPayment(null);
                onEditPayment?.(payment);
              }}
              onDelete={onDeletePayment}
            />
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600 text-center sm:text-left">
                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedAndFilteredPayments.length)} of {sortedAndFilteredPayments.length} payments
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </Button>

                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm rounded ${currentPage === pageNum
                          ? 'bg-green-600 text-white font-medium'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Mobile Page indicator */}
                <span className="sm:hidden text-sm font-medium text-gray-700 flex items-center px-2">
                  {currentPage} / {totalPages}
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
