import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { ImportController } from '../controllers/ImportController';

const router = Router();
const importController = new ImportController();

// All import routes require authentication
router.use(authMiddleware);

// Import routes
router.post('/validate', importController.validate.bind(importController));

export default router;