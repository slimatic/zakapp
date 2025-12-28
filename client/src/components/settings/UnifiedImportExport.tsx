import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter, Button, LoadingSpinner } from '../ui';
import { Upload, Download, FileJson, AlertTriangle, CheckCircle, Database, Trash2 } from 'lucide-react';
import { useAssetRepository } from '../../hooks/useAssetRepository';
import { usePaymentRepository } from '../../hooks/usePaymentRepository';
import { useNisabRecordRepository } from '../../hooks/useNisabRecordRepository';
import { useLiabilityRepository } from '../../hooks/useLiabilityRepository';
import { useZakatCalculationRepository } from '../../hooks/useZakatCalculationRepository';
import { useUserSettingsRepository } from '../../hooks/useUserSettingsRepository';
import { MigrationService } from '../../services/migrationService';
import { useAuth } from '../../contexts/AuthContext';
import { useDataCleanup } from '../../hooks/useDataCleanup';
import { Modal } from '../ui/Modal';

export const UnifiedImportExport: React.FC = () => {
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const { clearAllData, isClearing } = useDataCleanup();

    const [stats, setStats] = useState<{
        assets: number;
        payments: number;
        nisabRecords: number;
        liabilities: number;
        calculations: number;
        settings: boolean;
        errors: string[]
    } | null>(null);

    const { user } = useAuth();
    const { assets, addAsset } = useAssetRepository();
    const { payments, bulkAddPayments } = usePaymentRepository();
    const { records: nisabRecords, addRecord, bulkAddRecords } = useNisabRecordRepository();
    const { liabilities, bulkAddLiabilities } = useLiabilityRepository();
    const { calculations, bulkAddCalculations } = useZakatCalculationRepository();
    const { settings, updateSettings } = useUserSettingsRepository();

    const handleExport = () => {
        setExporting(true);
        try {
            const data = {
                version: "2.5",
                exportDate: new Date().toISOString(),
                stats: {
                    assets: assets.length,
                    payments: payments.length,
                    nisabRecords: nisabRecords.length,
                    liabilities: liabilities.length,
                    calculations: calculations.length,
                    hasSettings: !!settings
                },
                assets,
                payments,
                nisabRecords,
                liabilities,
                calculations,
                settings
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
                const parsed = JSON.parse(event.target?.result as string);

                const rawData = parsed.data && !Array.isArray(parsed.data) ? parsed.data : parsed;
                if (parsed.settings && !rawData.settings) rawData.settings = parsed.settings;

                const errors: string[] = [];
                let assetCount = 0;
                let paymentCount = 0;

                const targetUserId = user?.id || 'local-user';

                // 1. Migrate Assets
                if (rawData.assets && Array.isArray(rawData.assets)) {
                    const cleanAssets = MigrationService.adaptAssets(rawData.assets, targetUserId);
                    const results = await Promise.allSettled(cleanAssets.map(a => addAsset(a)));

                    results.forEach(res => {
                        if (res.status === 'fulfilled') assetCount++;
                        else errors.push(`Asset Error: ${res.reason}`);
                    });
                }

                // 2. Migrate Payments
                if (rawData.payments && Array.isArray(rawData.payments)) {
                    const activeRecord = nisabRecords.find(r => r.status === 'DRAFT');
                    const defaultSnapshotId = activeRecord?.id;

                    const cleanPayments = MigrationService.adaptPayments(rawData.payments, targetUserId, defaultSnapshotId);

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
                        const cleanRecords = MigrationService.adaptNisabRecords(rawData.nisabRecords, targetUserId);
                        await bulkAddRecords(cleanRecords);
                        nisabCount += cleanRecords.length;
                    } catch (err: any) {
                        errors.push(`Nisab Record Batch Error: ${err.message}`);
                    }
                }

                // 4. Migrate Liabilities
                let liabilityCount = 0;
                if (rawData.liabilities && Array.isArray(rawData.liabilities)) {
                    try {
                        const cleanLiabilities = MigrationService.adaptLiabilities(rawData.liabilities, targetUserId);
                        await bulkAddLiabilities(cleanLiabilities);
                        liabilityCount += cleanLiabilities.length;
                    } catch (err: any) {
                        errors.push(`Liability Batch Error: ${err.message}`);
                    }
                }

                // 5. Migrate Calculations
                let calcCount = 0;
                if (rawData.calculations && Array.isArray(rawData.calculations)) {
                    try {
                        const cleanCalcs = MigrationService.adaptCalculations(rawData.calculations, targetUserId);
                        await bulkAddCalculations(cleanCalcs);
                        calcCount += cleanCalcs.length;
                    } catch (err: any) {
                        errors.push(`Calculation Batch Error: ${err.message}`);
                    }
                }

                // 6. Migrate Settings
                let settingsRestored = false;
                if (rawData.settings) {
                    try {
                        const cleanSettings = MigrationService.adaptUserSettings(rawData.settings, targetUserId);
                        await updateSettings(cleanSettings);
                        settingsRestored = true;
                    } catch (err: any) {
                        errors.push(`Settings Restore Error: ${err.message}`);
                    }
                }

                setStats({
                    assets: assetCount,
                    payments: paymentCount,
                    nisabRecords: nisabCount,
                    liabilities: liabilityCount,
                    calculations: calcCount,
                    settings: settingsRestored,
                    errors
                });

                if (errors.length === 0) {
                    toast.success(`Successfully restored all data collections.`);
                } else {
                    toast.error(`Import completed with ${errors.length} errors.`);
                }

            } catch (err: any) {
                console.error('Import parse error', err);
                toast.error('Failed to parse backup file');
                setStats({ assets: 0, payments: 0, nisabRecords: 0, liabilities: 0, calculations: 0, settings: false, errors: [err.message] });
            } finally {
                setImporting(false);
                e.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleClearData = async () => {
        await clearAllData();
        setIsDeleteModalOpen(false);
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
                        Backup your entire vault, import data, or clear local storage.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 flex flex-col items-center justify-center gap-3">
                            <Download className="w-8 h-8 text-gray-400" />
                            <div className="text-center">
                                <h3 className="font-medium text-gray-900">Backup Vault</h3>
                                <p className="text-xs text-gray-500 mb-3">
                                    Exports Assets, Liabilities, Payments, Calculations, and Settings ({assets.length + liabilities.length + payments.length + calculations.length} records)
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
                                        Imported <strong>{stats.assets}</strong> assets, <strong>{stats.liabilities}</strong> liabilities, <strong>{stats.payments}</strong> payments, <strong>{stats.calculations}</strong> calculations, and <strong>{stats.nisabRecords}</strong> records.
                                        {stats.settings && " User settings were also restored."}
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

                    {/* Danger Zone */}
                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 rounded-full">
                                    <Trash2 className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-red-900">Clear Financial Data</h3>
                                    <p className="text-xs text-red-700 mt-0.5">
                                        Permanently delete all assets, liabilities, and records from this device. Account stays active.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setIsDeleteModalOpen(true)}
                            >
                                Clear Data
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Clear All Data?"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">
                            This action is <strong>irreversible</strong>. All your tracking data (Assets, Liabilities, Payments, History) will be wiped from the database.
                        </p>
                    </div>

                    <p className="text-sm text-gray-600">
                        Please confirm you have downloaded a backup before proceeding.
                    </p>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isClearing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleClearData}
                            isLoading={isClearing}
                        >
                            Yes, Clear Everything
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
