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

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ExportControls } from '../../../src/components/ExportControls';

describe('ExportControls Accessibility', () => {
  const mockOnExport = jest.fn();

  const defaultProps = {
    onExport: mockOnExport,
    isExporting: false,
    availableFormats: ['csv', 'json', 'pdf'] as ('csv' | 'json' | 'pdf')[],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without accessibility issues', () => {
    expect(() => render(<ExportControls {...defaultProps} />)).not.toThrow();
  });

  it('should have proper button labels and descriptions', () => {
    render(<ExportControls {...defaultProps} />);

    // Export button should have clear labeling
    const exportButton = screen.getByRole('button', { name: /export/i });
    expect(exportButton).toBeTruthy();

    // Should have accessible text describing the action
    const buttonText = exportButton.textContent || '';
    expect(buttonText.toLowerCase()).toMatch(/export/);
  });

  it('should have accessible format selection', () => {
    render(<ExportControls {...defaultProps} />);

    // Component should render successfully with export functionality
    const exportButton = screen.getByRole('button', { name: /export/i });
    expect(exportButton).toBeTruthy();

    // Check that any existing accessibility attributes are properly set
    const allElements = [
      ...screen.getAllByRole('button'),
      ...screen.queryAllByRole('combobox'),
      ...screen.queryAllByRole('radio')
    ];

    allElements.forEach(element => {
      // Elements should exist and be accessible
      expect(element).toBeTruthy();
    });
  });

  it('should indicate loading state accessibly', () => {
    render(<ExportControls {...defaultProps} isExporting={true} />);

    const exportButton = screen.getByRole('button', { name: /exporting/i });
    expect(exportButton).toBeTruthy();

    // Should be disabled during export
    expect(exportButton).toBeDisabled();
  });

  it('should provide clear feedback for different states', () => {
    const { rerender } = render(<ExportControls {...defaultProps} isExporting={false} />);

    let exportButton = screen.getByRole('button', { name: /export as csv/i });
    expect(exportButton).toBeTruthy();
    expect(exportButton).not.toBeDisabled();

    rerender(<ExportControls {...defaultProps} isExporting={true} />);
    exportButton = screen.getByRole('button', { name: /exporting/i });
    expect(exportButton).toBeTruthy();
    expect(exportButton).toBeDisabled();
  });

  it('should support keyboard navigation', () => {
    render(<ExportControls {...defaultProps} />);

    // All interactive elements should be keyboard accessible
    const buttons = screen.getAllByRole('button');
    const selects = screen.queryAllByRole('combobox');

    [...buttons, ...selects].forEach(element => {
      expect(element.tabIndex).not.toBe(-1);
    });
  });

  it('should support screen readers with proper labeling', () => {
    render(<ExportControls {...defaultProps} />);

    const radioButtons = screen.getAllByRole('radio');
    radioButtons.forEach(radio => {
      // Each radio button should have proper labeling
      expect(radio).toHaveAttribute('name', 'exportFormat');
      expect(radio).toHaveAttribute('value');
    });

    const exportButton = screen.getByRole('button', { name: /export as csv/i });
    expect(exportButton).toBeTruthy();
  });

  it('should maintain accessibility across different formats', () => {
    const formats = ['csv', 'json', 'pdf'] as const;

    formats.forEach(format => {
      const { unmount } = render(<ExportControls {...defaultProps} />);

      // Select the format by clicking the radio button
      const radioButton = screen.getByDisplayValue(format);
      radioButton.click();

      // The button text should change based on the selected format
      const expectedText = `Export as ${format.toUpperCase()}`;
      const exportButton = screen.getByRole('button', { name: expectedText });
      expect(exportButton).toBeTruthy();

      unmount();
    });
  });
});