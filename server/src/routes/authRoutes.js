import { Router } from 'express';
import * as ctrl from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { uploadImage } from '../middleware/upload.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../utils/validators.js';

const router = Router();

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', validate(loginSchema), ctrl.login);
router.get('/me', authenticate, ctrl.me);
router.patch('/profile', authenticate, validate(updateProfileSchema), ctrl.updateProfile);
router.post('/avatar', authenticate, uploadImage.single('avatar'), ctrl.uploadAvatar);
router.post('/change-password', authenticate, validate(changePasswordSchema), ctrl.changePassword);

export default router;
