import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter, Button, LoadingSpinner } from '../ui';
import { Upload, Download, FileJson, AlertTriangle, CheckCircle, Database } from 'lucide-react';
import { useAssetRepository } from '../../hooks/useAssetRepository';
import { usePaymentRepository } from '../../hooks/usePaymentRepository';
import { useNisabRecordRepository } from '../../hooks/useNisabRecordRepository';
import { MigrationService } from '../../services/migrationService';

export const UnifiedImportExport: React.FC = () => {
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [stats, setStats] = useState<{ assets: number; payments: number; nisabRecords: number; errors: string[] } | null>(null);

    const { assets, addAsset } = useAssetRepository();
    const { payments, bulkAddPayments } = usePaymentRepository();
    const { records: nisabRecords, addRecord, bulkAddRecords } = useNisabRecordRepository();

    const handleExport = () => {
        setExporting(true);
        try {
            const data = {
                version: "2.0", // Bump version for new unified format
                exportDate: new Date().toISOString(),
                stats: {
                    assets: assets.length,
                    payments: payments.length,
                    nisabRecords: nisabRecords.length
                },
                assets,
                payments,
                nisabRecords
            };

            const jsonContent = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `zakapp-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success('Backup downloaded successfully');
        } catch (error) {
            console.error('Export failed', error);
            toast.error('Failed to export data');
        } finally {
            setExporting(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setStats(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const rawData = JSON.parse(event.target?.result as string);
                const errors: string[] = [];
                let assetCount = 0;
                let paymentCount = 0;

                // 1. Migrate Assets
                if (rawData.assets && Array.isArray(rawData.assets)) {
                    const cleanAssets = MigrationService.adaptAssets(rawData.assets);
                    const results = await Promise.allSettled(cleanAssets.map(a => addAsset(a)));

                    results.forEach(res => {
                        if (res.status === 'fulfilled') assetCount++;
                        else errors.push(`Asset Error: ${res.reason}`);
                    });
                }

                // 2. Migrate Payments
                if (rawData.payments && Array.isArray(rawData.payments)) {
                    // Try to find a sensible default snapshot ID (e.g., current active record)
                    const activeRecord = nisabRecords.find(r => r.status === 'DRAFT'); // Use DRAFT as active
                    const defaultSnapshotId = activeRecord?.id;

                    const cleanPayments = MigrationService.adaptPayments(rawData.payments, 'local-user', defaultSnapshotId);

                    try {
                        await bulkAddPayments(cleanPayments);
                        paymentCount += cleanPayments.length;
                    } catch (err: any) {
                        errors.push(`Payment Batch Error: ${err.message}`);
                    }
                }

                // 3. Migrate Nisab Records
                let nisabCount = 0;
                if (rawData.nisabRecords && Array.isArray(rawData.nisabRecords)) {
                    try {
                        const cleanRecords = MigrationService.adaptNisabRecords(rawData.nisabRecords);
                        await bulkAddRecords(cleanRecords);
                        nisabCount += cleanRecords.length;
                    } catch (err: any) {
                        errors.push(`Nisab Record Batch Error: ${err.message}`);
                    }
                }

                setStats({ assets: assetCount, payments: paymentCount, nisabRecords: nisabCount, errors });

                if (errors.length === 0) {
                    toast.success(`Successfully imported ${assetCount} assets, ${paymentCount} payments, and ${nisabCount} records.`);
                } else {
                    toast.error(`Import completed with ${errors.length} errors.`);
                }

            } catch (err: any) {
                console.error('Import parse error', err);
                toast.error('Failed to parse backup file');
                setStats({ assets: 0, payments: 0, nisabRecords: 0, errors: [err.message] });
            } finally {
                setImporting(false);
                e.target.value = ''; // Reset input
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Database className="w-6 h-6 text-green-600" />
                        <CardTitle>Data Management (Unified)</CardTitle>
                    </div>
                    <CardDescription>
                        Backup your entire vault or import data from older ZakApp versions.
                        The "Smart Import" feature will automatically fix legacy data structures.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center gap-3">
                            <Download className="w-8 h-8 text-gray-400" />
                            <div className="text-center">
                                <h3 className="font-medium text-gray-900">Backup Vault</h3>
                                <p className="text-xs text-gray-500 mb-3">
                                    Exports Assets, Payments, and History ({assets.length + payments.length} records)
                                </p>
                                <Button onClick={handleExport} disabled={exporting} variant="outline" className="w-full">
                                    {exporting ? <LoadingSpinner size="sm" /> : 'Download JSON Backup'}
                                </Button>
                            </div>
                        </div>

                        <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center gap-3">
                            <Upload className="w-8 h-8 text-gray-400" />
                            <div className="text-center">
                                <h3 className="font-medium text-gray-900">Restore / Import</h3>
                                <p className="text-xs text-gray-500 mb-3">
                                    Accepts legacy v1.0 and new v2.0 backups
                                </p>
                                <div className="relative">
                                    <Button disabled={importing} variant="default" className="w-full">
                                        {importing ? <LoadingSpinner size="sm" /> : 'Select File'}
                                    </Button>
                                    <input
                                        type="file"
                                        onChange={handleImport}
                                        accept=".json"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        disabled={importing}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {stats && (
                        <div className={`mt-4 p-4 rounded-lg border ${stats.errors.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                            <div className="flex items-start gap-3">
                                {stats.errors.length > 0 ? <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0" /> : <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />}
                                <div>
                                    <h4 className={`font-medium ${stats.errors.length > 0 ? 'text-yellow-800' : 'text-green-800'}`}>
                                        Import Report
                                    </h4>
                                    <p className="text-sm text-gray-700 mt-1">
                                        Imported <strong>{stats.assets}</strong> assets, <strong>{stats.payments}</strong> payments, and <strong>{stats.nisabRecords}</strong> Nisab records.
                                    </p>
                                    {stats.errors.length > 0 && (
                                        <div className="mt-2 text-xs text-red-600 max-h-32 overflow-y-auto">
                                            <p className="font-semibold mb-1">Errors ({stats.errors.length}):</p>
                                            <ul className="list-disc pl-4 space-y-1">
                                                {stats.errors.map((e, i) => <li key={i}>{e}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
