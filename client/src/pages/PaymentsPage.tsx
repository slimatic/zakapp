/**
 * PaymentsPage - T070
 * Payment recording and management interface
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PaymentList } from '../components/tracking/PaymentList';
import { PaymentRecordForm } from '../components/tracking/PaymentRecordForm';
import { usePayments } from '../hooks/usePayments';
import { useNisabYearRecords } from '../hooks/useNisabYearRecords';
import { Button } from '../components/ui/Button';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';

export const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const nisabRecordIdParam = searchParams.get('snapshot');
  
  // Fetch available Nisab Year Records
  const { data: nisabRecordsData, isLoading: nisabRecordsLoading } = useNisabYearRecords();
  const [nisabRecordId, setNisabRecordId] = useState<string | undefined>(nisabRecordIdParam || undefined);
  
  // Note: Auto-selection removed in T019 - defaults to "All Payments" view
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);

  const { data: paymentsData } = usePayments({ snapshotId: nisabRecordId });
  
  // Extract records array from API response
  const nisabRecords = nisabRecordsData?.records || [];

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

  const safeAmount = (p: any) => {
    const raw = p?.amount;
    if (raw === null || raw === undefined) return 0;
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
    return Number.isFinite(num) ? num : 0;
  };

  const totalPaid = paymentsData?.payments?.reduce((sum: number, p: any) => sum + safeAmount(p), 0) || 0;
  const paymentCount = paymentsData?.payments?.length || 0;

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
            <div className="flex items-center space-x-3">
              <Button variant="secondary" onClick={() => navigate('/dashboard')}>← Back to Dashboard</Button>
              <Button variant="secondary" onClick={() => navigate('/payments/import-export')}>Import / Export</Button>
            </div>
          </div>

          {/* Nisab Year Selector */}
          {nisabRecords && nisabRecords.length > 0 && (
            <div>
              <label htmlFor="nisab-record-select" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Nisab Year Record
              </label>
              <select
                id="nisab-record-select"
                value={nisabRecordId || 'all'}
                onChange={(e) => {
                  const value = e.target.value;
                  setNisabRecordId(value === 'all' ? undefined : value);
                  setSearchParams(value === 'all' ? {} : { snapshot: value });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Payments</option>
                {nisabRecords.map((record: any) => {
                  // Parse zakatAmount - it might be encrypted string or number
                  const zakatAmount = typeof record.zakatAmount === 'string' 
                    ? parseFloat(record.zakatAmount) 
                    : record.zakatAmount;
                  const displayAmount = zakatAmount && !isNaN(zakatAmount) 
                    ? ` (Zakat: $${zakatAmount.toFixed(2)})` 
                    : '';
                  
                  return (
                    <option key={record.id} value={record.id}>
                      {record.calculationDate ? new Date(record.calculationDate).getFullYear() : 'N/A'} - {record.status}
                      {displayAmount}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* No Nisab Years warning */}
          {!nisabRecordsLoading && nisabRecords.length === 0 && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                No Nisab Year Records found. Please create a Nisab Year Record first to record payments.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/dashboard')}
                className="mt-3"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {editingPayment ? 'Edit Payment Record' : 'Record New Payment'}
                  </h2>
                  <button
                    onClick={handleFormClose}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    aria-label="Close modal"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <PaymentRecordForm
                  payment={editingPayment || undefined}
                  nisabRecordId={nisabRecordId}
                  onSuccess={handleFormClose}
                  onCancel={handleFormClose}
                />
              </div>
            </div>
          </div>
        )}

        {/* Payment List */}
        <PaymentList
          nisabRecordId={nisabRecordId}
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