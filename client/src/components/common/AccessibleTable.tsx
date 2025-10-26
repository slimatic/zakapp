import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  ariaLabel?: string;
}

interface AccessibleTableProps<T> {
  data: T[];
  columns: Column<T>[];
  caption: string;
  emptyMessage?: string;
  ariaLabel?: string;
}

/**
 * Accessible Data Table Component
 * 
 * Features:
 * - Proper table semantics (table, thead, tbody, th, td)
 * - Caption for screen readers
 * - Column headers with scope="col"
 * - Row headers where appropriate
 * - ARIA labels for complex cells
 * - Keyboard navigation (Tab through cells)
 * - Responsive design
 */
export function AccessibleTable<T extends { id?: string | number }>({
  data,
  columns,
  caption,
  emptyMessage = 'No data available',
  ariaLabel
}: AccessibleTableProps<T>) {
  const getCellValue = (row: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor] as React.ReactNode;
  };

  if (data.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table 
        className="min-w-full divide-y divide-gray-200" 
        aria-label={ariaLabel || caption}
      >
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                aria-label={column.ariaLabel}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, rowIndex) => (
            <tr 
              key={row.id || rowIndex}
              className="hover:bg-gray-50 transition-colors"
            >
              {columns.map((column, colIndex) => {
                const cellValue = getCellValue(row, column);
                const isFirstColumn = colIndex === 0;
                
                return isFirstColumn ? (
                  <th
                    key={colIndex}
                    scope="row"
                    className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                  >
                    {cellValue}
                  </th>
                ) : (
                  <td
                    key={colIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                  >
                    {cellValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AccessibleTable;
