import { Router } from 'express';
import { authenticate } from '../../middlewares';
import { authRateLimit } from '../../middlewares';
import * as authController from './auth.controller';

const router = Router();

router.post('/register', authRateLimit, authController.register);
router.post('/login', authRateLimit, authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', authRateLimit, authController.forgotPassword);
router.post('/reset-password/:token', authRateLimit, authController.resetPassword);
router.get('/me', authenticate, authController.getMe);
router.put('/me', authenticate, authController.updateMe);
router.put('/me/password', authenticate, authController.changePassword);

export { router as authRouter };
