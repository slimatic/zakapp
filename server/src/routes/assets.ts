import express from 'express';
import { AssetController } from '../controllers/AssetController';

const router = express.Router();
const assetController = new AssetController();

// Asset routes
router.get('/', assetController.list.bind(assetController));
router.post('/', assetController.create.bind(assetController));
router.get('/:id', assetController.get.bind(assetController));
router.put('/:id', assetController.update.bind(assetController));
router.delete('/:id', assetController.delete.bind(assetController));
router.post('/validate', assetController.validate.bind(assetController));

export default router;