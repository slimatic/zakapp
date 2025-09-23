import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';
import { userService } from '../services/userService.js';
import {
  listUserFiles,
  readUserFile,
  writeUserFile,
  getUserDirectory,
  createUserDirectory,
} from '../utils/fileSystem.js';
import { ERROR_CODES } from '@zakapp/shared';
import fs from 'fs-extra';
import path from 'path';

const router = express.Router();

/**
 * GET /data/export
 * Export all user data
 */
router.get(
  '/export',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'User authentication required',
          },
        });
      }

      // Get user profile
      const userProfile = await userService.getUserById(user.userId);
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'User profile not found',
          },
        });
      }

      // Get all user files
      const userFiles = await listUserFiles(user.userId);
      const userData: Record<string, any> = {
        profile: userProfile,
      };

      // Read all encrypted user data files
      for (const filename of userFiles) {
        try {
          const fileData = await readUserFile(user.userId, filename);
          userData[filename] = fileData;
        } catch (error) {
          console.warn(`Failed to read user file ${filename}:`, error);
          // Continue with other files
        }
      }

      res.json({
        success: true,
        data: {
          exportDate: new Date().toISOString(),
          userData,
        },
      });
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to export user data',
        },
      });
    }
  }
);

/**
 * POST /data/import
 * Import user data
 */
router.post(
  '/import',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'User authentication required',
          },
        });
      }

      const { userData, mergeStrategy = 'merge' } = req.body;

      if (!userData) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'userData is required',
          },
        });
      }

      // Ensure user directory exists
      await createUserDirectory(user.userId);

      let importedCount = 0;
      const importResults: Record<
        string,
        { success: boolean; error?: string }
      > = {};

      // Import each data file
      for (const [filename, fileData] of Object.entries(userData)) {
        if (filename === 'profile') {
          // Skip profile - it's managed separately
          continue;
        }

        try {
          if (mergeStrategy === 'replace') {
            // Replace the entire file
            await writeUserFile(
              user.userId,
              filename,
              fileData as Record<string, unknown>
            );
          } else {
            // Merge with existing data
            let existingData = {};
            try {
              existingData = await readUserFile(user.userId, filename);
            } catch (error) {
              // File doesn't exist, which is fine for new imports
            }

            const mergedData = {
              ...existingData,
              ...(fileData as Record<string, unknown>),
            };
            await writeUserFile(user.userId, filename, mergedData);
          }

          importedCount++;
          importResults[filename] = { success: true };
        } catch (error) {
          console.error(`Failed to import file ${filename}:`, error);
          importResults[filename] = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }

      res.json({
        success: true,
        message: `Successfully imported ${importedCount} data files`,
        data: {
          importedCount,
          results: importResults,
          strategy: mergeStrategy,
        },
      });
    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to import user data',
        },
      });
    }
  }
);

/**
 * POST /data/backup
 * Create a data backup
 */
router.post(
  '/backup',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'User authentication required',
          },
        });
      }

      const backupId = `backup_${user.userId}_${Date.now()}`;
      const backupDate = new Date().toISOString();

      // Create backup directory
      const backupsDir = path.join(process.cwd(), 'data', 'backups');
      await fs.ensureDir(backupsDir);

      const backupPath = path.join(backupsDir, `${backupId}.json`);

      // Get user profile
      const userProfile = await userService.getUserById(user.userId);
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: 'User profile not found',
          },
        });
      }

      // Get all user files
      const userFiles = await listUserFiles(user.userId);
      const backupData: Record<string, any> = {
        profile: userProfile,
      };

      // Read all encrypted user data files
      for (const filename of userFiles) {
        try {
          const fileData = await readUserFile(user.userId, filename);
          backupData[filename] = fileData;
        } catch (error) {
          console.warn(`Failed to backup user file ${filename}:`, error);
          // Continue with other files
        }
      }

      // Create backup file
      const backup = {
        backupId,
        backupDate,
        userId: user.userId,
        username: user.username,
        userData: backupData,
      };

      await fs.writeJson(backupPath, backup, { spaces: 2 });

      res.json({
        success: true,
        data: {
          backupId,
          backupDate,
          message: 'Backup created successfully',
        },
      });
    } catch (error) {
      console.error('Backup error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to create backup',
        },
      });
    }
  }
);

export { router as dataRouter };
