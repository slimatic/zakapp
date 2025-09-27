import express from 'express';
import { SystemController } from '../controllers/SystemController';

const router = express.Router();
const systemController = new SystemController();

// System information routes
router.get('/health', systemController.health.bind(systemController));
router.get('/currencies', systemController.getCurrencies.bind(systemController));
router.get('/timezones', systemController.getTimezones.bind(systemController));

export default router;