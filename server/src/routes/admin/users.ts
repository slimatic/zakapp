
import express from 'express';
import { getUsers, deleteUser, updateUserRole, updateUserLimits } from '../../controllers/AdminController';
import { requireAdmin, authenticate } from '../../middleware/AuthMiddleware';

const router = express.Router();

router.get('/', authenticate, requireAdmin, getUsers);
router.delete('/:id', authenticate, requireAdmin, deleteUser);
router.patch('/:id/role', authenticate, requireAdmin, updateUserRole);
router.patch('/:id/limits', authenticate, requireAdmin, updateUserLimits);

export default router;
