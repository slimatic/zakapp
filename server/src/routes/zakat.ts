import express from 'express';
import { ZakatController } from '../controllers/ZakatController';

const router = express.Router();
const zakatController = new ZakatController();

// Zakat calculation routes
router.post('/calculate', zakatController.calculate.bind(zakatController));
router.post('/simulate', zakatController.simulate.bind(zakatController));
router.get('/nisab', zakatController.getNisab.bind(zakatController));
router.post('/snapshot', zakatController.createSnapshot.bind(zakatController));
router.get('/snapshots', zakatController.listSnapshots.bind(zakatController));
router.get('/snapshot/:id', zakatController.getSnapshot.bind(zakatController));
router.post('/payment', zakatController.recordPayment.bind(zakatController));
router.post('/payments', zakatController.recordPayment.bind(zakatController)); // Alternative route
router.get('/payments', zakatController.listPayments.bind(zakatController));
router.get('/methodologies', zakatController.listMethodologies.bind(zakatController));
router.get('/history', zakatController.getHistory.bind(zakatController));
router.get('/reports/:id', zakatController.getReport.bind(zakatController));
router.post('/schedule', zakatController.createSchedule.bind(zakatController));

export default router;