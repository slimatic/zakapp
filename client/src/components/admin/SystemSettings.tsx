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
    if (!settings) return <div className="p-8 text-center text-danger">Failed to load settings</div>;

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-border pb-4">
                    <h2 className="text-xl font-semibold text-foreground">System Configuration</h2>
                    {message && (
                        <div className={`text-sm px-3 py-1 rounded-md ${message.type === 'success' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                            {message.text}
                        </div>
                    )}
                </div>

                {/* Email Provider Selection */}
                <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-2">Email Provider</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg hover:bg-muted has-[:checked]:border-secondary has-[:checked]:ring-1 has-[:checked]:ring-ring">
                            <input
                                type="radio"
                                name="emailProvider"
                                value="smtp"
                                checked={settings.emailProvider === 'smtp'}
                                onChange={() => handleChange('emailProvider', 'smtp')}
                                className="text-secondary focus:ring-ring"
                            />
                            <div>
                                <div className="font-medium text-foreground">SMTP Server</div>
                                <div className="text-xs text-muted-foreground">Use your own mail server</div>
                            </div>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg hover:bg-muted has-[:checked]:border-secondary has-[:checked]:ring-1 has-[:checked]:ring-ring">
                            <input
                                type="radio"
                                name="emailProvider"
                                value="resend"
                                checked={settings.emailProvider === 'resend'}
                                onChange={() => handleChange('emailProvider', 'resend')}
                                className="text-secondary focus:ring-ring"
                            />
                            <div>
                                <div className="font-medium text-foreground">Resend API</div>
                                <div className="text-xs text-muted-foreground">Managed email delivery</div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Resend Settings */}
                {settings.emailProvider === 'resend' && (
                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label className="block text-sm font-medium text-foreground/80">Resend API Key</label>
                            <input
                                type="password"
                                value={resendApiKey}
                                onChange={(e) => setResendApiKey(e.target.value)}
                                placeholder={settings.resendApiKey ? 'Type to replace existing key' : 'Enter Resend API Key'}
                                className="mt-1 block w-full rounded-md border-border-strong shadow-sm focus:border-ring focus:ring-ring sm:text-sm border p-2"
                            />
                            <p className="text-xs text-muted-foreground mt-1">Leave empty to keep existing key</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground/80">From Email</label>
                            <input
                                type="email"
                                value={settings.smtpFromEmail || ''}
                                onChange={(e) => handleChange('smtpFromEmail', e.target.value)}
                                placeholder="noreply@yourdomain.com"
                                className="mt-1 block w-full rounded-md border-border-strong shadow-sm focus:border-ring focus:ring-ring sm:text-sm border p-2"
                            />
                        </div>
                    </div>
                )}

                {/* SMTP Settings */}
                {settings.emailProvider === 'smtp' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <label className="block text-sm font-medium text-foreground/80">SMTP Host</label>
                            <input
                                type="text"
                                value={settings.smtpHost || ''}
                                onChange={(e) => handleChange('smtpHost', e.target.value)}
                                placeholder="smtp.example.com"
                                className="mt-1 block w-full rounded-md border-border-strong shadow-sm focus:border-ring focus:ring-ring sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground/80">SMTP Port</label>
                            <input
                                type="number"
                                value={settings.smtpPort || ''}
                                onChange={(e) => handleChange('smtpPort', parseInt(e.target.value))}
                                placeholder="587"
                                className="mt-1 block w-full rounded-md border-border-strong shadow-sm focus:border-ring focus:ring-ring sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground/80">SMTP User</label>
                            <input
                                type="text"
                                value={settings.smtpUser || ''}
                                onChange={(e) => handleChange('smtpUser', e.target.value)}
                                placeholder="user@example.com"
                                className="mt-1 block w-full rounded-md border-border-strong shadow-sm focus:border-ring focus:ring-ring sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground/80">SMTP Password</label>
                            <input
                                type="password"
                                value={smtpPass}
                                onChange={(e) => setSmtpPass(e.target.value)}
                                placeholder={!!settings.smtpUser ? 'Type to replace existing password' : 'Enter password'}
                                className="mt-1 block w-full rounded-md border-border-strong shadow-sm focus:border-ring focus:ring-ring sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground/80">From Name</label>
                            <input
                                type="text"
                                value={settings.smtpFromName || ''}
                                onChange={(e) => handleChange('smtpFromName', e.target.value)}
                                placeholder="ZakApp"
                                className="mt-1 block w-full rounded-md border-border-strong shadow-sm focus:border-ring focus:ring-ring sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground/80">From Email</label>
                            <input
                                type="email"
                                value={settings.smtpFromEmail || ''}
                                onChange={(e) => handleChange('smtpFromEmail', e.target.value)}
                                placeholder="noreply@yourdomain.com"
                                className="mt-1 block w-full rounded-md border-border-strong shadow-sm focus:border-ring focus:ring-ring sm:text-sm border p-2"
                            />
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.smtpSecure}
                                    onChange={(e) => handleChange('smtpSecure', e.target.checked)}
                                    className="rounded border-border-strong text-secondary shadow-sm focus:border-ring focus:ring-ring h-4 w-4"
                                />
                                <span className="text-sm font-medium text-foreground">Use Secure Connection (TLS/SSL)</span>
                            </label>
                        </div>
                    </div>
                )}

                <div className="border-t border-border pt-6">
                    <h3 className="text-lg font-medium text-foreground mb-4">Registration & Security</h3>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.allowRegistration}
                                onChange={(e) => handleChange('allowRegistration', e.target.checked)}
                                className="rounded border-border-strong text-secondary shadow-sm focus:border-ring focus:ring-ring h-4 w-4"
                            />
                            <div>
                                <div className="text-sm font-medium text-foreground">Allow New User Registration</div>
                                <div className="text-xs text-muted-foreground">Uncheck to close sign-ups</div>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.requireEmailVerification}
                                onChange={(e) => handleChange('requireEmailVerification', e.target.checked)}
                                className="rounded border-border-strong text-secondary shadow-sm focus:border-ring focus:ring-ring h-4 w-4"
                            />
                            <div>
                                <div className="text-sm font-medium text-foreground">Require Email Verification</div>
                                <div className="text-xs text-muted-foreground">Users must verify their email before logging in</div>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-secondary text-secondary-foreground px-6 py-2 rounded-lg hover:bg-secondary/90 focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 transition-colors font-medium shadow-sm"
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>

            {/* Test Email Section */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Test Email Configuration</h3>
                <form onSubmit={handleTestEmail} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-foreground/80 mb-1">To Email Address</label>
                        <input
                            type="email"
                            value={testEmailTo}
                            onChange={(e) => setTestEmailTo(e.target.value)}
                            placeholder="your-email@example.com"
                            required
                            className="block w-full rounded-md border-border-strong shadow-sm focus:border-ring focus:ring-ring sm:text-sm border p-2"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={sendingTest || !testEmailTo}
                        className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/90 focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 transition-colors font-medium shadow-sm mb-[1px]"
                    >
                        {sendingTest ? 'Sending...' : 'Send Test Email'}
                    </button>
                </form>
                {testResult && (
                    <div className={`mt-4 p-3 rounded-md text-sm ${testResult.success ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                        {testResult.message}
                    </div>
                )}
            </div>
        </div>
    );
};
