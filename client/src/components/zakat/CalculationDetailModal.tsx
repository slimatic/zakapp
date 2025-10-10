import React, { useState } from 'react';
import { format } from 'date-fns';

interface Calculation {
  id: string;
  methodology: string;
  calendarType: string;
  calculationDate: string;
  totalWealth: number;
  nisabThreshold: number;
  zakatDue: number;
  zakatRate: number;
  assetBreakdown: Record<string, any>;
  notes?: string;
  metadata?: any;
}

interface CalculationDetailModalProps {
  calculation: Calculation;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onExport?: (calculation: Calculation) => void;
  onUpdateNotes?: (id: string, notes: string) => void;
}

export const CalculationDetailModal: React.FC<CalculationDetailModalProps> = ({
  calculation,
  isOpen,
  onClose,
  onDelete,
  onExport,
  onUpdateNotes
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState(calculation.notes || '');
  const [activeTab, setActiveTab] = useState<'summary' | 'breakdown' | 'details'>('summary');

  if (!isOpen) return null;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatMethodology = (methodology: string): string => {
    const names: Record<string, string> = {
      'standard': 'Standard (AAOIFI)',
      'hanafi': 'Hanafi',
      'shafi': "Shafi'i",
      'custom': 'Custom'
    };
    return names[methodology] || methodology;
  };

  const handleSaveNotes = () => {
    if (onUpdateNotes) {
      onUpdateNotes(calculation.id, notes);
    }
    setIsEditingNotes(false);
  };

  const handleExport = () => {
    if (onExport) {
      onExport(calculation);
    }
  };

  const handleDelete = () => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure you want to delete this calculation? This action cannot be undone.')) {
      if (onDelete) {
        onDelete(calculation.id);
      }
      onClose();
    }
  };

  const isAboveNisab = calculation.totalWealth >= calculation.nisabThreshold;
  const percentageAboveNisab = ((calculation.totalWealth / calculation.nisabThreshold - 1) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Calculation Details
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {format(new Date(calculation.calculationDate), 'PPPP')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              aria-label="Close modal"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mt-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('summary')}
              className={`pb-3 px-1 font-medium text-sm transition-colors ${
                activeTab === 'summary'
                  ? 'border-b-2 border-green-600 text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('breakdown')}
              className={`pb-3 px-1 font-medium text-sm transition-colors ${
                activeTab === 'breakdown'
                  ? 'border-b-2 border-green-600 text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Asset Breakdown
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`pb-3 px-1 font-medium text-sm transition-colors ${
                activeTab === 'details'
                  ? 'border-b-2 border-green-600 text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Details
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Status Card */}
              <div className={`rounded-lg p-6 ${
                isAboveNisab 
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                  : 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {isAboveNisab ? 'Zakat Obligatory' : 'Below Nisab Threshold'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {isAboveNisab 
                        ? `Your wealth is ${percentageAboveNisab}% above nisab` 
                        : 'No Zakat obligation for this calculation'}
                    </p>
                  </div>
                  <div className={`text-3xl ${isAboveNisab ? 'text-green-600' : 'text-gray-400'}`}>
                    {isAboveNisab ? '✓' : '○'}
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Methodology</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                    {formatMethodology(calculation.methodology)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {calculation.calendarType === 'hijri' ? 'Islamic Calendar' : 'Gregorian Calendar'}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Zakat Rate</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                    {calculation.zakatRate}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Standard rate for wealth
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-600 dark:text-blue-400">Total Wealth</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                    {formatCurrency(calculation.totalWealth)}
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                  <p className="text-sm text-purple-600 dark:text-purple-400">Nisab Threshold</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
                    {formatCurrency(calculation.nisabThreshold)}
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-600 dark:text-green-400">Zakat Due</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {formatCurrency(calculation.zakatDue)}
                  </p>
                </div>
              </div>

              {/* Notes Section */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</h4>
                  {onUpdateNotes && (
                    <button
                      onClick={() => setIsEditingNotes(!isEditingNotes)}
                      className="text-sm text-green-600 dark:text-green-400 hover:underline"
                    >
                      {isEditingNotes ? 'Cancel' : 'Edit'}
                    </button>
                  )}
                </div>
                {isEditingNotes ? (
                  <div className="space-y-2">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      rows={3}
                      placeholder="Add notes about this calculation..."
                    />
                    <button
                      onClick={handleSaveNotes}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      Save Notes
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {calculation.notes || 'No notes added'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Breakdown Tab */}
          {activeTab === 'breakdown' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Asset Breakdown
              </h3>
              <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto border border-gray-200 dark:border-gray-700">
                {JSON.stringify(calculation.assetBreakdown, null, 2)}
              </pre>
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Calculation ID</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-white mt-1">
                    {calculation.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Calendar Type</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1 capitalize">
                    {calculation.calendarType}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Calculation Date</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {format(new Date(calculation.calculationDate), 'PPPppp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Methodology</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {formatMethodology(calculation.methodology)}
                  </p>
                </div>
              </div>

              {calculation.metadata && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Additional Metadata
                  </h4>
                  <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg text-xs overflow-x-auto border border-gray-200 dark:border-gray-700">
                    {JSON.stringify(calculation.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center">
            <div className="space-x-2">
              {onExport && (
                <button
                  onClick={handleExport}
                  className="px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                >
                  Export
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculationDetailModal;
