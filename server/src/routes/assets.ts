import express from 'express';
import { AssetController } from '../controllers/AssetController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const assetController = new AssetController();

// Apply authentication to all routes
router.use(authenticateToken);

// Asset routes
router.get('/', assetController.list.bind(assetController));
router.get('/export', assetController.export.bind(assetController));
router.post('/', assetController.create.bind(assetController));
router.post('/bulk', assetController.bulkCreate.bind(assetController));
router.post('/import', assetController.import.bind(assetController));
router.get('/:id', assetController.get.bind(assetController));
router.put('/:id', assetController.update.bind(assetController));
router.delete('/:id', assetController.delete.bind(assetController));
router.post('/validate', assetController.validate.bind(assetController));

export default router;