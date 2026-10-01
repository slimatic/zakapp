import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { SettingsService } from './SettingsService';
import { Logger } from '../utils/logger';

const logger = new Logger('EmailService');

/**
 * Fallback sender when nothing is configured (DB setting, SMTP_FROM, RESEND_API_KEY).
 *
 * Was hardcoded 4x as 'noreply@zakapp.io' - a domain that is NOT REGISTERED and does not
 * resolve, while the app itself lives on zakapp.org. Mail sent with an unresolvable domain
 * in From: fails SPF alignment and reads as a spoofed sender. zakapp.org has working
 * sending infrastructure (Resend DKIM at resend._domainkey, SPF on send.zakapp.org), so
 * that is the correct domain.
 *
 * Overridable by config; this is only the last-resort default.
 */
const DEFAULT_FROM = process.env.SMTP_FROM || 'noreply@zakapp.org';


export class EmailService {
    private static instance: EmailService;

    private constructor() { }

    public static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    /**
     * Resolve configuration from DB or Env
     */
    private async getConfig() {
        // 1. Try DB first
        const dbSettings = await SettingsService.getDecryptedSettings();
        if (dbSettings && dbSettings.emailProvider) {
            // Check if minimal required fields are present
            if (dbSettings.emailProvider === 'resend' && dbSettings.resendApiKey) {
                return {
                    provider: 'resend',
                    apiKey: dbSettings.resendApiKey,
                    from: dbSettings.smtpFromEmail || DEFAULT_FROM,
                    name: dbSettings.smtpFromName || 'ZakApp'
                };
            }

            if (dbSettings.emailProvider === 'smtp' && dbSettings.smtpHost) {
                return {
                    provider: 'smtp',
                    host: dbSettings.smtpHost,
                    port: dbSettings.smtpPort || 587,
                    secure: dbSettings.smtpSecure,
                    user: dbSettings.smtpUser,
                    pass: dbSettings.smtpPass,
                    from: dbSettings.smtpFromEmail || DEFAULT_FROM,
                    name: dbSettings.smtpFromName || 'ZakApp'
                };
            }
        }

        // 2. Fallback to Env
        if (process.env.RESEND_API_KEY) {
            return {
                provider: 'resend',
                apiKey: process.env.RESEND_API_KEY,
                from: DEFAULT_FROM,
                name: process.env.SMTP_FROM_NAME || 'ZakApp'
            };
        }

        if (process.env.SMTP_HOST) {
            return {
                provider: 'smtp',
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
                from: DEFAULT_FROM,
                name: process.env.SMTP_FROM_NAME || 'ZakApp'
            };
        }

        return null; // No email config available
    }

    /**
     * Send an email
     */
    async sendEmail(to: string, subject: string, html: string, text?: string): Promise<boolean> {
        const config = await this.getConfig();
        if (!config) {
            logger.warn('EmailService: No configuration found. Email not sent.');

            return false;
        }

        try {
            const from = `"${config.name}" <${config.from}>`;

            if (config.provider === 'resend' && config.apiKey) {
                const resend = new Resend(config.apiKey);
                const { error } = await resend.emails.send({
                    from,
                    to,
                    subject,
                    html,
                    text
                });

                if (error) {
                    logger.error('Resend Error:', error);

                    return false;
                }
                return true;
            }

            if (config.provider === 'smtp' && config.host) {
                const transporter = nodemailer.createTransport({
                    host: config.host,
                    port: config.port,
                    secure: config.secure,
                    auth: config.user ? {
                        user: config.user,
                        pass: config.pass
                    } : undefined
                });

                await transporter.sendMail({
                    from,
                    to,
                    subject,
                    html,
                    text
                });
                return true;
            }
        } catch (error) {
            logger.error('EmailService Error:', error);

            return false;
        }

        return false;
    }

    /**
     * Send verification email
     */
    async sendVerificationEmail(to: string, token: string, firstName?: string, username?: string): Promise<boolean> {
        // Determine base URL (could be from env or settings)
        const baseUrl = process.env.APP_URL || 'http://localhost:5173';
        const link = `${baseUrl}/verify-email?token=${token}`;

        const currentYear = new Date().getFullYear();
        const logoUrl = `${baseUrl}/images/logo.png`;

        const subject = 'Verify your email for ZakApp';

        // Personalize greeting
        // Personalize greeting
        // Note: firstName is encrypted (ZK), so we cannot use it in server-side emails.
        const greeting = 'Salam, Welcome to ZakApp!';

        const usernameDisplay = username ? `<p style="margin: 0 0 16px 0; color: #4b5563; font-size: 14px;">Username: <strong>${username}</strong></p>` : '';

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify your email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 0 30px 0; background-color: #ffffff; border-bottom: 1px solid #f3f4f6;">
                            <img src="${logoUrl}" alt="ZakApp Logo" width="64" height="64" style="display: block; width: 64px; height: 64px; border-radius: 12px;">
                            <h1 style="margin: 16px 0 0 0; color: #059669; font-size: 24px; font-weight: 700;">ZakApp</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">${greeting}</h2>
                            ${usernameDisplay}
                            <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 24px;">
                                Thank you for joining us. Please verify your email address to secure your account and access all features.
                            </p>
                            
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${link}" style="display: inline-block; padding: 14px 32px; background-color: #10B981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                                If the button above doesn't work, verify by copying and pasting this link into your browser:
                            </p>
                            <p style="margin: 0; word-break: break-all; color: #10B981; font-size: 14px;">
                                <a href="${link}" style="color: #10B981; text-decoration: none;">${link}</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #f3f4f6;">
                            <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                © ${currentYear} ZakApp. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

        return this.sendEmail(to, subject, html);
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
        // Determine base URL (could be from env or settings)
        const baseUrl = process.env.APP_URL || 'http://localhost:5173';
        const link = `${baseUrl}/reset-password?token=${resetToken}`;

        const currentYear = new Date().getFullYear();
        const logoUrl = `${baseUrl}/images/logo.png`;

        const subject = 'Reset your password for ZakApp';

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 0; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 0 30px 0; background-color: #ffffff; border-bottom: 1px solid #f3f4f6;">
                            <img src="${logoUrl}" alt="ZakApp Logo" width="64" height="64" style="display: block; width: 64px; height: 64px; border-radius: 12px;">
                            <h1 style="margin: 16px 0 0 0; color: #059669; font-size: 24px; font-weight: 700;">ZakApp</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">Reset your password</h2>
                            <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 16px; line-height: 24px;">
                                We received a request to reset your password. Click the button below to set a new password.
                            </p>
                            
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${link}" style="display: inline-block; padding: 14px 32px; background-color: #10B981; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                                If the button above doesn't work, reset your password by copying and pasting this link into your browser:
                            </p>
                            <p style="margin: 0; word-break: break-all; color: #10B981; font-size: 14px;">
                                <a href="${link}" style="color: #10B981; text-decoration: none;">${link}</a>
                            </p>
                            
                            <p style="margin: 24px 0 0 0; color: #dc2626; font-size: 14px; font-weight: 500;">
                                ⚠️ This link will expire in 1 hour for security reasons.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #f3f4f6;">
                            <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                © ${currentYear} ZakApp. All rights reserved.
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

        return this.sendEmail(to, subject, html);
    }

    /**
     * Send a verification email and report whether it actually left.
     *
     * Callers must branch on this. Registration previously ignored it, so a failed
     * send still returned 201 while the user was told to check an inbox that would
     * never receive anything.
     */
    async sendVerificationEmailChecked(
        to: string,
        token: string,
        firstName?: string,
        username?: string
    ): Promise<{ sent: boolean; error?: string }> {
        try {
            const sent = await this.sendVerificationEmail(to, token, firstName, username);
            return sent ? { sent: true } : { sent: false, error: 'sendVerificationEmail returned false' };
        } catch (err) {
            return { sent: false, error: err instanceof Error ? err.message : String(err) };
        }
    }

    /**
     * Operator-visible email configuration state, with no secret material.
     * Lets an admin see WHY sending fails without reading server logs.
     */
    async describeConfig(): Promise<{
        configured: boolean;
        provider: string | null;
        from: string | null;
        host: string | null;
        port: number | null;
        secure: boolean | null;
        issue: string | null;
    }> {
        try {
            const config = await this.getConfig();
            if (!config) {
                return {
                    configured: false, provider: null, from: null,
                    host: null, port: null, secure: null,
                    issue: 'No email provider is configured. Set it in System Settings.'
                };
            }

            const from = (config as any).from || null;
            const issue = from
                ? null
                : 'No sender address is configured. Sending will likely be rejected.';

            return {
                configured: true,
                provider: (config as any).provider ?? null,
                from,
                host: (config as any).host ?? null,
                port: (config as any).port ?? null,
                secure: (config as any).secure ?? null,
                issue
            };
        } catch (err) {
            return {
                configured: false, provider: null, from: null,
                host: null, port: null, secure: null,
                issue: err instanceof Error ? err.message : 'Failed to read email configuration'
            };
        }
    }
}

export const emailService = EmailService.getInstance();
