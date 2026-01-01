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


import { forceResetDatabase, useDb } from '../../../db'; // Import this at the top
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../../services/api';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import React from 'react';

export const DangerZone: React.FC = () => {
    // ... existing deleteAccountMutation ...
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [password, setPassword] = React.useState('');
    const [deleteError, setDeleteError] = React.useState<string | null>(null);

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

    const handleDeleteClick = () => {
        setIsDeleteModalOpen(true);
        setPassword('');
        setDeleteError(null);
    };

    const handleConfirmDelete = () => {
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
                // Clean up any other local storage items if needed
                window.location.reload();
            } catch (error) {
                console.error('Failed to reset database:', error);
                alert('Failed to reset database. Please check console.');
            }
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

            {/* Clear Local DB Section */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-yellow-800 mb-2">
                    Clear Local Database
                </h3>
                <p className="text-yellow-700 mb-4">
                    Reset your local data cache. This allows you to re-sync fresh data from the server. Safe to use if your data is already synced.
                </p>
                <Button
                    variant="outline"
                    className="border-yellow-600 text-yellow-800 hover:bg-yellow-100"
                    onClick={handleClearLocalDatabase}
                >
                    Clear Local Data & Re-sync
                </Button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-red-800 mb-2">
                    Delete Account
                </h3>
                <p className="text-red-700 mb-4">
                    Permanently remove your account and all associated data. This action cannot be undone.
                </p>
                <Button
                    variant="destructive"
                    onClick={handleDeleteClick}
                >
                    Delete Account
                </Button>
            </div>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
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
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={deleteAccountMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmDelete}
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
