/**
 * T035: Component Test - FinalizationModal
 * 
 * Tests the modal dialog for finalizing a Nisab Year Record,
 * including confirmation, validation, and success feedback.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FinalizationModal } from '../../../src/components/FinalizationModal';

describe('FinalizationModal Component', () => {
  const mockRecord = {
    id: 'record1',
    status: 'DRAFT' as const,
    hawlStartDate: new Date('2024-01-01'),
    hawlCompletionDate: new Date('2024-12-20'),
    totalWealth: 10000,
    zakatableWealth: 10000,
    zakatAmount: 250,
    nisabBasis: 'gold' as const,
  };

  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal when open', () => {
    render(
      <FinalizationModal
        isOpen={true}
        record={mockRecord}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/finalize nisab year record/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <FinalizationModal
        isOpen={false}
        record={mockRecord}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should display record summary information', () => {
    render(
      <FinalizationModal
        isOpen={true}
        record={mockRecord}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/total wealth.*10,000/i)).toBeInTheDocument();
    expect(screen.getByText(/zakat amount.*250/i)).toBeInTheDocument();
  });

  it('should show warning about finalization being permanent', () => {
    render(
      <FinalizationModal
        isOpen={true}
        record={mockRecord}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/cannot be edited.*unlock/i)).toBeInTheDocument();
  });

  it('should call onConfirm when Confirm button clicked', async () => {
    render(
      <FinalizationModal
        isOpen={true}
        record={mockRecord}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm finalization/i });
    await userEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith(mockRecord.id);
  });

  it('should call onCancel when Cancel button clicked', async () => {
    render(
      <FinalizationModal
        isOpen={true}
        record={mockRecord}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should close when Escape key pressed', async () => {
    render(
      <FinalizationModal
        isOpen={true}
        record={mockRecord}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', code: 'Escape' });

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show override option if Hawl not yet complete', () => {
    const futureRecord = {
      ...mockRecord,
      hawlCompletionDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
    };

    render(
      <FinalizationModal
        isOpen={true}
        record={futureRecord}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/hawl not yet complete/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/override.*early/i)).toBeInTheDocument();
  });

  it('should require override checkbox to be checked for early finalization', async () => {
    const futureRecord = {
      ...mockRecord,
      hawlCompletionDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
    };

    render(
      <FinalizationModal
        isOpen={true}
        record={futureRecord}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm finalization/i });
    expect(confirmButton).toBeDisabled();

    const overrideCheckbox = screen.getByLabelText(/override.*early/i);
    await userEvent.click(overrideCheckbox);

    expect(confirmButton).not.toBeDisabled();
  });

  it('should show loading state during confirmation', async () => {
    render(
      <FinalizationModal
        isOpen={true}
        record={mockRecord}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        loading={true}
      />
    );

    expect(screen.getByText(/finalizing/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
  });

  it('should display success message after finalization', async () => {
    const { rerender } = render(
      <FinalizationModal
        isOpen={true}
        record={mockRecord}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm finalization/i });
    await userEvent.click(confirmButton);

    rerender(
      <FinalizationModal
        isOpen={true}
        record={{ ...mockRecord, status: 'FINALIZED' }}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        success={true}
      />
    );

    expect(screen.getByText(/successfully finalized/i)).toBeInTheDocument();
  });

  it('should display error message on finalization failure', () => {
    const errorMessage = 'Failed to finalize record';

    render(
      <FinalizationModal
        isOpen={true}
        record={mockRecord}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        error={errorMessage}
      />
    );

    expect(screen.getByText(/failed to finalize/i)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should display Hawl completion date', () => {
    render(
      <FinalizationModal
        isOpen={true}
        record={mockRecord}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/completed.*dec.*20.*2024/i)).toBeInTheDocument();
  });

  it('should be accessible with proper ARIA attributes', () => {
    render(
      <FinalizationModal
        isOpen={true}
        record={mockRecord}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');
  });

  it('should trap focus within modal when open', async () => {
    render(
      <FinalizationModal
        isOpen={true}
        record={mockRecord}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    const cancelButton = screen.getByRole('button', { name: /cancel/i });

    confirmButton.focus();
    expect(document.activeElement).toBe(confirmButton);

    await userEvent.tab();
    expect(document.activeElement).toBe(cancelButton);

    await userEvent.tab();
    // Should cycle back to first focusable element
    expect(document.activeElement).toBe(confirmButton);
  });
});
