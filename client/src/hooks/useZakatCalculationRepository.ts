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

import { useState, useEffect } from 'react';
import { useDb } from '../db';
import { useAuth } from '../contexts/AuthContext';
import { map } from 'rxjs/operators';

export interface ZakatCalculationRecord {
    id: string;
    userId: string;
    calculationDate: string;
    methodology: string;
    calendarType: string;
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    nisabThreshold: number;
    nisabSource: string;
    isZakatObligatory: boolean;
    zakatAmount: number;
    zakatRate: number;
    breakdown: string; // Encrypted JSON
    assetsIncluded: string; // Encrypted JSON
    liabilitiesIncluded: string; // Encrypted JSON
    createdAt: string;
}

export function useZakatCalculationRepository() {
    const db = useDb();
    const { user } = useAuth();
    const [calculations, setCalculations] = useState<ZakatCalculationRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!db) return;

        const sub = db.zakat_calculations.find({
            selector: {},
            sort: [{ calculationDate: 'desc' }]
        }).$
            .pipe(
                map((docs: any[]) => docs.map((doc: any) => doc.toJSON()))
            )
            .subscribe({
                next: (data: ZakatCalculationRecord[]) => {
                    setCalculations(data);
                    setIsLoading(false);
                },
                error: (err: any) => {
                    setError(err);
                    setIsLoading(false);
                }
            });

        return () => sub.unsubscribe();
    }, [db]);

    const addCalculation = async (calc: Partial<ZakatCalculationRecord>) => {
        if (!db) throw new Error('Database not initialized');
        if (!user || !user.id) throw new Error('User not authenticated');

        const newCalc = {
            ...calc,
            id: calc.id || crypto.randomUUID(),
            userId: user.id,
            createdAt: new Date().toISOString()
        };

        return db.zakat_calculations.insert(newCalc);
    };

    const bulkAddCalculations = async (recordsToAdd: Partial<ZakatCalculationRecord>[]) => {
        if (!db) throw new Error('Database not initialized');
        const refinedRecords = recordsToAdd.map(r => ({
            ...r,
            id: r.id || crypto.randomUUID(),
            userId: r.userId || user?.id || 'local-user',
            createdAt: r.createdAt || new Date().toISOString()
        }));

        const result = await db.zakat_calculations.bulkUpsert(refinedRecords);
        if (result.error && result.error.length > 0) {
            console.error('Calculation Import Errors:', result.error);
            throw new Error(`${result.error.length} calculations failed validation`);
        }
        return result;
    };

    const removeCalculation = async (id: string) => {
        if (!db) throw new Error('Database not initialized');
        const doc = await db.zakat_calculations.findOne(id).exec();
        if (doc) {
            return doc.remove();
        }
    };

    return { calculations, isLoading, error, addCalculation, bulkAddCalculations, removeCalculation };
}
