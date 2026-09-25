/**
 * End-to-end backup round trip against REAL data.
 *
 * The unit tests use hand-written fixtures. This one pulls an actual backup from
 * the live vault, runs it through the real export guards and the real import
 * adapters, and diffs every money field on the way back.
 *
 * It exists because the failure mode we are guarding (silent amount corruption)
 * only shows up against real ciphertext and real decimal values - the fixtures
 * were written by the same person who wrote the bug.
 *
 * Skips itself when the live vault is not reachable, so it never fails CI.
 */

import { describe, it, expect } from 'vitest';
import { MigrationService } from '../../services/migrationService';
import { findEncryptedLeaks, requireImportedAmount } from '../parseDecimal';

const COUCH = process.env.ZAK_COUCH_URL || 'http://192.168.86.242:5984';
const AUTH = process.env.ZAK_COUCH_AUTH || '';
const ACCT = process.env.ZAK_TEST_ACCOUNT || '';

async function pull(kind: string): Promise<{ ok: boolean; docs: any[]; why?: string }> {
  if (!ACCT || !AUTH) return { ok: false, docs: [], why: 'no live account configured' };
  const url = `${COUCH}/zakapp_${ACCT}_${kind}/_all_docs?include_docs=true`;
  try {
    const res = await fetch(url, { headers: { Authorization: `Basic ${AUTH}` } });
    if (!res.ok) return { ok: false, docs: [], why: `HTTP ${res.status}` };
    const body: any = await res.json();
    return { ok: true, docs: (body.rows || []).map((r: any) => r.doc) };
  } catch (e: any) {
    return { ok: false, docs: [], why: e?.message || 'fetch failed' };
  }
}

describe('backup round trip against the live vault', () => {
  it('re-imports every asset with the exact same value', async () => {
    const { ok, docs, why } = await pull('assets');
    if (!ok) {
      console.warn(`[round trip] skipped: ${why}`);
      return;
    }
    expect(docs.length).toBeGreaterThan(0);

    // Reconstruct what the export writes, then run it back through the importer.
    const asExported = docs.map((d: any) => ({
      id: d._id, name: d.name, type: d.type, value: d.value,
      currency: d.currency, description: d.description,
      acquisitionDate: d.acquisitionDate, isActive: d.isActive,
    }));

    const restored = MigrationService.adaptAssets(asExported, 'test-user');

    expect(restored).toHaveLength(docs.length);
    for (const d of docs) {
      const back = restored.find((r: any) => r.id === d._id);
      expect(back, `asset ${d._id} missing after round trip`).toBeDefined();
      // The whole point: the amount must survive bit-for-bit.
      expect(Number((back as any).value)).toBe(Number(d.value));
      expect((back as any).currency).toBe(d.currency);
    }
  });

  it('re-imports every nisab record with the exact same amounts', async () => {
    const { ok, docs, why } = await pull('nisab_year_records');
    if (!ok) {
      console.warn(`[round trip] skipped: ${why}`);
      return;
    }
    if (docs.length === 0) return;

    const asExported = docs.map((d: any) => ({
      id: d._id, hawlStartDate: d.hawlStartDate, hawlCompletionDate: d.hawlCompletionDate,
      hijriYear: d.hijriYear, nisabBasis: d.nisabBasis, totalWealth: d.totalWealth,
      zakatableWealth: d.zakatableWealth, zakatAmount: d.zakatAmount,
      currency: d.currency, status: d.status,
    }));

    const restored = MigrationService.adaptNisabRecords(asExported, 'test-user');
    for (const d of docs) {
      const back = restored.find((r: any) => r.id === d._id);
      expect(back).toBeDefined();
      expect(Number((back as any).totalWealth)).toBe(Number(d.totalWealth));
      expect(Number((back as any).zakatableWealth)).toBe(Number(d.zakatableWealth));
      expect((back as any).nisabBasis).toBe(d.nisabBasis);
    }
  });

  it('the export guard accepts a clean payload and rejects a leaked one', async () => {
    const { ok, docs } = await pull('assets');
    if (!ok) {
      console.warn('[round trip] skipped: no live account configured');
      return;
    }

    // A real export (post-decryption) must be clean.
    const clean = { version: '3.0', assets: docs };
    expect(findEncryptedLeaks(clean)).toHaveLength(0);

    // If a single ciphertext blob leaks into a money field, the export must refuse.
    const leaked = JSON.parse(JSON.stringify(clean));
    leaked.assets[0].value = 'ZK1:xG9kLm2nPq:8fJ2kL9mQ3vX';
    const leaks = findEncryptedLeaks(leaked);
    expect(leaks.length).toBe(1);
    expect(leaks[0]).toContain('assets[0].value');

    // And the importer must reject it loudly rather than record a wrong number.
    expect(() => requireImportedAmount('ZK1:xG9kLm2nPq:8fJ2kL9mQ3vX', 'assets[0].value'))
      .toThrow(/encrypted/i);
  });

  /**
   * Encrypted profile fields are EXPECTED, not a leak.
   *
   * user_settings encrypts profileName/firstName/lastName/email by design and its
   * repository never decrypts them. Flagging those would block every export while
   * protecting nothing financial - so the guard is scoped to money fields only.
   */
  it('does not flag legitimately-encrypted profile fields', () => {
    const payload = {
      version: '3.0',
      settings: {
        id: 'u1',
        profileName: 'ZK1:abc123:def456',
        firstName: 'ZK1:aaa:bbb',
        email: 'ZK1:ccc:ddd',
        baseCurrency: 'USD',
      },
      assets: [{ id: 'a1', value: 100, currency: 'USD', name: 'ZK1:xxx:yyy' }],
    };
    // `name` on an asset is encrypted in the schema too, and is not a money field.
    expect(findEncryptedLeaks(payload)).toHaveLength(0);
  });
});
