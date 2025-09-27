import express from 'express';
import { DataController } from '../controllers/DataController';

const router = express.Router();
const dataController = new DataController();

// Data management routes
router.post('/export', dataController.exportData.bind(dataController));
router.post('/import', dataController.importData.bind(dataController));
router.post('/backup', dataController.createBackup.bind(dataController));
router.get('/backups', dataController.listBackups.bind(dataController));
router.post('/restore/:id', dataController.restoreBackup.bind(dataController));

export default router;