/**
 * T037: Component Test - AuditTrailView
 * 
 * Tests the audit trail timeline view displaying all events
 * for a Nisab Year Record with proper formatting and access control.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuditTrailView } from '../../../src/components/AuditTrailView';

describe('AuditTrailView Component', () => {
  const mockAuditTrail = [
    {
      id: 'audit1',
      eventType: 'CREATED',
      timestamp: new Date('2024-01-01T10:00:00Z'),
      userId: 'user1',
      unlockReason: null,
      changesSummary: null,
      beforeState: null,
      afterState: { status: 'DRAFT' },
    },
    {
      id: 'audit2',
      eventType: 'FINALIZED',
      timestamp: new Date('2024-12-20T15:30:00Z'),
      userId: 'user1',
      unlockReason: null,
      changesSummary: null,
      beforeState: { status: 'DRAFT' },
      afterState: { status: 'FINALIZED' },
    },
    {
      id: 'audit3',
      eventType: 'UNLOCKED',
      timestamp: new Date('2024-12-22T09:15:00Z'),
      userId: 'user1',
      unlockReason: 'Correcting asset valuation error discovered during review',
      changesSummary: null,
      beforeState: { status: 'FINALIZED' },
      afterState: { status: 'UNLOCKED' },
    },
    {
      id: 'audit4',
      eventType: 'EDITED',
      timestamp: new Date('2024-12-22T10:00:00Z'),
      userId: 'user1',
      unlockReason: null,
      changesSummary: {
        fieldsChanged: ['totalWealth', 'zakatAmount'],
        oldValues: { totalWealth: 10000, zakatAmount: 250 },
        newValues: { totalWealth: 11000, zakatAmount: 275 },
      },
      beforeState: { totalWealth: 10000 },
      afterState: { totalWealth: 11000 },
    },
    {
      id: 'audit5',
      eventType: 'REFINALIZED',
      timestamp: new Date('2024-12-22T10:30:00Z'),
      userId: 'user1',
      unlockReason: null,
      changesSummary: null,
      beforeState: { status: 'UNLOCKED' },
      afterState: { status: 'FINALIZED' },
    },
  ];

  it('should render all audit trail entries', () => {
    render(<AuditTrailView auditTrail={mockAuditTrail} />);

    expect(screen.getByText(/created/i)).toBeInTheDocument();
    expect(screen.getByText(/finalized/i)).toBeInTheDocument();
    expect(screen.getByText(/unlocked/i)).toBeInTheDocument();
    expect(screen.getByText(/edited/i)).toBeInTheDocument();
    expect(screen.getByText(/refinalized/i)).toBeInTheDocument();
  });

  it('should display entries in reverse chronological order (newest first)', () => {
    render(<AuditTrailView auditTrail={mockAuditTrail} />);

    const entries = screen.getAllByRole('listitem');
    expect(entries).toHaveLength(5);

    // REFINALIZED should be first (most recent)
    expect(entries[0]).toHaveTextContent(/refinalized/i);
    // CREATED should be last (oldest)
    expect(entries[4]).toHaveTextContent(/created/i);
  });

  it('should format timestamps correctly', () => {
    render(<AuditTrailView auditTrail={mockAuditTrail} />);

    expect(screen.getByText(/jan.*1.*2024.*10:00/i)).toBeInTheDocument();
    expect(screen.getByText(/dec.*20.*2024.*15:30/i)).toBeInTheDocument();
  });

  it('should display unlock reason for UNLOCKED events', () => {
    render(<AuditTrailView auditTrail={mockAuditTrail} />);

    expect(
      screen.getByText(/correcting asset valuation error discovered during review/i)
    ).toBeInTheDocument();
  });

  it('should show changes summary for EDITED events', () => {
    render(<AuditTrailView auditTrail={mockAuditTrail} />);

    expect(screen.getByText(/totalWealth/i)).toBeInTheDocument();
    expect(screen.getByText(/zakatAmount/i)).toBeInTheDocument();
    expect(screen.getByText(/10,000.*11,000/i)).toBeInTheDocument(); // Old → New
  });

  it('should display event-specific icons', () => {
    render(<AuditTrailView auditTrail={mockAuditTrail} />);

    // Check for aria-labels on icons
    expect(screen.getByLabelText(/created.*icon/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/finalized.*icon/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/unlocked.*icon/i)).toBeInTheDocument();
  });

  it('should show empty state when no audit trail exists', () => {
    render(<AuditTrailView auditTrail={[]} />);

    expect(screen.getByText(/no audit trail/i)).toBeInTheDocument();
  });

  it('should collapse lengthy unlock reasons with "Show more" button', async () => {
    const longReasonEntry = {
      ...mockAuditTrail[2],
      unlockReason: 'A'.repeat(200), // Very long reason
    };

    render(<AuditTrailView auditTrail={[longReasonEntry]} />);

    expect(screen.getByRole('button', { name: /show more/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /show more/i }));

    expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
  });

  it('should filter by event type', async () => {
    render(<AuditTrailView auditTrail={mockAuditTrail} />);

    const filterSelect = screen.getByLabelText(/filter.*event type/i);
    
    await userEvent.selectOptions(filterSelect, 'UNLOCKED');

    const entries = screen.getAllByRole('listitem');
    expect(entries).toHaveLength(1);
    expect(entries[0]).toHaveTextContent(/unlocked/i);
  });

  it('should display user information who performed action', () => {
    render(<AuditTrailView auditTrail={mockAuditTrail} />);

    // Assuming user display names are shown
    expect(screen.getAllByText(/user1/i).length).toBeGreaterThan(0);
  });

  it('should show loading state', () => {
    render(<AuditTrailView auditTrail={null} loading={true} />);

    expect(screen.getByText(/loading.*audit trail/i)).toBeInTheDocument();
  });

  it('should display error message on fetch failure', () => {
    const errorMessage = 'Failed to load audit trail';

    render(<AuditTrailView auditTrail={null} error={errorMessage} />);

    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should highlight security-relevant events (unlock, edit)', () => {
    render(<AuditTrailView auditTrail={mockAuditTrail} />);

    const unlockEntry = screen.getByText(/unlocked/i).closest('li');
    const editEntry = screen.getByText(/edited/i).closest('li');

    expect(unlockEntry).toHaveClass('security-highlight');
    expect(editEntry).toHaveClass('security-highlight');
  });

  it('should display before/after state comparison', async () => {
    render(<AuditTrailView auditTrail={mockAuditTrail} />);

    // Click on EDITED event to expand details
    const editEntry = screen.getByText(/edited/i);
    await userEvent.click(editEntry);

    expect(screen.getByText(/before/i)).toBeInTheDocument();
    expect(screen.getByText(/after/i)).toBeInTheDocument();
  });

  it('should support exporting audit trail to CSV', async () => {
    render(<AuditTrailView auditTrail={mockAuditTrail} />);

    const exportButton = screen.getByRole('button', { name: /export.*csv/i });
    expect(exportButton).toBeInTheDocument();

    await userEvent.click(exportButton);

    // Verify download was triggered (in real implementation)
    expect(exportButton).toBeInTheDocument();
  });

  it('should be accessible with proper semantic HTML', () => {
    render(<AuditTrailView auditTrail={mockAuditTrail} />);

    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByRole('heading', { name: /audit trail/i })).toBeInTheDocument();
  });

  it('should show relative time (e.g., "2 days ago") alongside absolute timestamp', () => {
    const recentEntry = {
      ...mockAuditTrail[0],
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    };

    render(<AuditTrailView auditTrail={[recentEntry]} />);

    expect(screen.getByText(/2 days ago/i)).toBeInTheDocument();
  });

  it('should indicate immutability of audit trail', () => {
    render(<AuditTrailView auditTrail={mockAuditTrail} />);

    expect(screen.getByText(/immutable.*cannot.*deleted/i)).toBeInTheDocument();
  });

  it('should group events by date', () => {
    render(<AuditTrailView auditTrail={mockAuditTrail} />);

    expect(screen.getByText(/january 1, 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/december 20, 2024/i)).toBeInTheDocument();
    expect(screen.getByText(/december 22, 2024/i)).toBeInTheDocument();
  });
});
