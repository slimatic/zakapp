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

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, LoadingSpinner } from '../ui';
import { Upload, Download, AlertTriangle, CheckCircle, Database, Trash2 } from 'lucide-react';
import { useAssetRepository } from '../../hooks/useAssetRepository';
import { usePaymentRepository } from '../../hooks/usePaymentRepository';
import { useNisabRecordRepository } from '../../hooks/useNisabRecordRepository';
import { useLiabilityRepository } from '../../hooks/useLiabilityRepository';
import { useUserSettingsRepository } from '../../hooks/useUserSettingsRepository';
import { MigrationService } from '../../services/migrationService';
import { findEncryptedLeaks } from '../../utils/parseDecimal';
import { useAuth } from '../../contexts/AuthContext';
import { useDataCleanup } from '../../hooks/useDataCleanup';
import { useDb } from '../../db';
import { getQuota } from '../../hooks/useRepositoryLimits';
import { resolveVaultSalt } from '../../services/VaultRekey';
import { Modal } from '../ui/Modal';

export const UnifiedImportExport: React.FC = () => {
    const [importing, setImporting] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [exportedThisSession, setExportedThisSession] = useState(false);

    /**
     * A file whose asset ids do not match what is stored. Held here rather than
     * imported, because only the user can say whether the existing rows should be
     * kept: the file and the account hold the same accounts under different ids, and
     * nothing in the payload can tell "a second copy" from "the same data, renamed".
     */
    const [pendingImport, setPendingImport] = useState<{
        json: string;
        fileName: string;
        stored: number;
        incoming: number;
    } | null>(null);
    const { clearAllData, isClearing } = useDataCleanup();

    const [stats, setStats] = useState<{
        assets: number;
        payments: number;
        nisabRecords: number;
        liabilities: number;
        calculations: number;
        settings: boolean;
        errors: string[];
        /** Rows the file held that did not fit, named per category. */
        skipped: string[];
    } | null>(null);

    const { user } = useAuth();
    const db = useDb();
    const { assets, addAsset } = useAssetRepository();
    const { payments, bulkAddPayments } = usePaymentRepository();
    const { records: nisabRecords, bulkAddRecords } = useNisabRecordRepository();
    const { liabilities, bulkAddLiabilities } = useLiabilityRepository();
    const { settings, updateSettings } = useUserSettingsRepository();

    const handleExport = async () => {
        setExporting(true);
        try {
            // The salt decides the vault key, and it lives only on the server and in
            // this browser's localStorage. A backup that omits it cannot be restored
            // on a new device, which is exactly when a backup is needed — the device
            // has never seen the salt, so the importer has nothing to derive a key
            // from and the restored rows stay unreadable. It is not a secret (the
            // server already returns it in plaintext), so carrying it costs nothing.
            const salt = await resolveVaultSalt(user?.id ?? '', user as any).catch(() => null);

            const data = {
                // Bumped to 4.0 to carry `salt`. The importer reads fields and never
                // gates on the version, so a 1.x–3.x file still restores; it simply
                // has no salt, and the user must be on a device that already has one.
                // Do not bump this without extending the importer in the same change.
                version: '4.0',
                exportDate: new Date().toISOString(),
                salt: salt ?? null,
                stats: {
                    assets: assets.length,
                    payments: payments.length,
                    nisabRecords: nisabRecords.length,
                    liabilities: liabilities.length,
                    calculations: 0,
                    hasSettings: !!settings,
                    hasSalt: !!salt
                },
                assets,
                payments,
                nisabRecords,
                liabilities,
                settings
            };

            const jsonContent = JSON.stringify(data, null, 2);

            // A backup that quietly ships ciphertext where a number belongs is
            // worse than no backup: the user only finds out when they need it.
            // Fail loudly here instead.
            const leaks = findEncryptedLeaks(data);
            if (leaks.length > 0) {
                console.error('Backup contains encrypted values', leaks);
                toast.error(
                    `Backup not created: ${leaks.length} field(s) are still encrypted. ` +
                    `Unlock your vault, then export again.`,
                    { duration: 8000 }
                );
                return;
            }

            const blob = new Blob([jsonContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `zakapp-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            setExportedThisSession(true);
            // Reinforce at the moment of download, not just on the card: this is the
            // last point where the user still has the file's contents in mind.
            toast.success(
                'Backup downloaded. It is NOT encrypted - anyone who opens the file can read it, so store it safely.',
                { duration: 8000 }
            );
        } catch (error) {
            console.error('Export failed', error);
            toast.error('Failed to export data');
        } finally {
            setExporting(false);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>, replaceRequested = false) => {
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
                const skipped: string[] = [];

                const targetUserId = user?.id || 'local-user';

                // Restore the backup's salt when this device does not already hold the
                // same one. Without this a restore on a new device writes every row
                // under a key derived from a salt the device invented, so the data it
                // just imported is unreadable on the device that imported it. Written
                // before the first row so nothing is encrypted under the wrong key.
                //
                // Never overwrites a salt already on the device: that key decrypts the
                // rows here, and replacing it would strand them to fix a problem the
                // user does not have. A file with no salt (1.x–3.x) still imports; it
                // simply relies on the device already holding one.
                const incomingSalt = typeof parsed.salt === 'string' ? parsed.salt : null;
                if (incomingSalt) {
                    const existing = await resolveVaultSalt(targetUserId, user as any).catch(() => null);
                    if (!existing) {
                        try {
                            localStorage.setItem(`zakapp_salt_${targetUserId}`, incomingSalt);
                            toast(
                                'This backup carried your data key. It has been restored to this device, ' +
                                'so the data is readable here. Sign out and back in to use it.',
                                { icon: '🔑', duration: 12000 }
                            );
                        } catch {
                            errors.push(
                                'Could not save the data key from this backup (browser storage unavailable). ' +
                                'The imported records may show as encrypted on this device.'
                            );
                        }
                    }
                }

                // Assets insert rather than upsert, so a file whose ids do not match
                // what is here would ADD a second set and roughly double net worth.
                // The user decides: replace (clear this account's categories, then
                // import) or merge (upsert by id, which does nothing for a file whose
                // ids are all new). A restore where every id is new and nothing is
                // stored is unambiguous and just imports.
                if (rawData.assets && Array.isArray(rawData.assets) && db && !replaceRequested) {
                    const incomingIds = rawData.assets.map((a: any) => a.id).filter(Boolean);
                    const stored = await db.assets
                        .find({ selector: { userId: { $eq: targetUserId } } })
                        .exec();
                    const storedIds = new Set(stored.map((d: any) => d.get('id')));
                    const overlap = incomingIds.filter((id: string) => storedIds.has(id)).length;

                    if (storedIds.size > 0 && incomingIds.length > 0 && overlap === 0) {
                        setPendingImport({
                            json: event.target?.result as string,
                            fileName: file.name,
                            stored: storedIds.size,
                            incoming: incomingIds.length
                        });
                        setImporting(false);
                        e.target.value = '';
                        return;
                    }
                }

                if (replaceRequested) {
                    // Cleared without the reload: the page must survive the write that
                    // follows, or the restore is torn down half-applied.
                    await clearAllData({ reload: false });
                }

                // 1. Migrate Assets
                if (rawData.assets && Array.isArray(rawData.assets)) {
                    const cleanAssets = MigrationService.adaptAssets(rawData.assets, targetUserId);

                    // `addAsset` refuses per row once the limit is reached, so a
                    // 25 asset file against a 20 asset limit imported 20 and reported
                    // 5 errors. Take what fits and name what did not, rather than
                    // letting the row-level refusal look like a failure.
                    const quota = db
                        ? await getQuota('assets', db.assets, user, targetUserId)
                        : { max: undefined, used: 0, remaining: Infinity };
                    const accepted = quota.remaining === Infinity
                        ? cleanAssets
                        : cleanAssets.slice(0, quota.remaining);
                    if (accepted.length < cleanAssets.length) {
                        skipped.push(
                            `${cleanAssets.length - accepted.length} assets — your limit is ${quota.max} ` +
                            `and you already hold ${quota.used}. Remove some, then import this file again.`
                        );
                    }

                    const results = await Promise.allSettled(accepted.map(a => addAsset(a)));

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
                        const outcome = await bulkAddPayments(cleanPayments);
                        paymentCount += outcome.saved;
                        if (outcome.skipped > 0) {
                            skipped.push(`${outcome.skipped} payments — see the assets note above.`);
                        }
                    } catch (err: any) {
                        errors.push(`Payment Batch Error: ${err.message}`);
                    }
                }

                // 3. Migrate Nisab Records
                let nisabCount = 0;
                if (rawData.nisabRecords && Array.isArray(rawData.nisabRecords)) {
                    try {
                        const cleanRecords = MigrationService.adaptNisabRecords(rawData.nisabRecords, targetUserId);
                        const outcome = await bulkAddRecords(cleanRecords);
                        nisabCount += outcome.saved;
                        if (outcome.skipped > 0) {
                            skipped.push(`${outcome.skipped} annual records — see the assets note above.`);
                        }
                    } catch (err: any) {
                        errors.push(`Nisab Record Batch Error: ${err.message}`);
                    }
                }

                // 4. Migrate Liabilities
                let liabilityCount = 0;
                if (rawData.liabilities && Array.isArray(rawData.liabilities)) {
                    try {
                        const cleanLiabilities = MigrationService.adaptLiabilities(rawData.liabilities, targetUserId);
                        const outcome = await bulkAddLiabilities(cleanLiabilities);
                        liabilityCount += outcome.saved;
                        if (outcome.skipped > 0) {
                            skipped.push(`${outcome.skipped} liabilities — see the assets note above.`);
                        }
                    } catch (err: any) {
                        errors.push(`Liability Batch Error: ${err.message}`);
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
                    calculations: 0,
                    settings: settingsRestored,
                    errors,
                    skipped
                });

                if (skipped.length > 0) {
                    toast(
                        `Imported what fits. ${skipped.join(' ')}`,
                        { icon: '⚠️', duration: 14000 }
                    );
                } else if (errors.length === 0) {
                    toast.success(`Successfully restored all data collections.`);
                }

                if (errors.length === 0) {
                    // The plaintext file on disk is now redundant, and it is the most
                    // exposed copy of this data that exists. Say so while the user is
                    // still in the flow.
                    toast(
                        'Your imported data is now encrypted in your vault. You can delete the backup file you just used.',
                        { icon: '🔒', duration: 9000 }
                    );
                } else {
                    toast.error(`Import completed with ${errors.length} errors.`);
                }

            } catch (err: any) {
                console.error('Import parse error', err);
                toast.error('Failed to parse backup file');
                setStats({ assets: 0, payments: 0, nisabRecords: 0, liabilities: 0, calculations: 0, settings: false, errors: [err.message], skipped: [] });
            } finally {
                setImporting(false);
                e.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    /**
     * Resolve the held import. Both branches re-run `handleImport` on a File rebuilt
     * from the held text, so the retry travels the identical path rather than a
     * second, parallel implementation that would drift.
     */
    const resolvePendingImport = async (mode: 'replace' | 'merge') => {
        const pending = pendingImport;
        if (!pending) return;
        setPendingImport(null);

        const file = new File([pending.json], pending.fileName || 'backup.json', { type: 'application/json' });
        // React's synthetic event is pooled, so build a minimal stand-in rather than
        // retaining the original. Only `target.files[0]` and `target.value` are read.
        const target = { files: [file], value: '' } as unknown as HTMLInputElement;
        const synthetic = { target } as React.ChangeEvent<HTMLInputElement>;

        if (mode === 'replace') {
            await handleImport(synthetic, true);
        } else {
            await handleImport(synthetic, false);
        }
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
                        <Database className="w-6 h-6 text-success" />
                        <CardTitle>Data Management (Unified)</CardTitle>
                    </div>
                    <CardDescription>
                        Backup your entire vault, import data, or clear local storage.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-dashed border-border rounded-lg bg-muted flex flex-col items-center justify-center gap-3">
                            <Download className="w-8 h-8 text-muted-foreground/70" />
                            <div className="text-center">
                                <h3 className="font-medium text-card-foreground">Backup Vault</h3>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Exports Assets, Liabilities, Payments, Settings and your data key
                                    ({assets.length + liabilities.length + payments.length} records)
                                </p>
                                <Button onClick={handleExport} disabled={exporting} variant="outline" className="w-full">
                                    {exporting ? <LoadingSpinner size="sm" /> : 'Download JSON Backup'}
                                </Button>

                                {/*
                                    The file is plaintext by design, so the user can restore it without the
                                    vault key - the one moment they need a backup is the moment they may no
                                    longer have the password. That trade-off is theirs to make knowingly,
                                    which means saying it here rather than after they have downloaded it.
                                */}
                                <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5 text-left">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-warn-strong" aria-hidden="true" />
                                    <span>
                                        Not encrypted. Your amounts and details are readable in this file without
                                        your password, so anyone who gets it can read them. That is why it can be
                                        restored even if you forget your password. Keep it somewhere safe, and
                                        delete it once you have imported it.
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="p-4 border border-dashed border-border rounded-lg bg-muted flex flex-col items-center justify-center gap-3">
                            <Upload className="w-8 h-8 text-muted-foreground/70" />
                            <div className="text-center">
                                <h3 className="font-medium text-card-foreground">Restore / Import</h3>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Accepts backups from any previous version (1.x–4.x)
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
                        <div className={`mt-4 p-4 rounded-lg border ${stats.errors.length > 0 ? 'bg-warn-soft border-warn/30' : 'bg-success-soft border-success/30'}`}>
                            <div className="flex items-start gap-3">
                                {stats.errors.length > 0 ? <AlertTriangle className="w-5 h-5 text-warn-strong shrink-0" /> : <CheckCircle className="w-5 h-5 text-success shrink-0" />}
                                <div>
                                    <h4 className={`font-medium ${stats.errors.length > 0 ? 'text-warn-strong' : 'text-success'}`}>
                                        Import Report
                                    </h4>
                                    <p className="text-sm text-card-foreground mt-1">
                                        Imported <strong>{stats.assets}</strong> assets, <strong>{stats.liabilities}</strong> liabilities, <strong>{stats.payments}</strong> payments, <strong>{stats.calculations}</strong> calculations, and <strong>{stats.nisabRecords}</strong> records.
                                        {stats.settings && " User settings were also restored."}
                                    </p>
                                    {stats.errors.length > 0 && (
                                        <div className="mt-2 text-xs text-danger max-h-32 overflow-y-auto">
                                            <p className="font-semibold mb-1">Errors ({stats.errors.length}):</p>
                                            <ul className="list-disc ps-4 space-y-1">
                                                {stats.errors.map((e, i) => <li key={i}>{e}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {stats.skipped && stats.skipped.length > 0 && (
                                        <div className="mt-2 text-xs text-warn-strong">
                                            <p className="font-semibold mb-1">Not imported:</p>
                                            <ul className="list-disc ps-4 space-y-1">
                                                {stats.skipped.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                            <p className="mt-1">
                                                These rows are still in your file. Free the space, then import it again.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Danger Zone */}
                    <div className="border-t border-border pt-6">
                        <div className="flex items-center justify-between p-4 bg-danger-soft border border-danger/30 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-danger-soft rounded-full">
                                    <Trash2 className="w-5 h-5 text-danger" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-danger">Clear Financial Data</h3>
                                    <p className="text-xs text-danger mt-0.5">
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

            {/* Import mode choice. Neither option is safe to default: merge leaves a
                file whose ids are all new with nothing to attach to, and replace
                discards rows the user may not have expected to lose. */}
            <Modal
                isOpen={!!pendingImport}
                onClose={() => setPendingImport(null)}
                title="Replace or merge?"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-sm text-card-foreground">
                        This backup holds <strong>{pendingImport?.incoming}</strong> assets, and none of
                        their ids match the <strong>{pendingImport?.stored}</strong> assets already here.
                        The same accounts are most likely stored under different ids, so importing as-is
                        would keep both copies and roughly double your net worth.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        <strong className="text-card-foreground">Replace</strong> clears your assets,
                        liabilities, payments and annual records on this device, then imports this file.
                        Correct if this backup is the complete picture.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        <strong className="text-card-foreground">Merge</strong> adds the file alongside
                        what is already here. Correct only if these really are additional accounts.
                    </p>
                    <p className="text-xs text-warn-strong">
                        Neither option can be undone. Export a backup first if you are unsure.
                    </p>

                    <div className="flex flex-wrap justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={() => setPendingImport(null)}>
                            Cancel
                        </Button>
                        <Button variant="secondary" onClick={() => resolvePendingImport('merge')}>
                            Merge (add alongside)
                        </Button>
                        <Button variant="destructive" onClick={() => resolvePendingImport('replace')}>
                            Replace (clear, then import)
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Clear All Data?"
                size="sm"
            >
                <div className="space-y-4">
                    <div className="bg-danger-soft p-4 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                        <div className="text-sm text-danger">
                            <p>
                                This action is <strong>irreversible</strong>. All your tracking data (Assets, Liabilities, Payments, History) will be wiped from the database.
                            </p>
                            {/* A wipe here also leaves the vault key without a server-side
                                record to check it against, so a later restore can come back
                                with encrypted text still unreadable. The backup is the only
                                way out, which is why it is a gate rather than a reminder. */}
                            <p className="mt-2">
                                Clearing also removes this device&apos;s record of your data key. Restoring a
                                backup afterwards may leave encrypted fields such as payment recipient
                                names unreadable, even though the amounts return correctly.
                            </p>
                        </div>
                    </div>

                    {!exportedThisSession && (
                        <p className="text-sm text-warn-strong">
                            Download a backup before clearing, so you can restore the data afterwards.
                        </p>
                    )}

                    <div className="flex flex-wrap justify-end gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isClearing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={handleExport}
                            isLoading={exporting}
                            disabled={isClearing}
                        >
                            {exportedThisSession ? 'Download again' : 'Download backup'}
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleClearData}
                            isLoading={isClearing}
                            // Gated on a backup taken in this session, not on a promise. The
                            // key that decrypts what is being deleted is not recoverable
                            // afterwards, so there is no second chance to ask.
                            disabled={!exportedThisSession}
                            title={!exportedThisSession ? 'Download a backup first' : undefined}
                        >
                            Yes, Clear Everything
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
