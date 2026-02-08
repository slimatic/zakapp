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

import express from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/auth';
import { MigrationDetectionService } from '../services/MigrationDetectionService';
import { AuthenticatedRequest } from '../types';

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

// Zero-Knowledge Encryption Migration Routes
// GET /api/user/encryption-status - Check if user needs migration
router.get('/encryption-status', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const status = await MigrationDetectionService.getUserEncryptionStatus(userId);
    res.json({ success: true, data: status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// POST /api/user/prepare-migration - Get decrypted legacy data for client re-encryption
router.post('/prepare-migration', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    const data = await MigrationDetectionService.prepareMigrationData(userId);
    res.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

// POST /api/user/mark-migrated - Mark user as fully migrated to ZK1
router.post('/mark-migrated', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.userId!;
    await MigrationDetectionService.markUserMigrated(userId);
    res.json({ success: true, message: 'User marked as migrated to zero-knowledge encryption' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;