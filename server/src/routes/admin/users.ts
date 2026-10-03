
import express from 'express';
import { getUsers, deleteUser, updateUserRole, updateUserLimits, updateUserStatus, updateAllUserLimits } from '../../controllers/AdminController';
import { requireAdmin, authenticate } from '../../middleware/AuthMiddleware';

const router = express.Router();

// Static paths first: Express matches in order, and `PUT /limits/all` would be
// swallowed by `PUT /:id/limits` (id="limits") if it were declared after it.
router.put('/limits/all', authenticate, requireAdmin, updateAllUserLimits);

router.get('/', authenticate, requireAdmin, getUsers);
router.delete('/:id', authenticate, requireAdmin, deleteUser);
router.patch('/:id/role', authenticate, requireAdmin, updateUserRole);
router.patch('/:id/status', authenticate, requireAdmin, updateUserStatus);
router.patch('/:id/limits', authenticate, requireAdmin, updateUserLimits);

export default router;
