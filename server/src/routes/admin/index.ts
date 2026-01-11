
import express from 'express';
import encryptionRoutes from './encryption';
import usersRoutes from './users';
import statsRoutes from './stats';
import settingsRoutes from './settings';

const router = express.Router();

router.use('/encryption', encryptionRoutes);
router.use('/users', usersRoutes);
router.use('/stats', statsRoutes);
router.use('/settings', settingsRoutes);

export default router;
