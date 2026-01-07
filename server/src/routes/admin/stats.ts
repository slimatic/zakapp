
import express from 'express';
import { getStats } from '../../controllers/AdminController';
import { requireAdmin, authenticate } from '../../middleware/AuthMiddleware';

const router = express.Router();

router.get('/', authenticate, requireAdmin, getStats);

export default router;
