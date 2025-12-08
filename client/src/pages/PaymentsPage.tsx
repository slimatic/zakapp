/**
 * PaymentsPage - T070
 * Payment recording and management interface
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PaymentList } from '../components/tracking/PaymentList';
import { PaymentRecordForm } from '../components/tracking/PaymentRecordForm';
import { usePayments } from '../hooks/usePayments';
import { useSnapshots } from '../hooks/useSnapshots';
import { Button } from '../components/ui/Button';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';

export const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const snapshotIdParam = searchParams.get('snapshot');
  
  // Fetch available Nisab Year Records
  const { data: snapshotsData, isLoading: snapshotsLoading } = useSnapshots();
  const [snapshotId, setSnapshotId] = useState<string | undefined>(snapshotIdParam || undefined);
  
  // Note: Auto-selection removed in T019 - defaults to "All Payments" view
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);

  const { data: paymentsData } = usePayments({ snapshotId });

  const handleCreatePayment = () => {
    // Allow creating payment even without specific Nisab Year selected
    // User will need to select it in the form
    setEditingPayment(null);
    setShowCreateForm(true);
  };

  const handleEditPayment = (payment: PaymentRecord) => {
    setEditingPayment(payment);
    setShowCreateForm(true);
  };

  const handleFormClose = () => {
    setShowCreateForm(false);
    setEditingPayment(null);
  };

  const totalPaid = paymentsData?.payments.reduce((sum, p) => sum + p.amount, 0) || 0;
  const paymentCount = paymentsData?.payments.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Zakat Payments</h1>
              <p className="text-gray-600 mt-2">
                Record and track your Zakat distributions to recipients
              </p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/tracking')}>
              ← Back to Dashboard
            </Button>
          </div>

          {/* Nisab Year Selector */}
          {snapshotsData?.snapshots && snapshotsData.snapshots.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Nisab Year
              </label>
              <select
                value={snapshotId || ''}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSnapshotId(newId || undefined);
                  if (newId) {
                    setSearchParams({ snapshot: newId });
                  } else {
                    setSearchParams({});
                  }
                }}
                className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">All Payments</option>
                {snapshotsData.snapshots.map((snapshot) => (
                  <option key={snapshot.id} value={snapshot.id}>
                    {new Date(snapshot.calculationDate).getFullYear()} - {snapshot.status}
                    {snapshot.zakatAmount ? ` (Zakat: $${snapshot.zakatAmount.toFixed(2)})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* No Nisab Years warning */}
          {!snapshotsLoading && (!snapshotsData?.snapshots || snapshotsData.snapshots.length === 0) && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                No Nisab Year Records found. Please create a Nisab Year Record first to record payments.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/tracking')}
                className="mt-3"
              >
                Go to Tracking Dashboard
              </Button>
            </div>
          )}
        </div>

        {/* Summary Stats - Compact Design */}
        {paymentsData?.payments && paymentsData.payments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 divide-x divide-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Total Paid</p>
                <p className="text-lg font-bold text-gray-900">
                  ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Records</p>
                <p className="text-lg font-bold text-gray-900">{paymentCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Average</p>
                <p className="text-lg font-bold text-gray-900">
                  ${(paymentCount > 0 ? totalPaid / paymentCount : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingPayment ? 'Edit Payment Record' : 'Record New Payment'}
                  </h2>
                  <button
                    onClick={handleFormClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <PaymentRecordForm
                  payment={editingPayment || undefined}
                  snapshotId={snapshotId}
                  onSuccess={handleFormClose}
                  onCancel={handleFormClose}
                />
              </div>
            </div>
          </div>
        )}

        {/* Payment List */}
        <PaymentList
          snapshotId={snapshotId}
          onCreateNew={handleCreatePayment}
          onEditPayment={handleEditPayment}
        />

        {/* Help Section */}
        <div className="mt-12 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                About Zakat Payments & Recipients
              </h3>
              <div className="text-sm text-green-700 mt-2 space-y-2">
                <p>
                  Islamic law specifies <strong>8 categories</strong> of eligible Zakat recipients as mentioned in Quran 9:60:
                </p>
                <ol className="list-decimal list-inside space-y-1 mt-2 ml-2">
                  <li><strong>Al-Fuqara (The Poor)</strong> - Those with little to no income or means</li>
                  <li><strong>Al-Masakin (The Needy)</strong> - Those in need but not as destitute as the poor</li>
                  <li><strong>Zakat Administrators</strong> - Those who collect and distribute Zakat</li>
                  <li><strong>New Muslims</strong> - Recent converts who need support</li>
                  <li><strong>Slaves/Captives</strong> - To free slaves (historically relevant)</li>
                  <li><strong>Debtors</strong> - Those unable to pay off their debts</li>
                  <li><strong>In the Path of Allah</strong> - For Islamic causes and propagation</li>
                  <li><strong>Travelers</strong> - Stranded travelers in need of assistance</li>
                </ol>
                <p className="mt-3">
                  <strong>Important:</strong> Zakat cannot be given to parents, grandparents, children, grandchildren, 
                  or spouses. It's recommended to give locally and to verify the legitimacy of recipients or organizations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};