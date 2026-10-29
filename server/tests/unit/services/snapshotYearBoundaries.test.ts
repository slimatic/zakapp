/**
 * Snapshot year boundaries — the span the stored figures are said to cover.
 *
 * WHY THIS FILE EXISTS
 *
 * `CalculationSnapshotService.calculateZakatYearBoundaries` wrote a **365-day**
 * span for a Hijri calculation, under a comment calling the Hijri branch
 * "simplified". The two dates are stored with every snapshot and read back as
 * the period the snapshot's figures cover, so a lunar snapshot claimed a solar
 * year — eleven days it does not have. The Gregorian branch carried the mirror
 * error in prose: a comment saying it "defaults to lunar year" over arithmetic
 * that computed a solar one.
 *
 * A hawl is 354 days (`HAWL_CONSTANTS.DAYS_LUNAR`, shared) and the app already
 * computes every other hawl date through `calculateHawlCompletionDate`. These
 * tests pin both branches to their own calendar.
 */

import { describe, it, expect } from 'vitest';
import { CalculationSnapshotService } from '../../../src/services/snapshot.service';

const DAY_MS = 24 * 60 * 60 * 1000;

const service = new CalculationSnapshotService();

const span = (start: Date, end: Date) => Math.round((end.getTime() - start.getTime()) / DAY_MS);

describe('snapshot zakat-year boundaries', () => {
  it('gives a Hijri year 354 days, not the solar 365', () => {
    const start = new Date('2026-01-15T09:30:00.000Z');
    const { zakatYearStart, zakatYearEnd } = service.calculateZakatYearBoundaries(start, 'HIJRI');

    expect(span(zakatYearStart, zakatYearEnd)).toBe(354);
  });

  it('keeps a Gregorian year at 365 days', () => {
    const start = new Date('2026-01-15T09:30:00.000Z');
    const { zakatYearStart, zakatYearEnd } = service.calculateZakatYearBoundaries(start, 'GREGORIAN');

    expect(span(zakatYearStart, zakatYearEnd)).toBe(365);
  });

  it('starts the year at the reference date it was given', () => {
    const start = new Date('2026-01-15T09:30:00.000Z');

    for (const calendar of ['HIJRI', 'GREGORIAN']) {
      const { zakatYearStart } = service.calculateZakatYearBoundaries(start, calendar);
      expect(zakatYearStart.getTime()).toBe(start.getTime());
    }
  });

  it('reads the calendar case-insensitively', () => {
    const start = new Date('2026-01-15T09:30:00.000Z');
    const upper = service.calculateZakatYearBoundaries(start, 'HIJRI');
    const lower = service.calculateZakatYearBoundaries(start, 'hijri');

    expect(lower.zakatYearEnd.getTime()).toBe(upper.zakatYearEnd.getTime());
  });
});
