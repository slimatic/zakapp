import React from 'react';
import { Link } from 'react-router-dom';
import { usePaymentRecords, usePaymentSummary } from '../../hooks/usePaymentRecords';
import { useRecentSnapshots } from '../../hooks/useZakatSnapshots';

/**
 * Zakat Dashboard Page - Main dashboard for Zakat management
 *
 * Displays key Zakat metrics, recent activity, and quick actions.
 * Provides centralized access to all Zakat-related functionality.
 */
const ZakatDashboard: React.FC = () => {
  // Fetch recent payments
  const { data: paymentsData, isLoading: paymentsLoading } = usePaymentRecords({
    limit: 5,
    page: 1
  });

  // Fetch payment summary for current year
  const currentYear = new Date().getFullYear();
  const { data: paymentSummary, isLoading: summaryLoading } = usePaymentSummary(currentYear);

  // Fetch recent snapshots
  const { data: recentSnapshots, isLoading: snapshotsLoading } = useRecentSnapshots(3);

  // Calculate derived values (placeholder values since we don't have latest calculation)
  const totalPaid = paymentSummary?.data?.totalPaid || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Zakat Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Track your Zakat obligations and manage your charitable giving
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Zakat Owed Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Zakat Owed</p>
                <p className="text-2xl font-bold text-gray-900">
                  Calculate to see amount
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Run a Zakat calculation to view your obligation
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Paid Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Paid This Year</p>
                <p className="text-2xl font-bold text-green-600">
                  {summaryLoading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                  ) : (
                    `$${totalPaid.toLocaleString()}`
                  )}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Remaining Balance Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remaining Balance</p>
                <p className={`text-2xl font-bold text-gray-900`}>
                  Calculate Zakat first
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Complete a calculation to track your balance
                </p>
              </div>
              <div className={`p-3 rounded-full bg-gray-100`}>
                <svg className={`w-6 h-6 text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/zakat/calculator"
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calculate Zakat
            </Link>
            <Link
              to="/zakat/payments/new"
              className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Record Payment
            </Link>
            <Link
              to="/zakat/snapshots/new"
              className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Create Snapshot
            </Link>
          </div>
        </div>

        {/* Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Payments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
              <Link
                to="/zakat/payments"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all
              </Link>
            </div>
            {paymentsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-3">
                    <div className="bg-gray-200 h-4 w-4 rounded-full"></div>
                    <div className="bg-gray-200 h-4 flex-1 rounded"></div>
                    <div className="bg-gray-200 h-4 w-16 rounded"></div>
                  </div>
                ))}
              </div>
            ) : paymentsData?.pages?.[0]?.success && paymentsData.pages[0].data?.payments?.length ? (
              <div className="space-y-3">
                {paymentsData.pages[0].data.payments.slice(0, 5).map((payment: any) => (
                  <div key={payment.paymentId} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          ${payment.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(payment.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {payment.recipient || 'General donation'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No payments recorded yet</p>
            )}
          </div>

          {/* Recent Calculations/Snapshots */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Snapshots</h2>
              <Link
                to="/zakat/snapshots"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all
              </Link>
            </div>
            {snapshotsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-3">
                    <div className="bg-gray-200 h-4 w-4 rounded-full"></div>
                    <div className="bg-gray-200 h-4 flex-1 rounded"></div>
                    <div className="bg-gray-200 h-4 w-16 rounded"></div>
                  </div>
                ))}
              </div>
            ) : recentSnapshots?.data?.snapshots?.length ? (
              <div className="space-y-3">
                {recentSnapshots.data.snapshots.map((snapshot: any) => (
                  <div key={snapshot.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          ${snapshot.zakatDue?.toLocaleString() || 'N/A'} Zakat
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(snapshot.calculationDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 capitalize">
                      {snapshot.methodology}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No snapshots created yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZakatDashboard;