/**
 * The plaintext warning must actually be on screen.
 *
 * The disclosure only does its job if it is rendered AND announced to assistive
 * tech. A note that exists in the source but is visually hidden, or a colour-only
 * warning, does not transfer the decision to the user.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UnifiedImportExport } from '../UnifiedImportExport';

vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}));

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' } }),
}));

vi.mock('../../../hooks/useAssetRepository', () => ({
  useAssetRepository: () => ({ assets: [{ id: 'a1' }], addAsset: vi.fn() }),
}));
vi.mock('../../../hooks/usePaymentRepository', () => ({
  usePaymentRepository: () => ({ payments: [{ id: 'p1' }], bulkAddPayments: vi.fn() }),
}));
vi.mock('../../../hooks/useNisabRecordRepository', () => ({
  useNisabRecordRepository: () => ({ records: [], bulkAddRecords: vi.fn() }),
}));
vi.mock('../../../hooks/useLiabilityRepository', () => ({
  useLiabilityRepository: () => ({ liabilities: [], bulkAddLiabilities: vi.fn() }),
}));
vi.mock('../../../hooks/useUserSettingsRepository', () => ({
  useUserSettingsRepository: () => ({ settings: null, updateSettings: vi.fn() }),
}));
vi.mock('../../../hooks/useDataCleanup', () => ({
  useDataCleanup: () => ({ clearAllData: vi.fn(), isClearing: false }),
}));

describe('backup plaintext disclosure', () => {
  it('tells the user the backup is not encrypted', () => {
    render(<UnifiedImportExport />);
    expect(screen.getByText(/Not encrypted/i)).toBeInTheDocument();
  });

  it('explains the consequence AND the reason it is still useful', () => {
    render(<UnifiedImportExport />);
    const text = document.body.textContent || '';
    // Consequence: exposed to whoever holds the file.
    expect(text).toMatch(/anyone who gets it can read them/i);
    // Reason: this is the trade-off that makes it recoverable without the key.
    expect(text).toMatch(/even if you forget your password/i);
    // Practical instruction.
    expect(text).toMatch(/delete it once you have imported it/i);
  });

  it('does not rely on colour alone (icon is decorative, text carries the meaning)', () => {
    const { container } = render(<UnifiedImportExport />);
    const icons = container.querySelectorAll('svg[aria-hidden="true"]');
    // The warning icon must be hidden from AT so the sentence is not double-read.
    expect(icons.length).toBeGreaterThan(0);
    // And the meaning must be in text, not only in the icon.
    expect(screen.getByText(/Not encrypted/i)).toBeInTheDocument();
  });

  it('no longer claims to accept only up to v2.0 backups', () => {
    render(<UnifiedImportExport />);
    expect(screen.queryByText(/Accepts legacy v1\.0 and new v2\.0 backups/i)).toBeNull();
    expect(screen.getByText(/1\.x, 2\.x, 3\.x/i)).toBeInTheDocument();
  });
});
