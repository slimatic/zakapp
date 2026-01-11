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
 * Calculation Export Utilities
 * 
 * Utilities for exporting Zakat calculation results in various formats
 * including PDF (print), CSV, and JSON.
 */

export interface ZakatCalculation {
  calculationDate: Date;
  methodology: string;
  methodologyName: string;
  nisabThreshold: number;
  totalWealth: number;
  totalZakat: number;
  assets: Array<{
    type: string;
    category: string;
    amount: number;
    zakatableAmount: number;
    zakatDue: number;
  }>;
  meetsNisab: boolean;
  currency?: string;
  notes?: string;
  userId?: string;
}

/**
 * Export calculation as JSON
 */
export const exportAsJSON = (calculation: ZakatCalculation): void => {
  const data = {
    ...calculation,
    calculationDate: calculation.calculationDate.toISOString(),
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });

  downloadFile(
    blob,
    `zakat-calculation-${formatDateForFilename(calculation.calculationDate)}.json`
  );
};

/**
 * Export calculation as CSV
 */
export const exportAsCSV = (calculation: ZakatCalculation): void => {
  const currency = calculation.currency || 'USD';

  // CSV Header
  let csv = 'Zakat Calculation Export\n\n';
  csv += `Calculation Date,${calculation.calculationDate.toLocaleDateString()}\n`;
  csv += `Methodology,${calculation.methodologyName}\n`;
  csv += `Total Wealth,${formatCurrency(calculation.totalWealth, currency)}\n`;
  csv += `Nisab Threshold,${formatCurrency(calculation.nisabThreshold, currency)}\n`;
  csv += `Meets Nisab,${calculation.meetsNisab ? 'Yes' : 'No'}\n`;
  csv += `Total Zakat Due,${formatCurrency(calculation.totalZakat, currency)}\n`;

  if (calculation.notes) {
    csv += `Notes,"${calculation.notes}"\n`;
  }

  csv += '\n\nAsset Breakdown\n';
  csv += 'Category,Amount,Zakatable Amount,Zakat Due\n';

  calculation.assets.forEach(asset => {
    csv += `${asset.category},`;
    csv += `${formatCurrency(asset.amount, currency)},`;
    csv += `${formatCurrency(asset.zakatableAmount, currency)},`;
    csv += `${formatCurrency(asset.zakatDue, currency)}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadFile(
    blob,
    `zakat-calculation-${formatDateForFilename(calculation.calculationDate)}.csv`
  );
};

/**
 * Generate print-friendly HTML for PDF export
 */
export const generatePrintHTML = (calculation: ZakatCalculation): string => {
  const currency = calculation.currency || 'USD';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zakat Calculation - ${calculation.calculationDate.toLocaleDateString()}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #10b981;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: #10b981;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    
    .header p {
      color: #666;
      margin: 5px 0;
    }
    
    .summary-box {
      background: #f0fdf4;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .summary-box h2 {
      color: #047857;
      margin: 0 0 15px 0;
      font-size: 20px;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    
    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      background: white;
      border-radius: 4px;
    }
    
    .summary-item strong {
      color: #047857;
    }
    
    .zakat-amount {
      background: #dcfce7;
      border: 2px solid #10b981;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
    }
    
    .zakat-amount h3 {
      color: #047857;
      margin: 0 0 10px 0;
      font-size: 16px;
    }
    
    .zakat-amount .amount {
      font-size: 36px;
      font-weight: bold;
      color: #10b981;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    
    th {
      background: #f3f4f6;
      color: #374151;
      font-weight: 600;
    }
    
    tr:hover {
      background: #f9fafb;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    
    .notes {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 4px;
      padding: 15px;
      margin: 20px 0;
    }
    
    .notes h4 {
      margin: 0 0 10px 0;
      color: #92400e;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Zakat Calculation Report</h1>
    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    <p>Calculation Date: ${calculation.calculationDate.toLocaleDateString()}</p>
  </div>

  <div class="summary-box">
    <h2>Calculation Summary</h2>
    <div class="summary-grid">
      <div class="summary-item">
        <span>Methodology:</span>
        <strong>${calculation.methodologyName}</strong>
      </div>
      <div class="summary-item">
        <span>Currency:</span>
        <strong>${currency}</strong>
      </div>
      <div class="summary-item">
        <span>Total Wealth:</span>
        <strong>${formatCurrency(calculation.totalWealth, currency)}</strong>
      </div>
      <div class="summary-item">
        <span>Nisab Threshold:</span>
        <strong>${formatCurrency(calculation.nisabThreshold, currency)}</strong>
      </div>
    </div>
  </div>

  <div class="zakat-amount">
    <h3>Your Zakat Due</h3>
    <div class="amount">${formatCurrency(calculation.totalZakat, currency)}</div>
    <p style="margin: 10px 0 0 0; color: #047857;">
      ${calculation.meetsNisab
      ? 'Your wealth meets nisab. Zakat is obligatory.'
      : 'Your wealth is below nisab. Zakat is not obligatory.'}
    </p>
  </div>

  ${calculation.notes ? `
  <div class="notes">
    <h4>📝 Notes</h4>
    <p>${calculation.notes}</p>
  </div>
  ` : ''}

  <h2 style="margin-top: 30px;">Asset Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Asset Category</th>
        <th style="text-align: right;">Total Amount</th>
        <th style="text-align: right;">Zakatable Amount</th>
        <th style="text-align: right;">Zakat Due</th>
      </tr>
    </thead>
    <tbody>
      ${calculation.assets.map(asset => `
        <tr>
          <td>${asset.category}</td>
          <td style="text-align: right;">${formatCurrency(asset.amount, currency)}</td>
          <td style="text-align: right;">${formatCurrency(asset.zakatableAmount, currency)}</td>
          <td style="text-align: right;">${formatCurrency(asset.zakatDue, currency)}</td>
        </tr>
      `).join('')}
      <tr style="background: #f3f4f6; font-weight: bold;">
        <td>Total</td>
        <td style="text-align: right;">${formatCurrency(calculation.totalWealth, currency)}</td>
        <td style="text-align: right;">${formatCurrency(calculation.totalWealth, currency)}</td>
        <td style="text-align: right;">${formatCurrency(calculation.totalZakat, currency)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p><strong>Important Reminder:</strong> Zakat becomes due after your wealth has been above nisab for one complete lunar year (hawl).</p>
    <p>This calculation is for reference purposes. For complex situations, consult a qualified Islamic scholar.</p>
    <p style="margin-top: 20px;">Generated by ZakApp - Your Secure Wealth & Zakat Vault</p>
  </div>
</body>
</html>
  `;
};

/**
 * Print calculation (opens print dialog)
 */
export const printCalculation = (calculation: ZakatCalculation): void => {
  const html = generatePrintHTML(calculation);
  const printWindow = window.open('', '_blank');

  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.print();
    };
  } else {
    alert('Please allow popups to print the calculation.');
  }
};

/**
 * Export as PDF (using print dialog)
 */
export const exportAsPDF = (calculation: ZakatCalculation): void => {
  // In a browser, we use the print dialog with "Save as PDF" option
  // For server-side PDF generation, you would need a library like puppeteer
  printCalculation(calculation);
};

/**
 * Helper: Format currency
 */
const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Helper: Format date for filename
 */
const formatDateForFilename = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Helper: Download file
 */
const downloadFile = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Export calculation in multiple formats at once
 */
export const exportAll = (calculation: ZakatCalculation): void => {
  exportAsJSON(calculation);
  setTimeout(() => exportAsCSV(calculation), 500);
  // PDF export via print dialog can be done separately
};

const calculationExportUtils = {
  exportAsJSON,
  exportAsCSV,
  exportAsPDF,
  printCalculation,
  exportAll
};

export default calculationExportUtils;
