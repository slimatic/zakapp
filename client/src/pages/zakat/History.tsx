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

import React, { useState } from 'react';
import { useZakatHistory, useZakatPayments } from '../../services/apiHooks';
import { Button, LoadingSpinner, ErrorMessage } from '../../components/ui';
import { CalculationHistory } from '../../components/zakat/CalculationHistory';

interface ZakatCalculation {
  id: string;
  name: string;
  calculationDate: string;
  methodology: string;
  summary: {
    totalAssets: number;
    zakatAmount: number;
    isZakatObligatory: boolean;
  };
  status: 'saved' | 'paid' | 'partial';
  createdAt: string;
}

interface ZakatPayment {
  id: string;
  calculationId: string;
  amount: number;
  paymentDate: string;
  recipient: string;
  method: string;
  notes?: string;
  receiptUrl?: string;
  status: 'completed' | 'pending' | 'failed';
}

interface YearlySnapshot {
  year: number;
  totalAssets: number;
  zakatAmount: number;
  isPaid: boolean;
  calculationsCount: number;
  paymentsCount: number;
  averageAssetValue: number;
}

/**
 * Zakat History & Tracking Page
 * Comprehensive calculation history, Nisab Year Records, payment tracking,
 * and historical trend analysis with visualizations
 */
export const History: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calculations' | 'payments' | 'yearly' | 'reminders'>('calculations');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filterMethodology, setFilterMethodology] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // API hooks
  const { data: historyData, isLoading: historyLoading, error: historyError } = useZakatHistory();
  const { data: paymentsData, isLoading: paymentsLoading } = useZakatPayments();

  // Mock data for now - replace with actual API data
  const mockCalculations: ZakatCalculation[] = [
    {
      id: '1',
      name: 'Ramadan 2024 Calculation',
      calculationDate: '2024-03-15',
      methodology: 'standard',
      summary: {
        totalAssets: 45000,
        zakatAmount: 1125,
        isZakatObligatory: true
      },
      status: 'paid',
      createdAt: '2024-03-15T10:30:00Z'
    },
    {
      id: '2',
      name: 'Year End 2023 Assessment',
      calculationDate: '2023-12-31',
      methodology: 'hanafi',
      summary: {
        totalAssets: 38500,
        zakatAmount: 962.50,
        isZakatObligatory: true
      },
      status: 'partial',
      createdAt: '2023-12-31T15:45:00Z'
    },
    {
      id: '3',
      name: 'Mid-Year Check 2023',
      calculationDate: '2023-06-15',
      methodology: 'standard',
      summary: {
        totalAssets: 35000,
        zakatAmount: 875,
        isZakatObligatory: true
      },
      status: 'saved',
      createdAt: '2023-06-15T09:20:00Z'
    }
  ];

  const mockPayments: ZakatPayment[] = [
    {
      id: '1',
      calculationId: '1',
      amount: 1125,
      paymentDate: '2024-03-20',
      recipient: 'Local Islamic Charity',
      method: 'Bank Transfer',
      notes: 'Full Zakat payment for Ramadan 2024',
      status: 'completed'
    },
    {
      id: '2',
      calculationId: '2',
      amount: 500,
      paymentDate: '2024-01-15',
      recipient: 'Masjid Al-Noor',
      method: 'Cash',
      notes: 'Partial payment - remaining $462.50',
      status: 'completed'
    }
  ];

  const mockYearlySnapshots: YearlySnapshot[] = [
    {
      year: 2024,
      totalAssets: 45000,
      zakatAmount: 1125,
      isPaid: true,
      calculationsCount: 2,
      paymentsCount: 1,
      averageAssetValue: 45000
    },
    {
      year: 2023,
      totalAssets: 38500,
      zakatAmount: 962.50,
      isPaid: false,
      calculationsCount: 3,
      paymentsCount: 1,
      averageAssetValue: 36500
    },
    {
      year: 2022,
      totalAssets: 32000,
      zakatAmount: 800,
      isPaid: true,
      calculationsCount: 2,
      paymentsCount: 2,
      averageAssetValue: 31000
    }
  ];

  // Helper functions
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      saved: 'bg-gray-100 text-gray-800',
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string): string => {
    const icons = {
      paid: '✅',
      partial: '⏳',
      saved: '💾',
      completed: '✅',
      pending: '⏳',
      failed: '❌'
    };
    return icons[status as keyof typeof icons] || '📄';
  };

  const getMethodologyIcon = (methodology: string): string => {
    const icons = {
      standard: '⚖️',
      hanafi: '🕌',
      shafi: '📖',
      custom: '⚙️'
    };
    return icons[methodology as keyof typeof icons] || '⚖️';
  };

  const filteredCalculations = mockCalculations.filter(calc => {
    const matchesSearch = calc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMethodology = filterMethodology === 'all' || calc.methodology === filterMethodology;
    const matchesStatus = filterStatus === 'all' || calc.status === filterStatus;
    return matchesSearch && matchesMethodology && matchesStatus;
  });

  const getTotalZakatThisYear = (): number => {
    const currentYear = new Date().getFullYear();
    return mockCalculations
      .filter(calc => new Date(calc.calculationDate).getFullYear() === currentYear)
      .reduce((sum, calc) => sum + calc.summary.zakatAmount, 0);
  };

  const getTotalPaidThisYear = (): number => {
    const currentYear = new Date().getFullYear();
    return mockPayments
      .filter(payment => new Date(payment.paymentDate).getFullYear() === currentYear)
      .reduce((sum, payment) => sum + payment.amount, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Zakat History & Tracking</h1>
              <p className="mt-2 text-lg text-gray-600">
                Track your Zakat calculations, payments, and spiritual journey
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => window.open('/api/zakat/export', '_blank')}
                variant="secondary"
              >
                Export All Data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">This Year's Obligation</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency(getTotalZakatThisYear())}
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Paid This Year</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(getTotalPaidThisYear())}
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Remaining</div>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {formatCurrency(getTotalZakatThisYear() - getTotalPaidThisYear())}
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Total Calculations</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {mockCalculations.length}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              {[
                { id: 'calculations', label: 'Calculations', icon: '🧮' },
                { id: 'payments', label: 'Payments', icon: '💳' },
                { id: 'yearly', label: 'Yearly Overview', icon: '📊' },
                { id: 'reminders', label: 'Reminders', icon: '⏰' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Calculations Tab */}
            {activeTab === 'calculations' && (
              <CalculationHistory />
            )}

            {/* Payments Tab - Keep existing implementation */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-64">
                    <input
                      type="text"
                      placeholder="Search calculations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={filterMethodology}
                    onChange={(e) => setFilterMethodology(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Methodologies</option>
                    <option value="standard">Standard</option>
                    <option value="hanafi">Hanafi</option>
                    <option value="shafi">Shafi'i</option>
                    <option value="custom">Custom</option>
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="saved">Saved</option>
                    <option value="partial">Partially Paid</option>
                    <option value="paid">Fully Paid</option>
                  </select>
                </div>

                {/* Calculations List */}
                <div className="space-y-4">
                  {filteredCalculations.map((calculation) => (
                    <div key={calculation.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="text-2xl">{getMethodologyIcon(calculation.methodology)}</div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {calculation.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Calculated on {formatDate(calculation.calculationDate)} 
                              using {calculation.methodology} methodology
                            </p>
                            
                            <div className="flex items-center space-x-4 mt-3">
                              <div className="text-sm">
                                <span className="font-medium text-gray-600">Total Assets:</span>
                                <span className="ml-2 font-bold text-gray-900">
                                  {formatCurrency(calculation.summary.totalAssets)}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium text-gray-600">Zakat Amount:</span>
                                <span className="ml-2 font-bold text-blue-600">
                                  {formatCurrency(calculation.summary.zakatAmount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(calculation.status)}`}>
                            {getStatusIcon(calculation.status)} {calculation.status}
                          </span>
                          <Button size="sm" variant="secondary">
                            View Details
                          </Button>
                          <Button size="sm" variant="secondary">
                            Recalculate
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                  <Button>Add Payment Record</Button>
                </div>

                <div className="space-y-4">
                  {mockPayments.map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {formatCurrency(payment.amount)}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                              {getStatusIcon(payment.status)} {payment.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Date:</span>
                              <div>{formatDate(payment.paymentDate)}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Recipient:</span>
                              <div>{payment.recipient}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Method:</span>
                              <div>{payment.method}</div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Receipt:</span>
                              <div>
                                {payment.receiptUrl ? (
                                  <a href={payment.receiptUrl} className="text-blue-600 hover:underline">
                                    View Receipt
                                  </a>
                                ) : (
                                  <span className="text-gray-400">No receipt</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {payment.notes && (
                            <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                              <span className="font-medium text-gray-600">Notes:</span>
                              <p className="text-gray-700 mt-1">{payment.notes}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-4">
                          <Button size="sm" variant="secondary">
                            Edit
                          </Button>
                          {payment.receiptUrl && (
                            <Button size="sm" variant="secondary">
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Yearly Overview Tab */}
            {activeTab === 'yearly' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Nisab Year Records</h3>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {[2024, 2023, 2022, 2021, 2020].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Yearly trend visualization placeholder */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">
                    📈 Wealth & Zakat Trend
                  </h4>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    [Chart visualization would go here - showing wealth growth and Zakat payments over time]
                  </div>
                </div>

                {/* Nisab Year Records table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Year</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Total Assets</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Zakat Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Payment Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Calculations</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Growth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {mockYearlySnapshots.map((snapshot, index) => {
                        const previousYear = mockYearlySnapshots[index + 1];
                        const growth = previousYear ? 
                          ((snapshot.totalAssets - previousYear.totalAssets) / previousYear.totalAssets * 100) : 0;
                        
                        return (
                          <tr key={snapshot.year}>
                            <td className="py-3 px-4 font-medium text-gray-900">
                              {snapshot.year}
                            </td>
                            <td className="py-3 px-4">
                              {formatCurrency(snapshot.totalAssets)}
                            </td>
                            <td className="py-3 px-4 font-medium">
                              {formatCurrency(snapshot.zakatAmount)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                snapshot.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {snapshot.isPaid ? '✅ Paid' : '❌ Unpaid'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {snapshot.calculationsCount} calculations
                            </td>
                            <td className="py-3 px-4">
                              {previousYear && (
                                <span className={`font-medium ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {growth >= 0 ? '↗' : '↘'} {Math.abs(growth).toFixed(1)}%
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reminders Tab */}
            {activeTab === 'reminders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Zakat Reminders & Schedule</h3>
                  <Button>Set New Reminder</Button>
                </div>

                {/* Current reminders */}
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">⏰</div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-yellow-900">
                          Ramadan 2025 Reminder
                        </h4>
                        <p className="text-yellow-800 mt-1">
                          Calculate and pay your Zakat before Ramadan begins
                        </p>
                        <div className="text-sm text-yellow-700 mt-2">
                          Due: March 1, 2025 • 45 days remaining
                        </div>
                      </div>
                      <Button size="sm" variant="secondary">
                        Edit
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">📅</div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-blue-900">
                          Annual Review Reminder
                        </h4>
                        <p className="text-blue-800 mt-1">
                          Review and update your asset portfolio for accurate calculations
                        </p>
                        <div className="text-sm text-blue-700 mt-2">
                          Due: December 31, 2024 • Monthly reminder
                        </div>
                      </div>
                      <Button size="sm" variant="secondary">
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Islamic calendar dates */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h4 className="text-lg font-medium text-green-900 mb-4">
                    🌙 Important Islamic Dates for Zakat
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-green-800">Ramadan 2025:</div>
                      <div className="text-green-700">February 28 - March 30, 2025</div>
                    </div>
                    <div>
                      <div className="font-medium text-green-800">Last 10 Nights:</div>
                      <div className="text-green-700">March 20-30, 2025 (Prime time for Zakat)</div>
                    </div>
                    <div>
                      <div className="font-medium text-green-800">Dhul Hijjah 2025:</div>
                      <div className="text-green-700">June 6 - July 5, 2025</div>
                    </div>
                    <div>
                      <div className="font-medium text-green-800">Day of Arafah:</div>
                      <div className="text-green-700">July 15, 2025</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};