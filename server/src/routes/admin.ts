import express from 'express';
import { AdminController } from '../controllers/AdminController';
import { authMiddleware, requireAdmin } from '../middleware/auth';

const router = express.Router();
const adminController = new AdminController();

// Protect all admin routes
router.use(authMiddleware);
router.use(requireAdmin);

// User Management
router.get('/users', adminController.getUsers.bind(adminController));
router.post('/users', adminController.createUser.bind(adminController));
router.delete('/users/:id', adminController.deleteUser.bind(adminController));

export default router;
