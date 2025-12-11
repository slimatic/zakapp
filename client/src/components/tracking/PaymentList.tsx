/**
 * PaymentList Component - T062
 * Lists payment records with filtering and categorization
 */

import React, { useState, useMemo } from 'react';
import { usePayments } from '../../hooks/usePayments';
import { useSnapshots } from '../../hooks/useZakatSnapshots';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import { Input } from '../ui/Input';
import { PaymentCard } from './PaymentCard';
import { PaymentDetailModal } from './PaymentDetailModal';
import { formatCurrency } from '../../utils/formatters';
import { useMaskedCurrency } from '../../contexts/PrivacyContext';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';
import type { NisabYearRecord } from '../../types/nisabYearRecord';

interface PaymentListProps {
  snapshotId?: string; // Made optional for "All Payments" view
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
  const maskedCurrency = useMaskedCurrency();
  
  // Filters state
  const [filters, setFilters] = useState({
    category: 'all',
    paymentMethod: 'all',
    search: '',
    startDate: '',
    endDate: ''
  });

  // Sorting state (T021)
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'created'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state (T022)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Detail modal state (T023)
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  // Fetch payments
  const { data, isLoading, error, refetch } = usePayments({
    snapshotId,
    category: filters.category === 'all' ? undefined : filters.category
  });

  // Fetch snapshots for Nisab Year context
  const { data: snapshotsData } = useSnapshots({ limit: 100 });

  const payments = data?.payments || [];

  // Create a map of snapshots by ID for quick lookup
  const snapshotsMap = useMemo(() => {
    const map = new Map();
    snapshotsData?.data?.records?.forEach((snapshot: NisabYearRecord) => {
      map.set(snapshot.id, snapshot);
    });
    return map;
  }, [snapshotsData]);

  // Sort and filter payments (T021)
  const sortedAndFilteredPayments = useMemo(() => {
    let filtered = [...payments];

    // Apply client-side filters
    if (filters.paymentMethod !== 'all') {
      filtered = filtered.filter(p => p.paymentMethod === filters.paymentMethod);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.recipientName.toLowerCase().includes(searchLower) ||
        p.notes?.toLowerCase().includes(searchLower) ||
        p.receiptReference?.toLowerCase().includes(searchLower)
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
          comparison = a.amount - b.amount;
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [payments, filters, sortBy, sortOrder]);

  // Paginate results (T022)
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
      // Toggle sort order if same field
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default descending order
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

  // Calculate totals using sorted/filtered payments
  const totalAmount = sortedAndFilteredPayments.reduce((sum: number, payment: PaymentRecord) => sum + payment.amount, 0);
  const categoryTotals = sortedAndFilteredPayments.reduce((acc: Record<string, number>, payment: PaymentRecord) => {
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
            {sortedAndFilteredPayments.length ? `${sortedAndFilteredPayments.length} payments` : 'Track your Zakat payments'}
            {hasActiveFilters && sortedAndFilteredPayments.length !== payments.length && (
              <span className="text-sm text-gray-500"> (filtered from {payments.length})</span>
            )}
          </p>
        </div>
        
        {onCreateNew && (
          <Button 
            onClick={onCreateNew}
          >
            Add Payment
          </Button>
        )}
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
              {maskedCurrency(formatCurrency(sortedAndFilteredPayments.length > 0 ? totalAmount / sortedAndFilteredPayments.length : 0))}
            </div>
          </div>
        </div>
      )}

      {/* Sorting Controls (T021) */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
        <span className="text-sm font-medium text-gray-700">Sort by:</span>
        
        <button
          onClick={() => handleSortChange('date')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            sortBy === 'date'
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
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            sortBy === 'amount'
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
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            sortBy === 'created'
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
                nisabYear={snapshotsMap.get(payment.snapshotId)}
                onEdit={onEditPayment}
                onDelete={onDeletePayment}
                onViewDetails={setSelectedPayment}
                compact={compact}
              />
            ))}
          </div>

          {/* Payment Detail Modal (T023) */}
          {selectedPayment && (
            <PaymentDetailModal
              payment={selectedPayment}
              nisabYear={snapshotsMap.get(selectedPayment.snapshotId)}
              onClose={() => setSelectedPayment(null)}
              onEdit={(payment) => {
                setSelectedPayment(null);
                onEditPayment?.(payment);
              }}
              onDelete={onDeletePayment}
            />
          )}

          {/* Pagination Controls (T022) */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, sortedAndFilteredPayments.length)} of {sortedAndFilteredPayments.length} payments
              </div>

              <div className="flex items-center gap-2">
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

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
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
                        className={`px-3 py-1 text-sm rounded ${
                          currentPage === pageNum
                            ? 'bg-green-600 text-white font-medium'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

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