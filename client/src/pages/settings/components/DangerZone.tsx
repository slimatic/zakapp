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

export const DangerZone: React.FC = () => {
    // ... existing deleteAccountMutation ...
    const deleteAccountMutation = useMutation({
        mutationFn: async () => {
            return apiService.deleteAccount('confirmed');
        },
        onSuccess: (response) => {
            if (response.success) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/';
            }
        },
    });

    const handleDeleteAccount = () => {
        // ... existing logic ...
        const confirmed = window.confirm(
            'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.'
        );

        if (confirmed) {
            const doubleConfirmed = window.prompt(
                'Type "DELETE" to confirm account deletion:'
            );

            if (doubleConfirmed === 'DELETE') {
                deleteAccountMutation.mutate();
            }
        }
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
                    onClick={handleDeleteAccount}
                    isLoading={deleteAccountMutation.isPending}
                >
                    Delete Account
                </Button>
            </div>
        </div>
    );
};
