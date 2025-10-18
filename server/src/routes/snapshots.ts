import * as express from 'express';
import { authenticate } from '../middleware/AuthMiddleware';
import { validateSchema } from '../middleware/ValidationMiddleware';
import { SnapshotsController } from '../controllers/SnapshotsController';
import { z } from 'zod';

const router = express.Router();
const snapshotsController = new SnapshotsController();

/**
 * Calculation Snapshots Routes
 * All routes require authentication
 */

// POST /api/snapshots - Create new calculation snapshot
const CreateSnapshotSchema = z.object({
  methodology: z.enum(['STANDARD', 'HANAFI', 'SHAFII', 'CUSTOM']),
  methodologyConfigId: z.string().uuid().optional(),
  calendarType: z.enum(['GREGORIAN', 'HIJRI']).optional(),
  referenceDate: z.string().datetime().optional()
});

router.post('/', authenticate, validateSchema(CreateSnapshotSchema), snapshotsController.createSnapshot);

// GET /api/snapshots - Get all snapshots for user
router.get('/', authenticate, snapshotsController.getSnapshots);

// GET /api/snapshots/:id - Get specific snapshot
router.get('/:id', authenticate, snapshotsController.getSnapshot);

// GET /api/snapshots/compare - Compare two snapshots
router.get('/compare', authenticate, snapshotsController.compareSnapshots);

// DELETE /api/snapshots/:id - Delete snapshot
router.delete('/:id', authenticate, snapshotsController.deleteSnapshot);

// POST /api/snapshots/:id/unlock - Unlock snapshot for editing
const UnlockSnapshotSchema = z.object({
  reason: z.string().min(1).max(500)
});

router.post('/:id/unlock', authenticate, validateSchema(UnlockSnapshotSchema), snapshotsController.unlockSnapshot);

// POST /api/snapshots/:id/lock - Lock snapshot
router.post('/:id/lock', authenticate, snapshotsController.lockSnapshot);

// GET /api/snapshots/:id/export - Export snapshot as JSON
router.get('/:id/export', authenticate, snapshotsController.exportSnapshot);

export default router;