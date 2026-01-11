import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { SettingsService } from './SettingsService';

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
                    from: dbSettings.smtpFromEmail || process.env.SMTP_FROM || 'noreply@zakapp.io',
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
                    from: dbSettings.smtpFromEmail || process.env.SMTP_FROM || 'noreply@zakapp.io',
                    name: dbSettings.smtpFromName || 'ZakApp'
                };
            }
        }

        // 2. Fallback to Env
        if (process.env.RESEND_API_KEY) {
            return {
                provider: 'resend',
                apiKey: process.env.RESEND_API_KEY,
                from: process.env.SMTP_FROM || 'noreply@zakapp.io',
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
                from: process.env.SMTP_FROM || 'noreply@zakapp.io',
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
            console.warn('EmailService: No configuration found. Email not sent.');
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
                    console.error('Resend Error:', error);
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
            console.error('EmailService Error:', error);
            return false;
        }

        return false;
    }

    /**
     * Send verification email
     */
    async sendVerificationEmail(to: string, token: string): Promise<boolean> {
        // Determine base URL (could be from env or settings)
        const baseUrl = process.env.APP_URL || 'http://localhost:5173';
        const link = `${baseUrl}/verify-email?token=${token}`;

        const subject = 'Verify your email for ZakApp';
        const html = `
      <h1>Welcome to ZakApp</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${link}" style="display:inline-block;padding:12px 24px;background:#10B981;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">Verify Email</a>
      <p>Or paste this link in your browser: <br/> ${link}</p>
      <p>This link expires in 24 hours.</p>
    `;

        return this.sendEmail(to, subject, html);
    }
}

export const emailService = EmailService.getInstance();
