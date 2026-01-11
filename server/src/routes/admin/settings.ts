import express from 'express';
import { authenticate, requireAdmin } from '../../middleware/AuthMiddleware';
import { SettingsService } from '../../services/SettingsService';
import { emailService } from '../../services/EmailService';
import { asyncHandler } from '../../middleware/ErrorHandler';
import { prisma } from '../../utils/prisma';

const router = express.Router();

router.use(authenticate);
router.use(requireAdmin);

/**
 * GET /api/admin/settings
 * Get current system settings (masked)
 */
router.get('/', asyncHandler(async (req, res) => {
    const settings = await SettingsService.getSettings();
    res.json({
        success: true,
        data: settings
    });
}));

/**
 * PUT /api/admin/settings
 * Update system settings
 */
router.put('/', asyncHandler(async (req, res) => {
    const updatedSettings = await SettingsService.updateSettings(req.body);
    const cleanSettings = await SettingsService.getSettings(); // Return clean/masked

    res.json({
        success: true,
        message: 'Settings updated successfully',
        data: cleanSettings
    });
}));

/**
 * POST /api/admin/settings/test-email
 * Send a test email to verify configuration
 */
router.post('/test-email', asyncHandler(async (req, res) => {
    const { to } = req.body;
    if (!to) {
        res.status(400).json({ success: false, error: 'Recipient email is required' });
        return;
    }

    const sent = await emailService.sendEmail(
        to,
        'Test Email from ZakApp',
        '<h1>SMTP Configuration Successful</h1><p>This is a test email from your ZakApp instance.</p><p>If you received this, your email settings are working correctly.</p>'
    );

    if (sent) {
        res.json({ success: true, message: 'Test email sent successfully' });
    } else {
        res.status(500).json({ success: false, error: 'Failed to send test email. Check server logs.' });
    }
}));

/**
 * POST /api/admin/users/:userId/verify
 * Manually verify a user
 */
router.post('/users/:userId/verify', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    await prisma.user.update({
        where: { id: userId },
        data: {
            isVerified: true,
            verificationToken: null,
            verificationTokenExpires: null
        }
    });

    res.json({ success: true, message: 'User manually verified' });
}));

export default router;
