import express from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/auth';
import { getLastResetToken } from '../utils/resetTokens';

const router = express.Router();
const authController = new AuthController();

// Authentication routes
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/refresh', authController.refresh.bind(authController));
router.post('/logout', authenticateToken, authController.logout.bind(authController));
router.get('/me', authenticateToken, authController.me.bind(authController));
router.post('/reset-password', authController.resetPassword.bind(authController));
router.post('/confirm-reset', authController.confirmReset.bind(authController));

// Test helper endpoint - only in test environment
if (process.env.NODE_ENV === 'test') {
  router.get('/test/last-reset-token', (req, res) => {
    res.json({ resetToken: getLastResetToken() });
  });
}

export default router;