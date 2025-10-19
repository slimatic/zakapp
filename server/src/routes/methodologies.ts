import * as express from 'express';
import { authenticate } from '../middleware/AuthMiddleware';
import { validateSchema } from '../middleware/ValidationMiddleware';
import {
  getMethodologies,
  getMethodology,
  updateMethodology,
  createCustomMethodology,
  deleteCustomMethodology
} from '../controllers/methodologyController';
import { z } from 'zod';

const router = express.Router();

/**
 * Methodology Configuration Routes
 * All routes require authentication
 */

// GET /api/methodologies - Get all methodologies (fixed + custom)
router.get('/', authenticate, getMethodologies);

// GET /api/methodologies/:id - Get specific methodology
router.get('/:id', authenticate, getMethodology);

// PUT /api/methodologies/:id - Update methodology (only custom ones)
const UpdateMethodologySchema = z.object({
  name: z.string().optional(),
  nisabBasis: z.string().optional(),
  customNisabValue: z.number().positive().optional(),
  rate: z.number().min(0).max(100).optional(),
  assetRules: z.record(z.unknown()).optional()
});

router.put('/:id', authenticate, validateSchema(UpdateMethodologySchema), updateMethodology);

// POST /api/methodologies/custom - Create custom methodology
const CreateCustomMethodologySchema = z.object({
  name: z.string().min(1),
  nisabBasis: z.string(),
  customNisabValue: z.number().positive().optional(),
  rate: z.number().min(0).max(100),
  assetRules: z.record(z.unknown())
});

router.post('/custom', authenticate, validateSchema(CreateCustomMethodologySchema), createCustomMethodology);

// DELETE /api/methodologies/:id - Delete custom methodology
router.delete('/:id', authenticate, deleteCustomMethodology);

export default router;