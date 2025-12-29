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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { apiService } from '../../../services/api';
import { Button } from '../../../components/ui/Button';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../../components/ui/ErrorMessage';

// Types extracted locally since they aren't exported from types/index
interface ProfileFormData {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    preferences: {
        currency: string;
        language: string;
        zakatMethod: string;
        calendarType: 'lunar' | 'solar';
    };
}

export const ProfileForm: React.FC = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);

    const [profileData, setProfileData] = useState<ProfileFormData>({
        username: user?.username || '',
        email: user?.email || '',
        firstName: (user as any)?.firstName || '',
        lastName: (user as any)?.lastName || '',
        preferences: {
            currency: (user as any)?.preferences?.currency || 'USD',
            language: (user as any)?.preferences?.language || 'en',
            zakatMethod: (user as any)?.preferences?.zakatMethod || 'standard',
            calendarType: (user as any)?.preferences?.calendarType || 'lunar'
        }
    });

    const currencies = [
        { code: 'USD', name: 'US Dollar' },
        { code: 'EUR', name: 'Euro' },
        { code: 'GBP', name: 'British Pound' },
        { code: 'SAR', name: 'Saudi Riyal' },
        { code: 'AED', name: 'UAE Dirham' },
        { code: 'EGP', name: 'Egyptian Pound' },
        { code: 'PKR', name: 'Pakistani Rupee' },
        { code: 'INR', name: 'Indian Rupee' },
        { code: 'MYR', name: 'Malaysian Ringgit' },
        { code: 'IDR', name: 'Indonesian Rupiah' },
    ];

    const zakatMethods = [
        { value: 'standard', name: 'Standard (2.5%)' },
        { value: 'hanafi', name: 'Hanafi School' },
        { value: 'shafi', name: 'Shafi\'i School' },
        { value: 'custom', name: 'Custom Method' },
    ];

    // Update profile mutation
    const profileMutation = useMutation({
        mutationFn: async (data: ProfileFormData) => {
            // Update general profile
            const profileResult = await apiService.updateProfile(data);

            // Update calendar preferences separately via new calendar API
            const calendarPrefs = {
                preferredCalendar: data.preferences.calendarType === 'lunar' ? 'hijri' as const : 'gregorian' as const,
                preferredMethodology: data.preferences.zakatMethod as 'standard' | 'hanafi' | 'shafi' | 'custom'
            };
            await apiService.updateCalendarPreferences(calendarPrefs);

            return profileResult;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user', 'current'] });
            setShowSuccessMessage('Profile updated successfully!');
            setTimeout(() => setShowSuccessMessage(null), 5000);
        },
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        profileMutation.mutate(profileData);
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Profile Information
                </h2>
                <p className="text-gray-600 mb-6">
                    Update your personal information and calculation preferences
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

            <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            value={profileData.firstName}
                            onChange={(e) => setProfileData({
                                ...profileData,
                                firstName: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                        </label>
                        <input
                            type="text"
                            id="lastName"
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({
                                ...profileData,
                                lastName: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={profileData.username}
                            onChange={(e) => setProfileData({
                                ...profileData,
                                username: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({
                                ...profileData,
                                email: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>
                </div>

                {/* Preferences Section */}
                <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        Islamic Calculation Preferences
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                                Default Currency
                            </label>
                            <select
                                id="currency"
                                value={profileData.preferences.currency}
                                onChange={(e) => setProfileData({
                                    ...profileData,
                                    preferences: {
                                        ...profileData.preferences,
                                        currency: e.target.value
                                    }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {currencies.map((currency) => (
                                    <option key={currency.code} value={currency.code}>
                                        {currency.code} - {currency.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="zakatMethod" className="block text-sm font-medium text-gray-700 mb-2">
                                Preferred Zakat Methodology
                            </label>
                            <select
                                id="zakatMethod"
                                value={profileData.preferences.zakatMethod}
                                onChange={(e) => setProfileData({
                                    ...profileData,
                                    preferences: {
                                        ...profileData.preferences,
                                        zakatMethod: e.target.value
                                    }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                {zakatMethods.map((method) => (
                                    <option key={method.value} value={method.value}>
                                        {method.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="calendarType" className="block text-sm font-medium text-gray-700 mb-2">
                                Calendar System
                                <span className="ml-2 text-xs text-gray-500">
                                    (for Zakat calculation dates)
                                </span>
                            </label>
                            <select
                                id="calendarType"
                                value={profileData.preferences.calendarType}
                                onChange={(e) => setProfileData({
                                    ...profileData,
                                    preferences: {
                                        ...profileData.preferences,
                                        calendarType: e.target.value as 'lunar' | 'solar'
                                    }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="lunar">Hijri (Islamic Lunar Calendar - 354 days/year)</option>
                                <option value="solar">Gregorian (Solar Calendar - 365 days/year)</option>
                            </select>
                            <p className="mt-1 text-xs text-gray-500">
                                💡 Zakat is due after one lunar year (Hijri) from your last payment.
                                Using the Hijri calendar is more Islamically accurate.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                                Language
                            </label>
                            <select
                                id="language"
                                value={profileData.preferences.language}
                                onChange={(e) => setProfileData({
                                    ...profileData,
                                    preferences: {
                                        ...profileData.preferences,
                                        language: e.target.value
                                    }
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="en">English</option>
                                <option value="ar">العربية (Arabic)</option>
                                <option value="ur">اردو (Urdu)</option>
                                <option value="id">Bahasa Indonesia</option>
                                <option value="ms">Bahasa Melayu</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button
                        type="submit"
                        variant="default"
                        disabled={profileMutation.isPending}
                    >
                        {profileMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </form>

            {profileMutation.error && (
                <ErrorMessage
                    error={profileMutation.error}
                    title="Failed to update profile"
                />
            )}
        </div>
    );
};
