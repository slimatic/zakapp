/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

/**
 * Regression guard for the two defects found while restoring a multi-year
 * history into ZakApp. Both are silent-data-loss bugs on the restore path,
 * which is the last line of defence for a user who has already lost data once.
 *
 * All amounts here are synthetic. A real user's figures do not belong in this
 * repository — it is public, and a test fixture is still a publication.
 */
import { describe, it, expect } from 'vitest';
import { MigrationService } from '../../services/migrationService';

describe('backup restore preserves the year-over-year record', () => {
    it('keeps assetBreakdown through adaptNisabRecords', () => {
        const raw = [{
            id: 'n1',
            hawlStartDate: '2020-03-01T00:00:00.000Z',
            nisabBasis: 'GOLD',
            totalWealth: 100000,
            zakatableWealth: 75000,
            zakatAmount: 1875,
            currency: 'USD',
            status: 'FINALIZED',
            assetBreakdown: JSON.stringify({ cash: 25000, investment: 50000, crypto: 25000 }),
        }];

        const [out] = MigrationService.adaptNisabRecords(raw);

        // The annual summary PDF's breakdown table and the year-over-year
        // charts read this field. Dropping it collapsed a restored history to
        // a single flat asset list - the exact thing the record exists to show.
        expect(out.assetBreakdown).toBe(raw[0].assetBreakdown);
        expect(JSON.parse(out.assetBreakdown).investment).toBe(50000);
    });

    it('keeps the other declared fields the export writes', () => {
        const raw = [{
            id: 'n2',
            hawlStartDate: '2021-03-01T00:00:00.000Z',
            totalWealth: 200000,
            zakatableWealth: 150000,
            zakatAmount: 3750,
            totalLiabilities: 20000,
            nisabThresholdAtStart: '5000.00',
            methodologyUsed: 'standard',
            calculationDate: '2021-03-01T00:00:00.000Z',
            gregorianYear: 2021,
            isPrimary: true,
            userNotes: 'rolled over',
            calculationDetails: JSON.stringify({ needsReview: ['hawlStartDate'] }),
        }];

        const [out] = MigrationService.adaptNisabRecords(raw);

        expect(out.totalLiabilities).toBe(20000);
        expect(out.nisabThresholdAtStart).toBe('5000.00');
        expect(out.methodologyUsed).toBe('standard');
        expect(out.gregorianYear).toBe(2021);
        expect(out.isPrimary).toBe(true);
        expect(out.userNotes).toBe('rolled over');
        expect(out.calculationDetails).toBe(raw[0].calculationDetails);
    });

    it('still refuses an encrypted amount rather than writing a wrong one', () => {
        const raw = [{
            id: 'n3', hawlStartDate: '2022-03-01T00:00:00.000Z',
            totalWealth: 'ZK1:abc:def', zakatableWealth: 1, zakatAmount: 1,
        }];
        expect(() => MigrationService.adaptNisabRecords(raw)).toThrow(/encrypted/i);
    });

    it('tolerates older exports that omit the optional fields', () => {
        const raw = [{
            id: 'n4', hawlStartDate: '2023-03-01T00:00:00.000Z',
            totalWealth: 300000, zakatableWealth: 225000, zakatAmount: 5625,
        }];
        const [out] = MigrationService.adaptNisabRecords(raw);
        expect(out.assetBreakdown).toBe('');
        expect(out.totalLiabilities).toBe(0); // absent, not unreadable
        expect(out.isPrimary).toBe(false);
    });
});
