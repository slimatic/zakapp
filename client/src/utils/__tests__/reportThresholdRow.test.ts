import { describe, it, expect } from 'vitest';

/**
 * The Nisab Threshold row on a generated Hawl statement.
 *
 * The record's stored threshold may be a plain number, a numeric string, or an
 * ENCRYPTED string (see the caveat in NisabComparisonWidget). The old code read a
 * field the type does not even declare and coerced it with Number(), which turned
 * an unreadable value into 0 - printing "$0.00" on a FINALIZED statement that also
 * showed a zakat amount due. That reads as a broken calculation.
 *
 * The rule: print the row only when the value is genuinely readable; otherwise omit
 * it. A missing row is honest, a confident zero is not.
 */
const rowFor = (record: Record<string, unknown>): [string, string][] => {
  const rawThreshold =
    record.nisabThresholdAtStart ??
    (record as any).nisabThreshold ??
    record.initialNisabThreshold;
  const parsedThreshold = parseFloat(String(rawThreshold ?? ''));
  return Number.isFinite(parsedThreshold)
    ? [['Nisab Threshold', `$${parsedThreshold.toFixed(2)}`]]
    : [];
};

describe('Hawl statement - Nisab Threshold row', () => {
  it('prints a numeric threshold', () => {
    expect(rowFor({ nisabThresholdAtStart: 5000 })).toEqual([
      ['Nisab Threshold', '$5000.00'],
    ]);
  });

  it('parses a numeric string', () => {
    expect(rowFor({ nisabThresholdAtStart: '5750.25' })).toEqual([
      ['Nisab Threshold', '$5750.25'],
    ]);
  });

  it('falls back to initialNisabThreshold', () => {
    expect(rowFor({ initialNisabThreshold: 4200 })).toEqual([
      ['Nisab Threshold', '$4200.00'],
    ]);
  });

  it('OMITS the row for an encrypted (non-numeric) value instead of printing $0.00', () => {
    // The exact failure: an encrypted blob coerced to a number.
    expect(rowFor({ nisabThresholdAtStart: 'enc:v1:8f2a9c==:b64' })).toEqual([]);
    expect(rowFor({ nisabThresholdAtStart: 'enc:v1:8f2a9c==:b64' })).not.toEqual([
      ['Nisab Threshold', '$0.00'],
    ]);
  });

  it('OMITS the row when no threshold field is present at all', () => {
    expect(rowFor({})).toEqual([]);
  });

  it('does not treat an empty string as zero', () => {
    // parseFloat('') is NaN, so this omits - the previous Number('') gave 0.
    expect(rowFor({ nisabThresholdAtStart: '' })).toEqual([]);
  });
});
