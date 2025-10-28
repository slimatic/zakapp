import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { ExportController } from '../controllers/ExportController';

const router = Router();
const exportController = new ExportController();

// All export routes require authentication
router.use(authMiddleware);

// Export routes
router.post('/full', exportController.full.bind(exportController));
router.post('/assets', exportController.assets.bind(exportController));
router.post('/zakat-history', exportController.zakatHistory.bind(exportController));
router.post('/payments', exportController.payments.bind(exportController));
router.get('/templates', exportController.templates.bind(exportController));
router.post('/custom', exportController.custom.bind(exportController));
router.get('/status/:exportId', exportController.status.bind(exportController));
router.get('/download/:exportId', exportController.download.bind(exportController));
router.delete('/:exportId', exportController.delete.bind(exportController));

export default router;