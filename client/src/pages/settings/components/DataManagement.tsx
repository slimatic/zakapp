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


import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { apiService } from '../../../services/api';
import { UnifiedImportExport } from '../../../components/settings/UnifiedImportExport';

interface PrivacySettings {
    anonymousUsageStats: boolean;
}

export const DataManagement: React.FC = () => {
    const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
        anonymousUsageStats: false
    });
    const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);

    // Load privacy settings on mount
    useEffect(() => {
        const loadPrivacySettings = async () => {
            try {
                const settings = await apiService.getPrivacySettings();
                if (settings.privacySettings) {
                    setPrivacySettings({
                        anonymousUsageStats: settings.privacySettings.analytics || false
                    });
                }
            } catch {
                // Use defaults if API fails
            }
        };
        loadPrivacySettings();
    }, []);

    const handlePrivacyChange = async (newValue: boolean) => {
        setPrivacySettings(prev => ({ ...prev, anonymousUsageStats: newValue }));
        try {
            await apiService.updatePrivacySettings({ analytics: newValue });
            setShowSuccessMessage('Privacy settings updated successfully!');
            setTimeout(() => setShowSuccessMessage(null), 5000);
        } catch {
            // Revert on error
            setPrivacySettings(prev => ({ ...prev, anonymousUsageStats: !newValue }));
            toast.error('Failed to update privacy settings. Please try again.');
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                    Data Management
                </h2>
                <p className="text-muted-foreground mb-6">
                    Import, export, and manage your data privacy settings
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

            {/* Unified Import/Export Tool */}
            <div className="bg-card rounded-lg">
                <UnifiedImportExport />
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Privacy Preferences</h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                        <div>
                            <p className="font-medium text-foreground/80">Data Encryption</p>
                            <p className="text-sm text-muted-foreground">All sensitive data is encrypted with AES-256</p>
                        </div>
                        <div className="flex items-center">
                            <span className="text-foreground/80 font-medium">✅ Enabled</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                        <div>
                            <p className="font-medium text-foreground/80">Local Data Storage</p>
                            <p className="text-sm text-muted-foreground">Your data is stored locally on your device</p>
                        </div>
                        <div className="flex items-center">
                            <span className="text-foreground/80 font-medium">✅ Active</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                        <div>
                            <p className="font-medium text-foreground/80" id="usage-stats-label">Anonymous Usage Statistics</p>
                            <p className="text-sm text-muted-foreground">Help improve ZakApp by sharing anonymous usage data</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={privacySettings.anonymousUsageStats}
                                onChange={(e) => handlePrivacyChange(e.target.checked)}
                                aria-labelledby="usage-stats-label"
                                role="switch"
                                aria-checked={privacySettings.anonymousUsageStats}
                            />
                            <div className="w-11 h-6 bg-accent peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Data Retention */}
            <div className="border-t border-border pt-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Data Retention</h3>
                <div className="bg-accent border border-border rounded-lg p-4">
                    <div className="flex items-start">
                        <span className="text-foreground/80 text-xl me-3" aria-hidden="true">⏰</span>
                        <div>
                            <p className="font-medium text-foreground/80">Data Retention Policy</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Your data is retained indefinitely for calculation accuracy and historical tracking.
                                You can delete your account at any time to remove all data permanently.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
