import express from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();
const userController = new UserController();

// All user routes require authentication
router.use(authMiddleware);

// User management routes
router.get('/profile', userController.getProfile.bind(userController));
router.put('/profile', userController.updateProfile.bind(userController));
router.get('/settings', userController.getSettings.bind(userController));
router.put('/settings', userController.updateSettings.bind(userController));
router.post('/change-password', userController.changePassword.bind(userController));
router.delete('/account', userController.deleteAccount.bind(userController));
router.get('/sessions', userController.getSessions.bind(userController));
router.delete('/sessions/:id', userController.deleteSession.bind(userController));

// Export and data management routes
router.post('/export-request', userController.exportRequest.bind(userController));
router.get('/export-status/:requestId', userController.exportStatus.bind(userController));

// Privacy and security routes
router.get('/privacy-settings', userController.getPrivacySettings.bind(userController));
router.put('/privacy-settings', userController.updatePrivacySettings.bind(userController));
router.get('/audit-log', userController.getAuditLog.bind(userController));

// Backup and restore routes
router.post('/backup', userController.backup.bind(userController));
router.post('/restore', userController.restore.bind(userController));

export default router;