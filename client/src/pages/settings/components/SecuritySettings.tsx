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
import { useMutation } from '@tanstack/react-query';
import { apiService } from '../../../services/api';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';

interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export const SecuritySettings: React.FC = () => {
    const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
    const [passwordData, setPasswordData] = useState<PasswordChangeData>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Change password mutation
    const passwordMutation = useMutation({
        mutationFn: async (data: PasswordChangeData) => {
            const response = await apiService.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
            });
            return response;
        },
        onSuccess: (response) => {
            if (response.success) {
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setShowSuccessMessage('Password changed successfully!');
                setTimeout(() => setShowSuccessMessage(null), 5000);
            }
        },
    });

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return;
        }

        passwordMutation.mutate(passwordData);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-primary mb-4">
                    Security Settings
                </h2>
                <p className="text-muted-foreground mb-6">
                    Manage your password and account security options
                </p>
            </div>

            {showSuccessMessage && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <span className="text-green-600 text-xl mr-3" aria-hidden="true">✅</span>
                        <p className="text-green-800 font-medium">{showSuccessMessage}</p>
                    </div>
                </div>
            )}

            {/* Change Password Section */}
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <h3 className="text-lg font-medium text-primary">Change Password</h3>

                <div className="grid grid-cols-1 gap-6 max-w-md">
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-primary mb-2">
                            Current Password
                        </label>
                        <input
                            type="password"
                            id="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({
                                ...passwordData,
                                currentPassword: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-default rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-primary mb-2">
                            New Password
                        </label>
                        <input
                            type="password"
                            id="newPassword"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({
                                ...passwordData,
                                newPassword: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-default rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            required
                            minLength={8}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Minimum 8 characters required
                        </p>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-primary mb-2">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({
                                ...passwordData,
                                confirmPassword: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-default rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            required
                            minLength={8}
                        />
                    </div>

                    <div className="flex justify-start">
                        <Button
                            type="submit"
                            variant="default"
                            disabled={passwordMutation.isPending}
                        >
                            {passwordMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                            Change Password
                        </Button>
                    </div>
                </div>
            </form>

            {passwordMutation.error && (
                <ErrorMessage
                    error={passwordMutation.error}
                    title="Failed to change password"
                />
            )}

            {/* Two-Factor Authentication */}
            <div className="border-t border-default pt-6">
                <h3 className="text-lg font-medium text-primary mb-4">
                    Two-Factor Authentication
                </h3>

                <div className="bg-accent rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-primary">Authenticator App</p>
                            <p className="text-sm text-muted-foreground">Use an authenticator app for codes</p>
                        </div>
                        <Button variant="secondary" size="sm" disabled>
                            Coming Soon
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
