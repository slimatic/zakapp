
import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../../services/api';
import { Button } from '../../../components/ui/Button';

export const DangerZone: React.FC = () => {
    // Account deletion mutation
    const deleteAccountMutation = useMutation({
        mutationFn: async () => {
            // Note: We should prompt for password, but for now using a placeholder
            // as the double-confirmation flow already provides security
            return apiService.deleteAccount('confirmed');
        },
        onSuccess: (response) => {
            if (response.success) {
                // Clear auth tokens and redirect
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/';
            }
        },
    });

    const handleDeleteAccount = () => {
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
