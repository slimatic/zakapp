import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePaymentRecords, useDeletePayment, PaymentFilters } from '../../hooks';
import { ZakatPayment } from '../../../shared/src/types';

/**
 * PaymentTracking Component - T024
 *
 * Displays a comprehensive table of Zakat payments with sorting, filtering,
 * and management actions. Includes payment recording functionality.
 */
const PaymentTracking: React.FC = () => {
  const [filters, setFilters] = useState<PaymentFilters>({
    year: new Date().getFullYear(),
    limit: 20
  });
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showRecordModal, setShowRecordModal] = useState(false);

  // Fetch payments with current filters
  const {
    data: paymentsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = usePaymentRecords(filters);

  // Delete payment mutation
  const deletePaymentMutation = useDeletePayment();

  // Flatten payments from all pages
  const allPayments = useMemo(() => {
    return paymentsData?.pages?.flatMap(page => page.data?.payments || []) || [];
  }, [paymentsData]);

  // Sort payments
  const sortedPayments = useMemo(() => {
    return [...allPayments].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [allPayments, sortField, sortDirection]);

  // Calculate totals
  const totalPaid = useMemo(() => {
    return sortedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
  }, [sortedPayments]);

  const handleSort = (field: 'date' | 'amount') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      try {
        await deletePaymentMutation.mutateAsync(paymentId);
      } catch (error) {
        console.error('Failed to delete payment:', error);
        alert('Failed to delete payment. Please try again.');
      }
    }
  };

  const handleDownloadReceipt = (payment: ZakatPayment) => {
    // This would typically call an API to generate/download a receipt
    alert('Receipt download functionality would be implemented here');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSortIcon = (field: 'date' | 'amount') => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Tracking</h1>
          <p className="text-gray-600">Track and manage your Zakat payments</p>
        </div>
        <Link
          to="/zakat/payments/new"
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Record Payment
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Paid ({filters.year})</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalPaid)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Number of Payments</div>
          <div className="text-2xl font-bold text-blue-600">
            {sortedPayments.length}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Average Payment</div>
          <div className="text-2xl font-bold text-purple-600">
            {sortedPayments.length > 0
              ? formatCurrency(totalPaid / sortedPayments.length)
              : formatCurrency(0)
            }
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={filters.year || ''}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                year: e.target.value ? parseInt(e.target.value) : undefined
              }))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Years</option>
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>{year}</option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient
            </label>
            <input
              type="text"
              placeholder="Filter by recipient..."
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              // Note: This would need to be implemented with proper filtering
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : sortedPayments.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-500 mb-4">
              {filters.year
                ? `No payments recorded for ${filters.year}.`
                : 'No payments have been recorded yet.'
              }
            </p>
            <Link
              to="/zakat/payments/new"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Record Your First Payment
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('date')}
                    >
                      Date {getSortIcon('date')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('amount')}
                    >
                      Amount {getSortIcon('amount')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Calculation ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedPayments.map((payment) => (
                    <tr key={payment.paymentId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.recipient || 'General donation'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {payment.calculationId?.slice(-8) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDownloadReceipt(payment)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Download Receipt"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                          </button>
                          <Link
                            to={`/zakat/payments/${payment.paymentId}/edit`}
                            className="text-green-600 hover:text-green-800"
                            title="Edit Payment"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleDeletePayment(payment.paymentId)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete Payment"
                            disabled={deletePaymentMutation.isPending}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="px-6 py-4 border-t border-gray-200 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {isFetchingNextPage ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentTracking;