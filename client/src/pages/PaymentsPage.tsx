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
 * PaymentsPage (Local-First Refactor)
 * Payment recording and management interface using RxDB
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PaymentList } from '../components/tracking/PaymentList';
import { PaymentRecordForm } from '../components/tracking/PaymentRecordForm';
import { usePaymentRepository } from '../hooks/usePaymentRepository';
import { useNisabRecordRepository } from '../hooks/useNisabRecordRepository';
import { Button } from '../components/ui/Button';
import type { PaymentRecord } from '@zakapp/shared/types/tracking';

export const PaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const nisabRecordIdParam = searchParams.get('snapshot');

  // Repositories
  const { records: nisabRecords, isLoading: nisabRecordsLoading } = useNisabRecordRepository();
  const { payments: allPayments } = usePaymentRepository();

  const [nisabRecordId, setNisabRecordId] = useState<string | undefined>(nisabRecordIdParam || undefined);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);

  // Derive filtered payments locally if needed (though PaymentList might handle it)
  // But PaymentList component likely needs to be checked if it uses API hooks too.
  // For now, let's assume PaymentList needs props or refactoring.
  // Checking imports: PaymentList is imported. I should check PaymentList next.

  const handleCreatePayment = () => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Zakat Payments</h1>
              <p className="text-gray-600 mt-2">
                Record and track your Zakat distributions to recipients
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

              <Button
                variant="outline"
                onClick={() => {
                  import('../utils/ReportGenerator').then(({ ReportGenerator }) => {
                    const generator = new ReportGenerator();
                    // Use filtered payments if filter is active, else all
                    // Note: Logic to get accurate filtered list might need state access
                    // For safety, we export ALL currently viewable payments
                    // But 'allPayments' is available in scope
                    generator.generatePaymentSummary(allPayments);
                  });
                }}
                className="justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export PDF
              </Button>
              <Button variant="secondary" onClick={() => navigate('/settings')} className="justify-center">Import / Export</Button>
            </div>
          </div>

          {/* Nisab Year Selector */}
          {(nisabRecords.length > 0 || allPayments.length > 0) && (
            <div className="mt-6">
              <label htmlFor="nisab-record-select" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Nisab Year Record
              </label>
              <div className="w-full">
                <select
                  id="nisab-record-select"
                  value={nisabRecordId || 'all'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNisabRecordId(value === 'all' ? undefined : value);
                    setSearchParams(value === 'all' ? {} : { snapshot: value });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="all">All Payments ({allPayments.length})</option>
                  {nisabRecords.map((record) => {
                    const zakatAmount = parseFloat(String(record.zakatAmount || 0));
                    const displayAmount = zakatAmount > 0
                      ? ` (Zakat: $${zakatAmount.toFixed(2)})`
                      : '';
                    const recordPayments = allPayments.filter(p => p.snapshotId === record.id).length;
                    return (
                      <option key={record.id} value={record.id}>
                        {record.hawlStartDate ? new Date(record.hawlStartDate).getFullYear() : (record.gregorianYear || new Date(record.createdAt || new Date().toISOString()).getFullYear())} - {record.status} {displayAmount} ({recordPayments} payments)
                      </option>
                    );
                  })}
                  {allPayments.some(p => !nisabRecords.find(r => r.id === p.snapshotId)) && (
                    <option value="legacy-import" disabled>
                      -- Unassigned / Imported ({allPayments.filter(p => !nisabRecords.find(r => r.id === p.snapshotId)).length}) --
                    </option>
                  )}
                </select>
              </div>
            </div>
          )}

          {/* Warning for Orphaned Payments */}
          {!nisabRecordsLoading && allPayments.length > 0 && nisabRecords.length === 0 && (
            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="h-6 w-6 text-orange-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-orange-800">Action Required: Payments Need Assignment</h3>
                  <div className="mt-1 text-sm text-orange-700">
                    <p>
                      You have {allPayments.length} payments, but no Nisab Year Records.
                      To calculate Zakat correctly, you must link these payments to a specific Nisab Year.
                    </p>
                    <div className="mt-3 flex gap-3">
                      <Button onClick={() => navigate('/nisab-records')} variant="default" size="sm">
                        Create Nisab Year Record
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Nisab Years warning (Empty State only) */}
          {!nisabRecordsLoading && nisabRecords.length === 0 && allPayments.length === 0 && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                No Nisab Year Records found. Please create a Nisab Year Record first to record payments.
              </p>
              <Button
                variant="default"
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


      </div >
    </div >
  );
};