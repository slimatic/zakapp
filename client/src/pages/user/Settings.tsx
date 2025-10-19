import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { useCalendarPreference, useUpdateCalendarPreference } from '../../services/apiHooks';

interface AppSettings {
  notifications: {
    zakatReminders: boolean;
    calculationUpdates: boolean;
    marketPriceAlerts: boolean;
    monthlyReports: boolean;
    emailNotifications: boolean;
    browserNotifications: boolean;
  };
  calculations: {
    defaultMethodology: string;
    autoSaveCalculations: boolean;
    showEducationalContent: boolean;
    includePreviousYearComparison: boolean;
    defaultCurrency: string;
    roundingMethod: 'up' | 'down' | 'nearest';
  };
  display: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    dateFormat: string;
    numberFormat: string;
    calendarSystem: 'lunar' | 'solar';
    showIslamicDates: boolean;
  };
  privacy: {
    analyticsEnabled: boolean;
    crashReportingEnabled: boolean;
    dataRetentionPeriod: number; // in years
    encryptionLevel: 'standard' | 'high';
  };
  backup: {
    autoBackupEnabled: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    maxBackups: number;
    includeCalculationHistory: boolean;
  };
}

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'general' | 'calculations' | 'notifications' | 'privacy' | 'backup'>('general');
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);

  // Load calendar preference
  const { data: calendarPreference } = useCalendarPreference();

  // Update calendar preference mutation
  const updateCalendarMutation = useUpdateCalendarPreference();

  // Load current settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['settings', calendarPreference?.data?.calendarType],
    queryFn: async (): Promise<AppSettings> => {
      const response = await apiService.getSettings();
      return response.data || {
        notifications: {
          zakatReminders: true,
          calculationUpdates: true,
          marketPriceAlerts: false,
          monthlyReports: true,
          emailNotifications: true,
          browserNotifications: false,
        },
        calculations: {
          defaultMethodology: user?.preferences?.zakatMethod || 'standard',
          autoSaveCalculations: true,
          showEducationalContent: true,
          includePreviousYearComparison: true,
          defaultCurrency: user?.preferences?.currency || 'USD',
          roundingMethod: 'nearest',
        },
        display: {
          theme: 'light',
          language: user?.preferences?.language || 'en',
          dateFormat: 'MM/DD/YYYY',
          numberFormat: 'en-US',
          calendarSystem: 'lunar',
          showIslamicDates: true,
        },
        privacy: {
          analyticsEnabled: false,
          crashReportingEnabled: true,
          dataRetentionPeriod: 5,
          encryptionLevel: 'high',
        },
        backup: {
          autoBackupEnabled: true,
          backupFrequency: 'weekly',
          maxBackups: 10,
          includeCalculationHistory: true,
        },
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const [localSettings, setLocalSettings] = useState<AppSettings | null>(settings || null);

  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: AppSettings) => {
      return apiService.updateSettings(newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowSuccessMessage('Settings saved successfully!');
      setTimeout(() => setShowSuccessMessage(null), 5000);
    },
  });

  // Reset to defaults mutation
  const resetSettingsMutation = useMutation({
    mutationFn: async () => {
      return fetch('/api/user/settings/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowSuccessMessage('Settings reset to defaults!');
      setTimeout(() => setShowSuccessMessage(null), 5000);
    },
  });

  const handleSaveSettings = async () => {
    if (!localSettings) return;

    try {
      // Save general settings
      await saveSettingsMutation.mutateAsync(localSettings);

      // Update calendar preference if it changed
      const currentCalendarType = calendarPreference?.data?.calendarType;
      const newCalendarType = localSettings.display.calendarSystem === 'lunar' ? 'HIJRI' : 'GREGORIAN';

      if (currentCalendarType !== newCalendarType) {
        await updateCalendarMutation.mutateAsync(newCalendarType);
      }

      setShowSuccessMessage('Settings saved successfully!');
      setTimeout(() => setShowSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Error handling will be done by the mutations
    }
  };

  const handleResetSettings = () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all settings to their default values?'
    );
    if (confirmed) {
      resetSettingsMutation.mutate();
    }
  };

  const updateSetting = (path: string, value: any) => {
    if (!localSettings) return;
    
    const pathParts = path.split('.');
    const newSettings = { ...localSettings };
    let current: any = newSettings;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      current[pathParts[i]] = { ...current[pathParts[i]] };
      current = current[pathParts[i]];
    }
    
    current[pathParts[pathParts.length - 1]] = value;
    setLocalSettings(newSettings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !localSettings) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessage 
          error={error} 
          title="Failed to load settings"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Application Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure your ZakApp experience with detailed preferences and options
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

      {/* Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4 sticky top-6">
            <nav className="space-y-2">
              {[
                { id: 'general', name: 'General', icon: '⚙️' },
                { id: 'calculations', name: 'Calculations', icon: '🧮' },
                { id: 'notifications', name: 'Notifications', icon: '🔔' },
                { id: 'privacy', name: 'Privacy', icon: '🛡️' },
                { id: 'backup', name: 'Backup', icon: '💾' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>

            {/* Action Buttons */}
            <div className="border-t border-gray-200 mt-6 pt-4 space-y-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveSettings}
                disabled={saveSettingsMutation.isPending}
                className="w-full"
              >
                {saveSettingsMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                Save Changes
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResetSettings}
                disabled={resetSettingsMutation.isPending}
                className="w-full"
              >
                {resetSettingsMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
                Reset to Defaults
              </Button>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">General Settings</h2>
                  <p className="text-gray-600 mb-6">
                    Configure the basic appearance and behavior of your application
                  </p>
                </div>

                {/* Theme Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Appearance</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <select
                        value={localSettings.display.theme}
                        onChange={(e) => updateSetting('display.theme', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto (System)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={localSettings.display.language}
                        onChange={(e) => updateSetting('display.language', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="en">English</option>
                        <option value="ar">العربية (Arabic)</option>
                        <option value="ur">اردو (Urdu)</option>
                        <option value="id">Bahasa Indonesia</option>
                        <option value="ms">Bahasa Melayu</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Format
                      </label>
                      <select
                        value={localSettings.display.dateFormat}
                        onChange={(e) => updateSetting('display.dateFormat', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                        <option value="DD MMM YYYY">DD MMM YYYY</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number Format
                      </label>
                      <select
                        value={localSettings.display.numberFormat}
                        onChange={(e) => updateSetting('display.numberFormat', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="en-US">1,234.56 (US)</option>
                        <option value="de-DE">1.234,56 (German)</option>
                        <option value="fr-FR">1 234,56 (French)</option>
                        <option value="ar-SA">١٬٢٣٤٫٥٦ (Arabic)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Islamic Calendar Settings */}
                <div className="border-t border-gray-200 pt-6 space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Islamic Calendar</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Calendar System
                      </label>
                      <select
                        value={localSettings.display.calendarSystem}
                        onChange={(e) => updateSetting('display.calendarSystem', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="lunar">Hijri (Lunar Calendar)</option>
                        <option value="solar">Gregorian (Solar Calendar)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center h-10">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={localSettings.display.showIslamicDates}
                            onChange={(e) => updateSetting('display.showIslamicDates', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">
                            Show Islamic dates alongside Gregorian
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calculation Settings */}
            {activeTab === 'calculations' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Calculation Settings</h2>
                  <p className="text-gray-600 mb-6">
                    Configure how Zakat calculations are performed and displayed
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Methodology
                      </label>
                      <select
                        value={localSettings.calculations.defaultMethodology}
                        onChange={(e) => updateSetting('calculations.defaultMethodology', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="standard">Standard (2.5%)</option>
                        <option value="hanafi">Hanafi School</option>
                        <option value="shafi">Shafi'i School</option>
                        <option value="custom">Custom Method</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Currency
                      </label>
                      <select
                        value={localSettings.calculations.defaultCurrency}
                        onChange={(e) => updateSetting('calculations.defaultCurrency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="SAR">SAR - Saudi Riyal</option>
                        <option value="AED">AED - UAE Dirham</option>
                        <option value="EGP">EGP - Egyptian Pound</option>
                        <option value="PKR">PKR - Pakistani Rupee</option>
                        <option value="INR">INR - Indian Rupee</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rounding Method
                      </label>
                      <select
                        value={localSettings.calculations.roundingMethod}
                        onChange={(e) => updateSetting('calculations.roundingMethod', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="nearest">Round to nearest</option>
                        <option value="up">Round up (more generous)</option>
                        <option value="down">Round down (conservative)</option>
                      </select>
                    </div>
                  </div>

                  {/* Calculation Options */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Calculation Options</h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={localSettings.calculations.autoSaveCalculations}
                          onChange={(e) => updateSetting('calculations.autoSaveCalculations', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Automatically save calculations
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={localSettings.calculations.showEducationalContent}
                          onChange={(e) => updateSetting('calculations.showEducationalContent', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Show educational content and Islamic guidance
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={localSettings.calculations.includePreviousYearComparison}
                          onChange={(e) => updateSetting('calculations.includePreviousYearComparison', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Include previous year comparisons in results
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Notification Settings</h2>
                  <p className="text-gray-600 mb-6">
                    Control when and how you receive notifications and reminders
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Zakat Reminders</h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={localSettings.notifications.zakatReminders}
                          onChange={(e) => updateSetting('notifications.zakatReminders', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Annual Zakat calculation reminders
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={localSettings.notifications.calculationUpdates}
                          onChange={(e) => updateSetting('notifications.calculationUpdates', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Updates when asset values affect Zakat calculations
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={localSettings.notifications.marketPriceAlerts}
                          onChange={(e) => updateSetting('notifications.marketPriceAlerts', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Gold and silver price alerts affecting nisab thresholds
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={localSettings.notifications.monthlyReports}
                          onChange={(e) => updateSetting('notifications.monthlyReports', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Monthly asset portfolio summaries
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6 space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Notification Channels</h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={localSettings.notifications.emailNotifications}
                          onChange={(e) => updateSetting('notifications.emailNotifications', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Email notifications
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={localSettings.notifications.browserNotifications}
                          onChange={(e) => updateSetting('notifications.browserNotifications', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Browser push notifications
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === 'privacy' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy & Security Settings</h2>
                  <p className="text-gray-600 mb-6">
                    Configure data privacy, security levels, and retention policies
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Data Privacy</h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={localSettings.privacy.analyticsEnabled}
                          onChange={(e) => updateSetting('privacy.analyticsEnabled', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Enable anonymous usage analytics (helps improve ZakApp)
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={localSettings.privacy.crashReportingEnabled}
                          onChange={(e) => updateSetting('privacy.crashReportingEnabled', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Send crash reports to help fix issues
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-6 space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Encryption Level
                        </label>
                        <select
                          value={localSettings.privacy.encryptionLevel}
                          onChange={(e) => updateSetting('privacy.encryptionLevel', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="standard">Standard (AES-256)</option>
                          <option value="high">High (AES-256 + Additional Layers)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data Retention Period (years)
                        </label>
                        <select
                          value={localSettings.privacy.dataRetentionPeriod}
                          onChange={(e) => updateSetting('privacy.dataRetentionPeriod', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={1}>1 year</option>
                          <option value={3}>3 years</option>
                          <option value={5}>5 years</option>
                          <option value={10}>10 years</option>
                          <option value={0}>Keep indefinitely</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Backup Settings */}
            {activeTab === 'backup' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Backup & Export Settings</h2>
                  <p className="text-gray-600 mb-6">
                    Configure automatic backups and data export options
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Automatic Backups</h3>
                    
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={localSettings.backup.autoBackupEnabled}
                          onChange={(e) => updateSetting('backup.autoBackupEnabled', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Enable automatic backups
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={localSettings.backup.includeCalculationHistory}
                          onChange={(e) => updateSetting('backup.includeCalculationHistory', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Include calculation history in backups
                        </span>
                      </label>
                    </div>
                  </div>

                  {localSettings.backup.autoBackupEnabled && (
                    <div className="border-t border-gray-200 pt-6 space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">Backup Configuration</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Backup Frequency
                          </label>
                          <select
                            value={localSettings.backup.backupFrequency}
                            onChange={(e) => updateSetting('backup.backupFrequency', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Backups to Keep
                          </label>
                          <select
                            value={localSettings.backup.maxBackups}
                            onChange={(e) => updateSetting('backup.maxBackups', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value={5}>5 backups</option>
                            <option value={10}>10 backups</option>
                            <option value={20}>20 backups</option>
                            <option value={50}>50 backups</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Actions</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button 
                        variant="primary" 
                        onClick={() => window.open('/api/backup/create', '_blank')}
                      >
                        Create Backup Now
                      </Button>
                      
                      <Button 
                        variant="secondary" 
                        onClick={() => window.open('/api/backup/download', '_blank')}
                      >
                        Download Latest Backup
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error Messages */}
          {saveSettingsMutation.error && (
            <div className="mt-4">
              <ErrorMessage 
                error={saveSettingsMutation.error}
                title="Failed to save settings"
              />
            </div>
          )}

          {resetSettingsMutation.error && (
            <div className="mt-4">
              <ErrorMessage 
                error={resetSettingsMutation.error}
                title="Failed to reset settings"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};