/**
 * Copyright (c) 2024 ZakApp Contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import React, { useState, useEffect } from 'react';
import { DataSeeder } from '../utils/DataSeeder';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import toast from 'react-hot-toast';
import { useDb } from '../db';
import { Layout } from '../components/layout/Layout';

export const SeederPage: React.FC = () => {
    const db = useDb();
    const [isLoading, setIsLoading] = useState(false);

    const [counts, setCounts] = useState({
        assets: 0,
        payments: 0,
        nisab: 0
    });

    // Simple polling/refresh effect since we don't have rxdb-hooks
    const refreshCounts = async () => {
        if (!db) return;
        try {
            // Note: exec() needed for some RxDB versions to return promise of results
            const [assetRes, paymentRes, nisabRes] = await Promise.all([
                db.assets.find().exec(),
                db.payment_records.find().exec(),
                db.nisab_year_records.find().exec()
            ]);

            setCounts({
                assets: assetRes.length,
                payments: paymentRes.length,
                nisab: nisabRes.length
            });
        } catch (e) {
            console.error('Failed to fetch counts', e);
        }
    };

    // Subscriptions to changes
    useEffect(() => {
        if (!db) return;

        refreshCounts();

        // Subscribe to changes in collections
        const subs = [
            db.assets.$.subscribe(() => refreshCounts()),
            db.payment_records.$.subscribe(() => refreshCounts()),
            db.nisab_year_records.$.subscribe(() => refreshCounts())
        ];

        return () => {
            subs.forEach(s => s.unsubscribe());
        };
    }, [db]);

    const handleAction = async (actionName: string, actionFn: () => Promise<void>) => {
        setIsLoading(true);
        const toastId = toast.loading(`${actionName}...`);
        try {
            await actionFn();
            toast.success(`${actionName} complete!`, { id: toastId });
            refreshCounts(); // Force refresh
        } catch (error: any) {
            console.error(error);
            toast.error(`Error: ${error.message}`, { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">🌩️ Stress Test Control Center</h1>
                    <p className="text-gray-600 mt-2">
                        Use this panel to flood the local database with dummy data for performance and sync testing.
                        <br />
                        <span className="text-red-600 font-semibold">⚠️ WARNING: This will affect your local database!</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Status Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Database Statistics</CardTitle>
                            <CardDescription>Current record counts in local RxDB</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium text-gray-700">Assets</span>
                                    <span className="text-2xl font-bold text-primary-600">{counts.assets}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium text-gray-700">Payments</span>
                                    <span className="text-2xl font-bold text-primary-600">{counts.payments}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium text-gray-700">Nisab Records</span>
                                    <span className="text-2xl font-bold text-primary-600">{counts.nisab}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Seeding Actions</CardTitle>
                            <CardDescription>Generate random encrypted data</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => handleAction('Seeding 10 Assets', () => DataSeeder.seedAssets(10))}
                                disabled={isLoading}
                            >
                                🌱 Seed 10 Assets (Light)
                            </Button>

                            <Button
                                className="w-full"
                                onClick={() => handleAction('Seeding 1,000 Assets', () => DataSeeder.seedAssets(1000))}
                                disabled={isLoading}
                            >
                                🌩️ Seed 1,000 Assets (Heavy)
                            </Button>

                            <div className="flex gap-2">
                                <Button
                                    className="flex-1"
                                    variant="secondary"
                                    onClick={() => handleAction('Seeding 500 Payments', () => DataSeeder.seedPayments(500))}
                                    disabled={isLoading}
                                >
                                    💸 500 Payments
                                </Button>
                                <Button
                                    className="flex-1"
                                    variant="secondary"
                                    onClick={() => handleAction('Seeding 10 Years History', () => DataSeeder.seedNisabHistory(10))}
                                    disabled={isLoading}
                                >
                                    📅 10 Years History
                                </Button>
                            </div>

                            <hr className="my-4 border-gray-100" />

                            <Button
                                className="w-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border-red-200"
                                variant="destructive"
                                onClick={() => handleAction('Clearing Database', DataSeeder.clearAllData)}
                                disabled={isLoading}
                            >
                                🗑️ Clear All Data (Reset)
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};
