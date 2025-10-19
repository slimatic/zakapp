import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'privacy' | 'danger'>('profile');
  const [profileData, setProfileData] = useState<ProfileFormData>({
    username: user?.username || '',
    email: user?.email || '',
    preferences: {
      currency: user?.preferences?.currency || 'USD',
      language: user?.preferences?.language || 'en',
      zakatMethod: user?.preferences?.zakatMethod || 'standard',
      calendarType: user?.preferences?.calendarType || 'lunar'
    }
  });
  
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);

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

  // Change password mutation
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordChangeData) => {
      // This would be implemented in the API service
      return fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowSuccessMessage('Password changed successfully!');
      setTimeout(() => setShowSuccessMessage(null), 5000);
    },
  });

  // Account deletion mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      // Redirect to login or home page
      window.location.href = '/';
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    
    passwordMutation.mutate(passwordData);
  };

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

  const exportUserData = () => {
    // This would trigger a data export
    window.open('/api/user/export-data', '_blank');
  };

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

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings, preferences, and security options
        </p>
      </div>

      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-green-600 text-xl mr-3">✅</span>
            <p className="text-green-800 font-medium">{showSuccessMessage}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'profile', name: 'Profile Information', icon: '👤' },
              { id: 'security', name: 'Security', icon: '🔒' },
              { id: 'privacy', name: 'Privacy & Data', icon: '🛡️' },
              { id: 'danger', name: 'Danger Zone', icon: '⚠️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Information Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Profile Information
                </h2>
                <p className="text-gray-600 mb-6">
                  Update your personal information and calculation preferences
                </p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    variant="primary"
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
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Security Settings
                </h2>
                <p className="text-gray-600 mb-6">
                  Manage your password and account security options
                </p>
              </div>

              {/* Change Password Section */}
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Change Password</h3>

                <div className="grid grid-cols-1 gap-6 max-w-md">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      minLength={8}
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-start">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={passwordMutation.isPending}
                  >
                    {passwordMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                    Change Password
                  </Button>
                </div>
              </form>

              {passwordMutation.error && (
                <ErrorMessage 
                  error={passwordMutation.error}
                  title="Failed to change password"
                />
              )}

              {/* Two-Factor Authentication */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Two-Factor Authentication
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">SMS Authentication</p>
                      <p className="text-sm text-gray-600">Receive codes via SMS</p>
                    </div>
                    <Button variant="secondary" size="sm" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Authenticator App</p>
                      <p className="text-sm text-gray-600">Use an authenticator app for codes</p>
                    </div>
                    <Button variant="secondary" size="sm" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Data Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Privacy & Data Management
                </h2>
                <p className="text-gray-600 mb-6">
                  Control your data privacy settings and manage your information
                </p>
              </div>

              {/* Data Export */}
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-start">
                  <span className="text-2xl mr-4">📁</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Export Your Data
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Download all your personal data including assets, calculations, and payment history in a secure format.
                    </p>
                    <Button variant="primary" onClick={exportUserData}>
                      Export Data
                    </Button>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Privacy Preferences</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Data Encryption</p>
                      <p className="text-sm text-gray-600">All sensitive data is encrypted with AES-256</p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-600 font-medium">✅ Enabled</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Local Data Storage</p>
                      <p className="text-sm text-gray-600">Your data is stored locally on your server</p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-green-600 font-medium">✅ Active</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Anonymous Usage Statistics</p>
                      <p className="text-sm text-gray-600">Help improve ZakApp by sharing anonymous usage data</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={false} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Data Retention */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Data Retention</h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <span className="text-yellow-600 text-xl mr-3">⏰</span>
                    <div>
                      <p className="font-medium text-yellow-800">Data Retention Policy</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your data is retained indefinitely for calculation accuracy and historical tracking. 
                        You can delete your account at any time to remove all data permanently.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Danger Zone
                </h2>
                <p className="text-gray-600 mb-6">
                  Irreversible and destructive actions for your account
                </p>
              </div>

              {/* Account Deletion */}
              <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                <div className="flex items-start">
                  <span className="text-2xl mr-4">⚠️</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-red-900 mb-2">
                      Delete Account
                    </h3>
                    <p className="text-red-700 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                      All your assets, calculations, payment history, and personal information will be permanently removed.
                    </p>
                    
                    <div className="bg-white border border-red-200 rounded p-4 mb-4">
                      <p className="text-sm font-medium text-red-800 mb-2">
                        Before deleting your account, consider:
                      </p>
                      <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                        <li>Exporting your data for personal records</li>
                        <li>Completing any pending Zakat calculations</li>
                        <li>Saving important historical information</li>
                        <li>This action affects all your stored Islamic financial data</li>
                      </ul>
                    </div>
                    
                    <Button 
                      variant="danger" 
                      onClick={handleDeleteAccount}
                      disabled={deleteAccountMutation.isPending}
                    >
                      {deleteAccountMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                      Delete Account Permanently
                    </Button>
                  </div>
                </div>
              </div>

              {deleteAccountMutation.error && (
                <ErrorMessage 
                  error={deleteAccountMutation.error}
                  title="Failed to delete account"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};