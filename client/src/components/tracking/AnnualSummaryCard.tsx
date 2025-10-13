/**
 * AnnualSummaryCard Component - T065
 * Displays annual Zakat summary with PDF export functionality
 */

import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { formatGregorianDate, formatHijriDate } from '../../utils/calendarConverter';
import { generateAnnualSummaryPDF, downloadPDF } from '../../utils/pdfGenerator';
import { usePayments } from '../../hooks/usePayments';
import type { YearlySnapshot } from '../../../../shared/types/tracking';

interface AnnualSummaryCardProps {
  snapshot: YearlySnapshot;
  compact?: boolean;
  showExportButtons?: boolean;
}

export const AnnualSummaryCard: React.FC<AnnualSummaryCardProps> = ({
  snapshot,
  compact = false,
  showExportButtons = true
}) => {
  const [isExporting, setIsExporting] = useState(false);
  
  // Fetch payment records for this snapshot
  const { data: paymentsData } = usePayments({ snapshotId: snapshot.id });
  const payments = paymentsData?.payments || [];

  // Calculate summary statistics
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingZakat = Math.max(0, snapshot.zakatAmount - totalPaid);
  const paymentProgress = snapshot.zakatAmount > 0 ? (totalPaid / snapshot.zakatAmount) * 100 : 0;
  const netWorth = snapshot.totalWealth - snapshot.totalLiabilities;
  const zakatRate = snapshot.zakatableWealth > 0 ? (snapshot.zakatAmount / snapshot.zakatableWealth) * 100 : 0;
  const isAboveNisab = snapshot.zakatableWealth >= snapshot.nisabThreshold;

  // Payment distribution by category
  const paymentsByCategory = payments.reduce((acc, payment) => {
    acc[payment.recipientCategory] = (acc[payment.recipientCategory] || 0) + payment.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryLabels = {
    fakir: 'Al-Fuqara (The Poor)',
    miskin: 'Al-Masakin (The Needy)',
    amil: 'Al-Amilin (Administrators)',
    muallaf: 'Al-Muallafah (New Muslims)',
    riqab: 'Ar-Riqab (Freeing Slaves)',
    gharimin: 'Al-Gharimin (Debt-ridden)',
    fisabilillah: 'Fi Sabilillah (In Allah\'s way)',
    ibnus_sabil: 'Ibn as-Sabil (Traveler)'
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const pdf = generateAnnualSummaryPDF(snapshot, payments);
      downloadPDF(pdf, `zakat-summary-${snapshot.gregorianYear}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = () => {
    const shareData = {
      title: `Zakat Summary ${snapshot.gregorianYear}`,
      text: `My Zakat calculation for ${snapshot.gregorianYear}: ${formatCurrency(snapshot.zakatAmount)} calculated on ${formatCurrency(snapshot.zakatableWealth)} zakatable wealth.`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      alert('Summary copied to clipboard!');
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${compact ? 'p-4' : 'p-6'} space-y-6`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className={`font-bold text-gray-900 ${compact ? 'text-lg' : 'text-xl'}`}>
            Annual Zakat Summary
          </h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span>📅 {formatGregorianDate(snapshot.calculationDate)}</span>
            <span>🌙 {formatHijriDate({ 
              hy: snapshot.hijriYear, 
              hm: snapshot.hijriMonth, 
              hd: snapshot.hijriDay 
            })}</span>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              snapshot.status === 'finalized' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {snapshot.status === 'finalized' ? '✅ Finalized' : '🔄 Draft'}
            </span>
          </div>
        </div>

        {snapshot.isPrimary && (
          <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
            ⭐ Primary
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className={`grid gap-4 ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-sm font-medium text-green-800">Zakat Obligated</div>
          <div className="text-xl font-bold text-green-900">
            {formatCurrency(snapshot.zakatAmount)}
          </div>
          <div className="text-xs text-green-700 mt-1">
            {formatPercentage(zakatRate / 100)} of zakatable wealth
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm font-medium text-blue-800">Amount Paid</div>
          <div className="text-xl font-bold text-blue-900">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-xs text-blue-700 mt-1">
            {formatPercentage(paymentProgress / 100)} complete
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="text-sm font-medium text-purple-800">Zakatable Wealth</div>
          <div className="text-xl font-bold text-purple-900">
            {formatCurrency(snapshot.zakatableWealth)}
          </div>
          <div className="text-xs text-purple-700 mt-1">
            {isAboveNisab ? '✅ Above nisab' : '❌ Below nisab'}
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="text-sm font-medium text-orange-800">Net Worth</div>
          <div className="text-xl font-bold text-orange-900">
            {formatCurrency(netWorth)}
          </div>
          <div className="text-xs text-orange-700 mt-1">
            After liabilities
          </div>
        </div>
      </div>

      {/* Payment Progress */}
      {!compact && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Payment Progress</span>
            <span className="text-sm text-gray-600">
              {formatCurrency(remainingZakat)} remaining
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                paymentProgress >= 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(paymentProgress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Payment Distribution */}
      {!compact && Object.keys(paymentsByCategory).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Payment Distribution by Category</h4>
          <div className="space-y-2">
            {Object.entries(paymentsByCategory).map(([category, amount]) => {
              const percentage = totalPaid > 0 ? (amount / totalPaid) * 100 : 0;
              return (
                <div key={category} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {categoryLabels[category as keyof typeof categoryLabels] || category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-medium">
                      {formatCurrency(amount)}
                    </span>
                    <span className="text-gray-500 text-xs">
                      ({formatPercentage(percentage / 100)})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calculation Details */}
      {!compact && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Calculation Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Wealth:</span>
              <span className="font-medium text-gray-900 ml-2">
                {formatCurrency(snapshot.totalWealth)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Total Liabilities:</span>
              <span className="font-medium text-gray-900 ml-2">
                {formatCurrency(snapshot.totalLiabilities)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Methodology:</span>
              <span className="font-medium text-gray-900 ml-2">
                {snapshot.methodologyUsed}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Nisab ({snapshot.nisabType}):</span>
              <span className="font-medium text-gray-900 ml-2">
                {formatCurrency(snapshot.nisabThreshold)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {!compact && snapshot.userNotes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Notes</h4>
          <p className="text-sm text-blue-700">{snapshot.userNotes}</p>
        </div>
      )}

      {/* Export Actions */}
      {showExportButtons && (
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            size={compact ? 'sm' : 'md'}
          >
            {isExporting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </>
            )}
          </Button>

          <Button
            variant="secondary"
            onClick={handleShare}
            size={compact ? 'sm' : 'md'}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            Share
          </Button>

          <Button
            variant="ghost"
            onClick={() => window.print()}
            size={compact ? 'sm' : 'md'}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </Button>
        </div>
      )}

      {/* Compliance Note */}
      {!compact && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800">
                Islamic Compliance Note
              </h4>
              <p className="text-sm text-green-700 mt-1">
                This calculation follows Islamic guidelines for Zakat obligation using the {snapshot.methodologyUsed} methodology. 
                The nisab threshold is based on {snapshot.nisabType} prices. 
                Please consult with a qualified Islamic scholar for specific rulings.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};