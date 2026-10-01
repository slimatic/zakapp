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
import { cryptoService } from '../../../services/CryptoService';
import { reencryptVault, resolveVaultSalt, VaultBlockedError, describeBlockedRecords } from '../../../services/VaultRekey';
import { useAuth } from '../../../contexts/AuthContext';

interface PasswordChangeData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export const SecuritySettings: React.FC = () => {
    const { user } = useAuth();
    const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
    // Held separately from `passwordMutation.error` so the records survive the
    // mutation's own error handling — this is the actionable half of the failure.
    const [blockedError, setBlockedError] = useState<VaultBlockedError | null>(null);
    const [passwordData, setPasswordData] = useState<PasswordChangeData>({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Change password mutation
    const passwordMutation = useMutation({
        mutationFn: async (data: PasswordChangeData) => {
            // Order matters, and this is the whole fix.
            //
            // The vault key is PBKDF2(password, salt). The old key is only
            // derivable while we still know the old password, so the vault has
            // to be re-encrypted BEFORE the server retires it. Doing it after —
            // or not at all, which is what happened before — leaves every
            // encrypted row readable only by a key nothing can rebuild.
            //
            // `currentPassword` is still valid here because the API call below
            // has not run yet.
            const salt = await resolveVaultSalt(user?.id ?? '', user as any);
            if (!salt) {
                throw new Error(
                    'Could not determine your vault salt, so your data cannot be re-encrypted. ' +
                    'Password not changed.'
                );
            }

            const oldKey = await cryptoService.deriveTemporaryKey(data.currentPassword, salt);

            // Point the session at the NEW key first: writes re-encrypt through
            // the session key, so this is what the re-encrypted rows get written
            // with. Nothing reads through this key until the pages reload below.
            await cryptoService.deriveKey(data.newPassword, salt);

            let summary;
            try {
                summary = await reencryptVault(oldKey, { strict: true });
            } catch (err) {
                // Put the working key back so the user is not left holding a
                // session that cannot read their own vault.
                await cryptoService.deriveKey(data.currentPassword, salt);
                // A VaultBlockedError carries WHICH records failed, so the user can
                // be told what to fix instead of only that something went wrong.
                if (err instanceof VaultBlockedError) {
                    setBlockedError(err);
                }
                throw new Error(
                    'Your data could not be re-encrypted, so the password was NOT changed. ' +
                    (err instanceof Error ? err.message : String(err))
                );
            }

            // Only now retire the old password. `reencrypted: true` tells the
            // server the vault has already been re-keyed.
            const response = await apiService.changePassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                reencrypted: true
            });

            if (!response.success) {
                // The server refused; put the session key back so this browser
                // still matches the stored rows.
                await cryptoService.deriveKey(data.currentPassword, salt);
                throw new Error(response.message || 'Password change was rejected.');
            }

            return { response, summary };
        },
        onSuccess: ({ response, summary }) => {
            if (response.success) {
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setShowSuccessMessage(
                    `Password changed. ${summary.reencrypted} record${summary.reencrypted === 1 ? '' : 's'} re-encrypted.`
                );
                setTimeout(() => setShowSuccessMessage(null), 5000);
                // Every open page is still decrypting with the old key.
                setTimeout(() => window.location.reload(), 1500);
            }
        },
    });

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // A new attempt supersedes the previous block; otherwise a fixed vault
        // would still show a stale "how to clear this" panel.
        setBlockedError(null);

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
                <h2 className="text-xl font-semibold text-foreground mb-4">
                    Security Settings
                </h2>
                <p className="text-muted-foreground mb-6">
                    Manage your password and account security options
                </p>
            </div>

            {showSuccessMessage && (
                <div className="bg-success-soft border border-success/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <span className="text-success text-xl me-3" aria-hidden="true">✅</span>
                        <p className="text-success font-medium">{showSuccessMessage}</p>
                    </div>
                </div>
            )}

            {/* Change Password Section */}
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <h3 className="text-lg font-medium text-foreground">Change Password</h3>

                <div className="grid grid-cols-1 gap-6 max-w-md">
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-2">
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
                            className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
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
                            className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            required
                            minLength={8}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Minimum 8 characters required
                        </p>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
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
                            className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
                            {passwordMutation.isPending && <LoadingSpinner size="sm" className="me-2" />}
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

            {/*
                A blocked password change is NOT a plain error: the user is refused
                and must be told what to do about it. The count-only message this
                replaced ("1 encrypted value could not be read") left them with no
                move at all, and the reported workaround was to export the whole
                vault to JSON, delete everything, and re-import.
            */}
            {blockedError && (
                <div
                    className="rounded-lg border border-amber-300 bg-amber-50 p-4"
                    role="alert"
                    data-testid="vault-blocked"
                >
                    <h3 className="font-medium text-amber-900">
                        Your password was not changed
                    </h3>
                    <p className="mt-1 text-sm text-amber-800">
                        {blockedError.unreadableCount === 1
                            ? 'One value in your vault could not be read with your current password,'
                            : `${blockedError.unreadableCount} values in your vault could not be read with your current password,`}{' '}
                        so nothing was changed. Your data is safe and your current password still
                        works. Fix the item{blockedError.blocked.length === 1 ? '' : 's'} below, then
                        try again.
                    </p>

                    <ul className="mt-3 space-y-1.5" data-testid="vault-blocked-records">
                        {describeBlockedRecords(blockedError.blocked).map((line, index) => (
                            <li key={index} className="text-sm text-amber-900">
                                <span className="mr-2" aria-hidden="true">•</span>
                                {line}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-4 border-t border-amber-200 pt-3">
                        <h4 className="text-sm font-medium text-amber-900">How to clear this</h4>
                        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-amber-800">
                            <li>
                                Open the item above and re-save it. Saving re-encrypts its value
                                under your current password.
                            </li>
                            <li>
                                If it will not open, export your data to a JSON file from Settings
                                → Import/Export, delete the item, import the file, and confirm it
                                comes back.
                            </li>
                            <li>
                                Reload this page — the file is re-read — and change your password.
                            </li>
                        </ol>
                        <p className="mt-2 text-xs text-amber-700">
                            Nothing is deleted until you choose to. Step 2 is the only step that
                            removes anything, and only the item you delete.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
