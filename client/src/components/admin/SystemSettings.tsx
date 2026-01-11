import React, { useState, useEffect } from 'react';
import { adminService, SystemSettings as ISystemSettings } from '../../services/adminService';

export const SystemSettings: React.FC = () => {
    const [settings, setSettings] = useState<ISystemSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Sensitive fields state (managed separately to avoid overwriting with masked data)
    const [smtpPass, setSmtpPass] = useState('');
    const [resendApiKey, setResendApiKey] = useState('');

    // Test Email state
    const [testEmailTo, setTestEmailTo] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const res = await adminService.getSettings();
            if (res.success && res.data) {
                setSettings(res.data);
            } else {
                setMessage({ type: 'error', text: 'Failed to load settings' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error loading settings' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof ISystemSettings, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [field]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;

        setSaving(true);
        setMessage(null);

        try {
            // Prepare payload
            const payload: any = { ...settings };

            // Only include sensitive fields if they have been entered
            if (smtpPass) payload.smtpPass = smtpPass;
            if (resendApiKey) payload.resendApiKey = resendApiKey;

            const res = await adminService.updateSettings(payload);
            if (res.success) {
                setMessage({ type: 'success', text: 'Settings updated successfully' });
                // Reset sensitive inputs
                setSmtpPass('');
                setResendApiKey('');
                // Update settings with returned (clean) data
                if (res.data) setSettings(res.data);
            } else {
                setMessage({ type: 'error', text: res.message || 'Failed to update settings' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error saving settings' });
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!testEmailTo) return;

        setSendingTest(true);
        setTestResult(null);

        try {
            const res = await adminService.sendTestEmail(testEmailTo);
            setTestResult({
                success: res.success,
                message: res.success ? (res.message || 'Email sent successfully') : (res.message || 'Failed to send email')
            });
        } catch (err) {
            setTestResult({ success: false, message: 'Error sending test email' });
        } finally {
            setSendingTest(false);
        }
    };

    if (loading && !settings) return <div className="p-8 text-center">Loading settings...</div>;
    if (!settings) return <div className="p-8 text-center text-red-500">Failed to load settings</div>;

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                    <h2 className="text-xl font-semibold text-gray-800">System Configuration</h2>
                    {message && (
                        <div className={`text-sm px-3 py-1 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {message.text}
                        </div>
                    )}
                </div>

                {/* Email Provider Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Provider</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg hover:bg-gray-50 has-[:checked]:border-emerald-500 has-[:checked]:ring-1 has-[:checked]:ring-emerald-500">
                            <input
                                type="radio"
                                name="emailProvider"
                                value="smtp"
                                checked={settings.emailProvider === 'smtp'}
                                onChange={() => handleChange('emailProvider', 'smtp')}
                                className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                                <div className="font-medium text-gray-900">SMTP Server</div>
                                <div className="text-xs text-gray-500">Use your own mail server</div>
                            </div>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg hover:bg-gray-50 has-[:checked]:border-emerald-500 has-[:checked]:ring-1 has-[:checked]:ring-emerald-500">
                            <input
                                type="radio"
                                name="emailProvider"
                                value="resend"
                                checked={settings.emailProvider === 'resend'}
                                onChange={() => handleChange('emailProvider', 'resend')}
                                className="text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                                <div className="font-medium text-gray-900">Resend API</div>
                                <div className="text-xs text-gray-500">Managed email delivery</div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Resend Settings */}
                {settings.emailProvider === 'resend' && (
                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Resend API Key</label>
                            <input
                                type="password"
                                value={resendApiKey}
                                onChange={(e) => setResendApiKey(e.target.value)}
                                placeholder={settings.resendApiKey ? 'Type to replace existing key' : 'Enter Resend API Key'}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2"
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty to keep existing key</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">From Email</label>
                            <input
                                type="email"
                                value={settings.smtpFromEmail || ''}
                                onChange={(e) => handleChange('smtpFromEmail', e.target.value)}
                                placeholder="noreply@yourdomain.com"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2"
                            />
                        </div>
                    </div>
                )}

                {/* SMTP Settings */}
                {settings.emailProvider === 'smtp' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
                            <input
                                type="text"
                                value={settings.smtpHost || ''}
                                onChange={(e) => handleChange('smtpHost', e.target.value)}
                                placeholder="smtp.example.com"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
                            <input
                                type="number"
                                value={settings.smtpPort || ''}
                                onChange={(e) => handleChange('smtpPort', parseInt(e.target.value))}
                                placeholder="587"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">SMTP User</label>
                            <input
                                type="text"
                                value={settings.smtpUser || ''}
                                onChange={(e) => handleChange('smtpUser', e.target.value)}
                                placeholder="user@example.com"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">SMTP Password</label>
                            <input
                                type="password"
                                value={smtpPass}
                                onChange={(e) => setSmtpPass(e.target.value)}
                                placeholder={!!settings.smtpUser ? 'Type to replace existing password' : 'Enter password'}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">From Name</label>
                            <input
                                type="text"
                                value={settings.smtpFromName || ''}
                                onChange={(e) => handleChange('smtpFromName', e.target.value)}
                                placeholder="ZakApp"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">From Email</label>
                            <input
                                type="email"
                                value={settings.smtpFromEmail || ''}
                                onChange={(e) => handleChange('smtpFromEmail', e.target.value)}
                                placeholder="noreply@yourdomain.com"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2"
                            />
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.smtpSecure}
                                    onChange={(e) => handleChange('smtpSecure', e.target.checked)}
                                    className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 h-4 w-4"
                                />
                                <span className="text-sm font-medium text-gray-900">Use Secure Connection (TLS/SSL)</span>
                            </label>
                        </div>
                    </div>
                )}

                <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Registration & Security</h3>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.allowRegistration}
                                onChange={(e) => handleChange('allowRegistration', e.target.checked)}
                                className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 h-4 w-4"
                            />
                            <div>
                                <div className="text-sm font-medium text-gray-900">Allow New User Registration</div>
                                <div className="text-xs text-gray-500">Uncheck to close sign-ups</div>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.requireEmailVerification}
                                onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
                                className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 h-4 w-4"
                            />
                            <div>
                                <div className="text-sm font-medium text-gray-900">Require Email Verification</div>
                                <div className="text-xs text-gray-500">Users must verify their email before logging in</div>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 transition-colors font-medium shadow-sm"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>

            {/* Test Email Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Test Email Configuration</h3>
                <form onSubmit={handleTestEmail} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">To Email Address</label>
                        <input
                            type="email"
                            value={testEmailTo}
                            onChange={(e) => setTestEmailTo(e.target.value)}
                            placeholder="your-email@example.com"
                            required
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border p-2"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={sendingTest || !testEmailTo}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 transition-colors font-medium shadow-sm mb-[1px]"
                    >
                        {sendingTest ? 'Sending...' : 'Send Test Email'}
                    </button>
                </form>
                {testResult && (
                    <div className={`mt-4 p-3 rounded-md text-sm ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {testResult.message}
                    </div>
                )}
            </div>
        </div>
    );
};
