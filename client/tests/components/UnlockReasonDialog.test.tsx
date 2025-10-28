/**
 * T036: Component Test - UnlockReasonDialog
 * 
 * Tests the dialog for entering unlock reason when unlocking a FINALIZED record,
 * including validation and submission.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnlockReasonDialog } from '../../../src/components/UnlockReasonDialog';

describe('UnlockReasonDialog Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog when open', () => {
    render(
      <UnlockReasonDialog
        isOpen={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/unlock.*record/i)).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <UnlockReasonDialog
        isOpen={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render textarea for reason input', () => {
    render(
      <UnlockReasonDialog
        isOpen={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByLabelText(/reason.*unlock/i);
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('should require minimum 10 characters', async () => {
    render(
      <UnlockReasonDialog
        isOpen={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByLabelText(/reason.*unlock/i);
    const submitButton = screen.getByRole('button', { name: /unlock/i });

    // Type less than 10 characters
    await userEvent.type(textarea, 'Too short');

    expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('should enable submit button when reason is valid', async () => {
    render(
      <UnlockReasonDialog
        isOpen={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByLabelText(/reason.*unlock/i);
    const submitButton = screen.getByRole('button', { name: /unlock/i });

    expect(submitButton).toBeDisabled();

    await userEvent.type(textarea, 'Valid reason with more than 10 characters');

    expect(submitButton).not.toBeDisabled();
  });

  it('should call onSubmit with reason when submitted', async () => {
    render(
      <UnlockReasonDialog
        isOpen={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByLabelText(/reason.*unlock/i);
    const reason = 'Correcting asset valuation error discovered during review';

    await userEvent.type(textarea, reason);
    await userEvent.click(screen.getByRole('button', { name: /unlock/i }));

    expect(mockOnSubmit).toHaveBeenCalledWith(reason);
  });

  it('should call onCancel when Cancel button clicked', async () => {
    render(
      <UnlockReasonDialog
        isOpen={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should show character count indicator', async () => {
    render(
      <UnlockReasonDialog
        isOpen={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByLabelText(/reason.*unlock/i);

    expect(screen.getByText(/0.*characters/i)).toBeInTheDocument();

    await userEvent.type(textarea, 'Testing input');

    expect(screen.getByText(/13.*characters/i)).toBeInTheDocument();
  });

  it('should display warning about audit trail', () => {
    render(
      <UnlockReasonDialog
        isOpen={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/recorded.*audit trail/i)).toBeInTheDocument();
  });

  it('should provide example reasons', () => {
    render(
      <UnlockReasonDialog
        isOpen={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/examples/i)).toBeInTheDocument();
    expect(screen.getByText(/asset.*incorrectly/i)).toBeInTheDocument();
  });

  it('should show loading state during submission', () => {
    render(
      <UnlockReasonDialog
        isOpen={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={true}
      />
    );

    expect(screen.getByText(/unlocking/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unlock/i })).toBeDisabled();
  });

  it('should display error message on submission failure', () => {
    const errorMessage = 'Failed to unlock record';

    render(
      <UnlockReasonDialog
        isOpen={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        error={errorMessage}
      />
    );

    expect(screen.getByText(/failed to unlock/i)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should clear input when dialog is reopened', () => {
    const { rerender } = render(
      <UnlockReasonDialog
        isOpen={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByLabelText(/reason.*unlock/i) as HTMLTextAreaElement;
    userEvent.type(textarea, 'Some reason here');

    // Close dialog
    rerender(
      <UnlockReasonDialog
        isOpen={false}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    // Reopen dialog
    rerender(
      <UnlockReasonDialog
        isOpen={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const newTextarea = screen.getByLabelText(/reason.*unlock/i) as HTMLTextAreaElement;
    expect(newTextarea.value).toBe('');
  });

  it('should be accessible with proper labels and descriptions', () => {
    render(
      <UnlockReasonDialog
        isOpen={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');

    const textarea = screen.getByLabelText(/reason.*unlock/i);
    expect(textarea).toHaveAttribute('aria-required', 'true');
    expect(textarea).toHaveAttribute('aria-invalid');
  });

  it('should auto-focus textarea when opened', () => {
    render(
      <UnlockReasonDialog
        isOpen={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByLabelText(/reason.*unlock/i);
    expect(textarea).toHaveFocus();
  });

  it('should handle Enter key to submit (with Ctrl/Cmd)', async () => {
    render(
      <UnlockReasonDialog
        isOpen={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const textarea = screen.getByLabelText(/reason.*unlock/i);
    const validReason = 'Valid reason with sufficient characters';

    await userEvent.type(textarea, validReason);
    await userEvent.keyboard('{Control>}{Enter}{/Control}');

    expect(mockOnSubmit).toHaveBeenCalledWith(validReason);
  });

  it('should warn about permanent audit trail record', () => {
    render(
      <UnlockReasonDialog
        isOpen={true}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/cannot be deleted.*modified/i)).toBeInTheDocument();
  });
});
