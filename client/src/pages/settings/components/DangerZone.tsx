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


import { forceResetDatabase, useDb } from '../../../db';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../../services/api';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { useDataCleanup } from '../../../hooks/useDataCleanup';
import { Trash2, AlertTriangle } from 'lucide-react';
import React from 'react';

export const DangerZone: React.FC = () => {
    // ... existing deleteAccountMutation ...
    const [isAccountDeleteModalOpen, setIsAccountDeleteModalOpen] = React.useState(false);
    const [isClearDataModalOpen, setIsClearDataModalOpen] = React.useState(false);
    const [password, setPassword] = React.useState('');
    const [deleteError, setDeleteError] = React.useState<string | null>(null);

    // Phase 6: Secure Remote Purge State
    const [isPurgeCloudModalOpen, setIsPurgeCloudModalOpen] = React.useState(false);
    const [isPurgingCloud, setIsPurgingCloud] = React.useState(false);

    const { clearAllData, isClearing } = useDataCleanup();

    const deleteAccountMutation = useMutation({
        mutationFn: async (password: string) => {
            return apiService.deleteAccount(password);
        },
        onSuccess: async (response) => {
            if (response.success) {
                try {
                    await forceResetDatabase();
                } catch (e) {
                    console.error('Failed to reset local DB during account deletion', e);
                }
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('zakapp_session');
                window.location.href = '/';
            } else {
                setDeleteError(response.message || 'Account deletion failed');
            }
        },
        onError: (error: Error) => {
            setDeleteError(error.message);
        }
    });

    const handleDeleteAccountClick = () => {
        setIsAccountDeleteModalOpen(true);
        setPassword('');
        setDeleteError(null);
    };

    const handleConfirmDeleteAccount = () => {
        if (!password) {
            setDeleteError('Password is required');
            return;
        }
        deleteAccountMutation.mutate(password);
    };

    const handleClearLocalDatabase = async () => {
        const confirmed = window.confirm(
            'This will delete the LOCAL database on this device only. It is useful for fixing sync issues. You will be logged out. Are you sure?'
        );
        if (confirmed) {
            try {
                await forceResetDatabase();
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('zakapp_session');
                window.location.reload();
            } catch (error) {
                console.error('Failed to reset database:', error);
                alert('Failed to reset database. Please check console.');
            }
        }
    };

    const handleConfirmClearData = async () => {
        await clearAllData();
        setIsClearDataModalOpen(false);
    };

    const handlePurgeCloudData = async () => {
        setIsPurgingCloud(true);
        try {
            const { syncService } = await import('../../../services/SyncService');
            await syncService.purgeRemoteData();
            setIsPurgeCloudModalOpen(false);
        } catch (error) {
            console.error('Failed to purge cloud data:', error);
            // Error is handled in service (toast usually) but good to log
        } finally {
            setIsPurgingCloud(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-red-700 mb-4">
                    Danger Zone
                </h2>
                <p className="text-gray-600 mb-6">
                    Irreversible and destructive actions for your account
                </p>
            </div>

            {/* Clear Local DB Section (Sync Reset) */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">
                    Reset Local Sync
                </h3>
                <p className="text-yellow-700 mb-4">
                    Reset your local data cache and logout. This allows you to re-sync fresh data from the server. Safe to use if your data is already synced.
                </p>
                <Button
                    variant="outline"
                    className="border-yellow-600 text-yellow-800 hover:bg-yellow-100"
                    onClick={handleClearLocalDatabase}
                >
                    Reset & Re-sync
                </Button>
            </div>

            {/* Purge Cloud Data Section (New Phase 6 Feature) */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-orange-900 mb-2">
                    Purge Cloud Data
                </h3>
                <p className="text-orange-800 mb-4">
                    Permanently delete your encrypted data from the synchronization server. Your local data will be preserved, but you will need to re-enable sync.
                </p>
                <Button
                    variant="outline"
                    className="border-orange-600 text-orange-900 hover:bg-orange-100"
                    onClick={() => setIsPurgeCloudModalOpen(true)}
                >
                    Purge Cloud Data
                </Button>
            </div>

            {/* Clear Financial Data Section */}
            <div className="flex items-center justify-between p-6 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 rounded-full shrink-0">
                        <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-red-900">Clear Financial Data</h3>
                        <p className="text-sm text-red-700 mt-1">
                            Permanently delete all assets, liabilities, and records from this device. Account stays active.
                        </p>
                    </div>
                </div>
                <Button
                    variant="destructive"
                    onClick={() => setIsClearDataModalOpen(true)}
                >
                    Clear Data
                </Button>
            </div>

            {/* Delete Account Section */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-red-800 mb-2">
                    Delete Account
                </h3>
                <p className="text-red-700 mb-4">
                    Permanently remove your account and all associated data. This action cannot be undone.
                </p>
                <Button
                    variant="destructive"
                    onClick={handleDeleteAccountClick}
                >
                    Delete Account
                </Button>
            </div>

            {/* Clear Financial Data Modal */}
            <Modal
                isOpen={isClearDataModalOpen}
                onClose={() => setIsClearDataModalOpen(false)}
                title="Clear All Financial Data?"
            >
                <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg flex items-start gap-3 border border-red-100">
                        <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-red-800">
                            <p className="font-semibold">This action is irreversible.</p>
                            <p className="mt-1">All your tracked Assets, Liabilities, Payments, and History will be wiped from this device's database.</p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600">
                        Your account settings and profile will be preserved. Are you sure you want to continue?
                    </p>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsClearDataModalOpen(false)}
                            disabled={isClearing}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmClearData}
                            isLoading={isClearing}
                        >
                            Yes, Clear Everything
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Purge Cloud Data Modal */}
            <Modal
                isOpen={isPurgeCloudModalOpen}
                onClose={() => setIsPurgeCloudModalOpen(false)}
                title="Purge Cloud Data?"
            >
                <div className="space-y-4">
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <AlertTriangle className="w-5 h-5 text-orange-600 mb-2" />
                        <p className="text-sm text-orange-900 font-bold">
                            Warning: This will destroy your remote backups.
                        </p>
                        <p className="text-sm text-orange-800 mt-1">
                            Your encrypted data on the secure cloud server will be permanently deleted.
                            This will break synchronization with other devices.
                        </p>
                    </div>

                    <p className="text-sm text-gray-600">
                        Your local data on this device will NOT be deleted. You can re-enable sync later to upload a fresh copy.
                    </p>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsPurgeCloudModalOpen(false)}
                            disabled={isPurgingCloud}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handlePurgeCloudData}
                            isLoading={isPurgingCloud}
                        >
                            Yes, Purge Cloud Data
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Account Modal */}
            <Modal
                isOpen={isAccountDeleteModalOpen}
                onClose={() => setIsAccountDeleteModalOpen(false)}
                title="Delete Account"
            >
                <div className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-md border border-red-200">
                        <p className="text-sm text-red-800 font-medium">
                            Warning: This action is permanent.
                        </p>
                        <p className="text-sm text-red-700 mt-1">
                            All your data, including asset history, Zakat records, and settings will be permanently deleted.
                            This cannot be undone.
                        </p>
                    </div>

                    <div className="space-y-4 pt-2">
                        <p className="text-sm text-gray-600">
                            Please enter your password to confirm deletion.
                        </p>

                        <Input
                            type="password"
                            label="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            error={deleteError || undefined}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsAccountDeleteModalOpen(false)}
                            disabled={deleteAccountMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDeleteAccount}
                            isLoading={deleteAccountMutation.isPending}
                            disabled={!password}
                        >
                            Permanently Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
