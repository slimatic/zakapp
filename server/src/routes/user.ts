import express from 'express';
import { UserController } from '../controllers/UserController';

const router = express.Router();
const userController = new UserController();

// User management routes
router.get('/profile', userController.getProfile.bind(userController));
router.put('/profile', userController.updateProfile.bind(userController));
router.post('/change-password', userController.changePassword.bind(userController));
router.get('/sessions', userController.getSessions.bind(userController));
router.delete('/session/:id', userController.deleteSession.bind(userController));

export default router;