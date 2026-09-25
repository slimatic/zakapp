
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { of } from 'rxjs';

const { decryptMock } = vi.hoisted(() => ({
  decryptMock: vi.fn(async (c: string, iv: string) => 'DECRYPTED-' + c),
}));

vi.mock('../../services/CryptoService', () => ({
  cryptoService: {
    isEncrypted: (v: any) => typeof v === 'string' && v.startsWith('ZK1:'),
    unpackEncrypted: (v: string) => {
      const parts = v.slice(4).split(':');
      return parts.length < 2 ? null : { iv: parts[0], ciphertext: parts[1] };
    },
    decrypt: decryptMock,
  },
  CryptoService: { ZK_PREFIX: 'ZK1:' },
}));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'u1' } }) }));

const doc = {
  toJSON: () => ({
    id: 'u1',
    profileName: 'ZK1:iv1:ABC',
    email: 'ZK1:iv1:DEF',
    firstName: 'ZK1:iv1:GHI',
    lastName: 'ZK1:iv1:JKL',
    preferredCalendar: 'gregorian',
    preferredMethodology: 'standard',
    baseCurrency: 'USD',
    language: 'en',
    theme: 'system',
    isSetupCompleted: true,
    createdAt: 'x', updatedAt: 'y',
  }),
};

vi.mock('../../db', () => ({
  useDb: () => ({
    user_settings: { findOne: () => ({ $: of(doc) }) },
  }),
}));

import { useUserSettingsRepository } from '../../hooks/useUserSettingsRepository';

describe('user settings decrypt on read', () => {
  it('decrypts the encrypted profile fields instead of exporting ciphertext', async () => {
    const { result } = renderHook(() => useUserSettingsRepository());
    await waitFor(() => expect(result.current.settings).not.toBeNull());
    const s: any = result.current.settings;
    expect(s.profileName).toBe('DECRYPTED-ABC');
    expect(s.email).toBe('DECRYPTED-DEF');
    expect(s.firstName).toBe('DECRYPTED-GHI');
    expect(s.lastName).toBe('DECRYPTED-JKL');
    // non-encrypted fields untouched
    expect(s.baseCurrency).toBe('USD');
  });
});
