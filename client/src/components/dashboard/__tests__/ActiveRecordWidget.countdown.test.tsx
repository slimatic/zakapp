/**
 * Hawl countdown milestones on the ActiveRecordWidget.
 * Blue-ocean feature: automated Hawl tracking / due-date urgency (competitor gap #4).
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { PrivacyProvider } from '../../../contexts/PrivacyContext';
import { ActiveRecordWidget } from '../ActiveRecordWidget';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { settings: { currency: 'USD' } },
    updateLocalProfile: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useNisabThreshold', () => ({
  useNisabThreshold: () => ({ nisabAmount: 5000, isLoading: false }),
}));

vi.mock('../../../hooks/usePaymentRepository', () => ({
  usePaymentRepository: () => ({ payments: [], isLoading: false, error: null }),
}));

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function renderWidget(record: Record<string, unknown>) {
  return render(
    <PrivacyProvider>
      <MemoryRouter>
        <ActiveRecordWidget record={record as never} />
      </MemoryRouter>
    </PrivacyProvider>
  );
}

const baseRecord = {
  id: 'r1',
  startDate: daysFromNow(-354), // default: day 354
  nisabBasis: 'GOLD',
  zakatAmount: 100,
};

describe('ActiveRecordWidget hawl countdown', () => {
  it('shows the due-soon milestone at 30 days remaining', () => {
    const { container } = renderWidget({
      ...baseRecord,
      startDate: daysFromNow(-324),
    });
    const status = container.querySelector('[role="status"]');
    expect(status?.textContent).toContain('30 days left');
    expect(status?.textContent).toContain('due soon');
  });

  it('shows the due-soon milestone at 1 day remaining (singular)', () => {
    const { container } = renderWidget({
      ...baseRecord,
      startDate: daysFromNow(-353),
    });
    expect(container.querySelector('[role="status"]')?.textContent).toContain('1 day left');
  });

  it('shows the Hawl-complete call to action at 0 days remaining', () => {
    const { container } = renderWidget({
      ...baseRecord,
      startDate: daysFromNow(-400),
    });
    expect(container.querySelector('[role="status"]')?.textContent).toContain('Hawl complete');
  });

  it('shows no milestone when the hawl has just started', () => {
    const { container } = renderWidget({
      ...baseRecord,
      startDate: daysFromNow(-10),
    });
    expect(container.querySelector('[role="status"]')).toBeNull();
  });
});