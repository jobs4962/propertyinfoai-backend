import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { validate } from '../middleware/validationMiddleware.js';
import { signupSchema, loginSchema } from '../validators/authValidator.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

export default router;
