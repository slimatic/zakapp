/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * The Hawl statement's money rows read the record's stored engine figures.
 *
 * The builder takes no asset or liability lists — that is the pin itself:
 * the statement renders what the record holds, so no second recipe over raw
 * lists can contradict the stored Zakatable Wealth and Zakat Due on the page.
 * All figures below are synthetic.
 */
import { describe, it, expect } from 'vitest';
import { hawlStatementRows } from '../ReportGenerator';

const SyntheticRecord = {
    id: 'record-1',
    status: 'FINALIZED',
    hijriYear: 1445,
    hawlStartDate: '2024-01-01T00:00:00.000Z',
    hawlCompletionDate: '2025-01-01T00:00:00.000Z',
};

const labels = (rows: [string, string][]) => rows.map(([label]) => label);
const valueOf = (rows: [string, string][], label: string) =>
    rows.find(([rLabel]) => rLabel === label)?.[1];

describe('hawlStatementRows reads the record', () => {
    it('prints the stored figures, once, with one recipe', () => {
        const record = {
            ...SyntheticRecord,
            totalWealth: 100000,
            zakatableWealth: 40000,
            zakatAmount: 1000,
        };
        const { summaryRows, financialRows } = hawlStatementRows(record, 'A Person', 'USD');

        // The statement states each engine figure exactly once.
        expect(financialRows).toEqual([
            ['Total Wealth', '$100,000.00'],
            ['Net Zakatable Wealth', '$40,000.00'],
            ['Zakat Due (2.5%)', '$1,000.00'],
        ]);
        expect(labels(summaryRows)).toEqual(
            expect.arrayContaining(['Beneficiary', 'Hawl Period', 'Status'])
        );
        // No second derivation of the same quantity under a second label.
        const financialLabels = labels(financialRows);
        expect(financialLabels).not.toContain('Zakatable Assets');
        expect(financialLabels).not.toContain('Total Liabilities');
    });

    it('the nisab threshold row is attached when the stored threshold is readable', () => {
        const record = {
            ...SyntheticRecord,
            nisabThresholdAtStart: '5000',
            totalWealth: 100000,
        };
        const { summaryRows } = hawlStatementRows(record, 'A Person', 'USD');
        expect(valueOf(summaryRows, 'Nisab Threshold')).toBe('$5,000.00');
    });

    it('a recorded liabilities total prints when the record stores one', () => {
        // Imported records carry a stored liabilities figure (schema field,
        // not a recompute). It must not print for a record that has none.
        const stored: [string, string][] = hawlStatementRows(
            { ...SyntheticRecord, totalWealth: 100000, totalLiabilities: 400 }, 'A Person', 'USD'
        ).financialRows;
        expect(valueOf(stored, 'Total Liabilities (recorded)')).toBe('$400.00');

        const absent: [string, string][] = hawlStatementRows(
            { ...SyntheticRecord, totalWealth: 100000 }, 'A Person', 'USD'
        ).financialRows;
        expect(labels(absent)).not.toContain('Total Liabilities (recorded)');
    });

    it('an unreadable figure is omitted, never printed as a zero', () => {
        // A legacy record can carry an unreadable (e.g. encrypted) string in
        // place of a number. A missing row is honest; a confident zero is not.
        const record = {
            ...SyntheticRecord,
            totalWealth: 'ZK1:unreadable',
            zakatableWealth: '',
            // Whitespace-only strings are NOT zero — Number('  ') is 0 on
            // unguarded conversion, so the blank must be caught before it.
            zakatAmount: '   ',
        };
        const { summaryRows, financialRows } = hawlStatementRows(record, 'A Person', 'USD');
        expect(financialRows).toEqual([]);
        // An empty string is not a readable threshold either.
        expect(labels(summaryRows)).not.toContain('Nisab Threshold');
    });

    it('every figure can be absent without inventing a zero', () => {
        const { financialRows } = hawlStatementRows({ ...SyntheticRecord }, 'A Person', 'USD');
        expect(financialRows).toEqual([]);
    });
});